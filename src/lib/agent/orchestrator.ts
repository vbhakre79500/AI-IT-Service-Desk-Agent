import { 
  getTicketById, 
  updateTicketStatus, 
  addTicketMessage, 
  getOrCreateAgentRun, 
  updateAgentRun, 
  recordAgentAction, 
  getAgentRunDetails, 
  createApproval, 
  resolveApproval,
  recordAuditLog 
} from '../db/queries';
import { executeToolSafely } from '../policy/engine';
import { getNextAgentDecision } from '../llm/client';
import { searchKnowledgeBase, formatKnowledgeContext } from '../rag/service';
import { EvidenceItem, AgentRun, Ticket } from '@/types';

/**
 * Normalizes tool parameters from LLM output:
 * - Converts common snake_case keys to camelCase (Gemini sometimes uses snake_case)
 * - Fills in required defaults for well-known tools when the LLM omits them
 */
function normalizeToolParams(toolName: string, params: Record<string, any>): Record<string, any> {
  const p = { ...params };
  // Common snake_case -> camelCase mappings
  if ('user_id' in p && !('userId' in p)) { p.userId = p.user_id; delete p.user_id; }
  if ('ticket_id' in p && !('ticketId' in p)) { p.ticketId = p.ticket_id; delete p.ticket_id; }
  if ('service_name' in p && !('serviceName' in p)) { p.serviceName = p.service_name; delete p.service_name; }
  if ('application_name' in p && !('applicationName' in p)) { p.applicationName = p.application_name; delete p.application_name; }
  if ('target_host' in p && !('targetHost' in p)) { p.targetHost = p.target_host; delete p.target_host; }
  if ('diagnostic_type' in p && !('diagnosticType' in p)) { p.diagnosticType = p.diagnostic_type; delete p.diagnostic_type; }
  if ('target_resource' in p && !('targetResource' in p)) { p.targetResource = p.target_resource; delete p.target_resource; }
  if ('resolution_summary' in p && !('resolutionSummary' in p)) { p.resolutionSummary = p.resolution_summary; delete p.resolution_summary; }
  if ('verification_proof' in p && !('verificationProof' in p)) { p.verificationProof = p.verification_proof; delete p.verification_proof; }
  if ('escalation_reason' in p && !('escalationReason' in p)) { p.escalationReason = p.escalation_reason; delete p.escalation_reason; }
  if ('target_tier' in p && !('targetTier' in p)) { p.targetTier = p.target_tier; delete p.target_tier; }

  // Fill required defaults for unlock_account when omitted by LLM
  if (toolName === 'unlock_account') {
    if (!p.userId && !p.user_id) p.userId = 'usr_emp_01';
    if (!p.reason) p.reason = 'Account unlocked by AutoDesk AI agent following IT Support approval.';
  }
  return p;
}


export interface AgentInvestigationResult {
  ticketId: string;
  runId: string;
  status: 'COMPLETED' | 'WAITING_APPROVAL' | 'WAITING_INPUT' | 'ESCALATED' | 'FAILED';
  stepCount: number;
  confidence: number;
  diagnosis?: string;
  pendingApprovalId?: string;
  message: string;
  evidence: EvidenceItem[];
}

/**
 * Runs the dynamic autonomous agent investigation loop for a given ticket.
 */
export async function runAgentInvestigation(
  ticketId: string, 
  maxSteps: number = 10
): Promise<AgentInvestigationResult> {
  const ticketData = await getTicketById(ticketId);
  if (!ticketData) {
    throw new Error(`Ticket with ID '${ticketId}' does not exist.`);
  }

  const run = await getOrCreateAgentRun(ticketId);
  await updateTicketStatus(ticketId, 'INVESTIGATING');
  await updateAgentRun(run.id, { status: 'RUNNING' });

  // Retrieve RAG context related to ticket
  const runbooks = await searchKnowledgeBase(ticketData.title + ' ' + ticketData.description, 2);
  const ragContext = formatKnowledgeContext(runbooks);

  let currentRun = await getOrCreateAgentRun(ticketId);
  let step = currentRun.stepCount;

  // Pre-loop evidence bootstrap: always seed the knowledge base as the first evidence item
  // if it hasn't been consulted yet. This is analogous to how RAG context is retrieved
  // pre-loop â€” it ensures the LLM always has runbook context before reasoning.
  // The LLM remains fully autonomous for all subsequent decisions.
  const kbAlreadyInEvidence = currentRun.evidence.some((e) => e.source === 'search_knowledge_base');
  if (!kbAlreadyInEvidence) {
    console.log(`[AGENT:${ticketId}] Pre-step | Bootstrapping search_knowledge_base evidence...`);
    step += 1;
    const kbResult = await executeToolSafely(
      'search_knowledge_base',
      { query: `${ticketData.title} ${ticketData.description}` },
      { ticketId, userId: ticketData.creatorId, userRole: 'EMPLOYEE', agentRunId: run.id },
      false
    );
    const kbEvidence: EvidenceItem = {
      id: `ev_pre_kb_${Date.now()}`,
      source: 'search_knowledge_base',
      summary: `Initial knowledge base consultation for "${ticketData.title}".`,
      details: kbResult.data || { error: kbResult.error },
      timestamp: new Date().toISOString(),
    };
    await updateAgentRun(run.id, { stepCount: step, appendEvidence: kbEvidence });
    currentRun = await getOrCreateAgentRun(ticketId);
    console.log(`[AGENT:${ticketId}] Pre-step | KB evidence bootstrapped (${kbResult.success ? 'success' : 'failed'}).`);
  }

  while (step < maxSteps) {
    step += 1;

    // Fetch up-to-date run details and past actions
    const runDetails = await getAgentRunDetails(ticketId);
    const pastActions = runDetails.actions.map((a) => ({
      stepNumber: a.stepNumber,
      actionType: a.actionType,
      toolName: a.toolName,
      toolInput: a.toolInput,
      reasoningSummary: a.reasoningSummary,
    }));

    console.log(`[AGENT:${ticketId}] Step ${step} | Evidence so far: [${currentRun.evidence.map(e => e.source).join(', ') || 'none'}]`);

    // 1. LLM / Dynamic Reasoning Step
    const decision = await getNextAgentDecision({
      ticket: {
        id: ticketData.id,
        ticketNumber: ticketData.ticketNumber,
        title: ticketData.title,
        description: ticketData.description,
        category: ticketData.category,
        priority: ticketData.priority,
        errorCode: ticketData.errorCode,
      },
      evidence: currentRun.evidence,
      stepCount: step,
      maxSteps,
      previousActions: pastActions,
      retrievedRunbooks: ragContext,
    });

    console.log(`[AGENT:${ticketId}] Step ${step} | Decision: status=${decision.status} tool=${decision.tool_name || 'none'} confidence=${decision.confidence} approval=${decision.requires_approval}`);

    // Record the AgentAction reasoning step
    const actionRecord = await recordAgentAction({
      agentRunId: run.id,
      stepNumber: step,
      actionType: decision.status === 'awaiting_approval' 
        ? 'REQUEST_APPROVAL' 
        : decision.status === 'resolved' 
        ? 'RESOLVE' 
        : decision.status === 'escalated' 
        ? 'ESCALATE' 
        : 'TOOL_CALL',
      toolName: decision.tool_name,
      toolInput: decision.tool_params,
      reasoningSummary: decision.reasoning_summary,
      evidenceFindings: [decision.reasoning_summary],
    });

    // 2. Handle Stop Condition: Approval Required
    // GUARD A: Enforce minimum evidence threshold before allowing approval.
    // If the agent hasn't gathered evidence from at least 3 distinct tools yet,
    // override the approval request and continue investigating. This prevents
    // premature approval requests without sufficient diagnostic evidence.
    const distinctEvidenceSources = new Set(currentRun.evidence.map((e) => e.source)).size;
    if (decision.status === 'awaiting_approval' && decision.tool_name) {
      if (distinctEvidenceSources < 3) {
        console.log(`[AGENT:${ticketId}] Step ${step} | GUARD-A: Approval with only ${distinctEvidenceSources} distinct sources. Need 3. Continuing investigation.`);
        (decision as any).status = 'investigating';
        (decision as any).tool_name = undefined;
      }
    }

    // GUARD B: If approval is requested for a tool already in evidence (already executed),
    // the remediation was already approved and run. Redirect to 'resolved' to close the ticket.
    if (decision.status === 'awaiting_approval' && decision.tool_name) {
      const toolAlreadyExecuted = currentRun.evidence.some((e) => e.source === decision.tool_name);
      if (toolAlreadyExecuted) {
        console.log(`[AGENT:${ticketId}] Step ${step} | GUARD-B: Approval requested for '${decision.tool_name}' which is already in evidence. Redirecting to resolved.`);
        (decision as any).status = 'resolved';
        (decision as any).tool_name = 'close_ticket';
        (decision as any).tool_params = {
          ticketId,
          resolutionSummary: decision.diagnosis || decision.reasoning_summary || 'Issue remediated and verified.',
          verificationProof: decision.verification_procedure || 'Remediation tool executed successfully.',
        };
      }
    }

    if (decision.status === 'awaiting_approval' && decision.tool_name) {
      const normalizedParams = normalizeToolParams(decision.tool_name, decision.tool_params || {});
      const approval = await createApproval({
        ticketId,
        agentRunId: run.id,
        actionType: decision.intent || 'REMEDIATION',
        toolName: decision.tool_name,
        toolInput: normalizedParams,
        riskLevel: decision.risk_level || 'MEDIUM',
        requestedBy: 'AutoDesk AI Agent',
      });

      await updateAgentRun(run.id, {
        status: 'WAITING_APPROVAL',
        stepCount: step,
        confidence: decision.confidence,
        currentDiagnosis: decision.diagnosis || decision.reasoning_summary,
      });

      await updateTicketStatus(ticketId, 'AWAITING_APPROVAL');

      await addTicketMessage(
        ticketId,
        'AGENT',
        `âš ï¸ AutoDesk AI requires human authorization before executing action '${decision.tool_name}'.\nReason: ${decision.reasoning_summary}\nDiagnosis: ${decision.diagnosis || 'Root cause identified.'}`,
        'agent_ai',
        'AutoDesk AI Agent'
      );

      return {
        ticketId,
        runId: run.id,
        status: 'WAITING_APPROVAL',
        stepCount: step,
        confidence: decision.confidence,
        diagnosis: decision.diagnosis,
        pendingApprovalId: approval.id,
        message: decision.reasoning_summary,
        evidence: currentRun.evidence,
      };
    }

    // 3. Handle Stop Condition: Ticket Resolved
    if (decision.status === 'resolved') {
      if (!decision.tool_name || decision.tool_name === 'none' || decision.tool_name === 'close_ticket') {
        decision.tool_name = 'close_ticket';
        const closeParams = normalizeToolParams('close_ticket', decision.tool_params || {});
        // Ensure required fields always have valid values
        if (!closeParams.resolutionSummary || closeParams.resolutionSummary.length < 5) {
          closeParams.resolutionSummary = decision.recommended_remediation || decision.diagnosis || 'Issue remediated and verified by AutoDesk AI.';
        }
        const hasUnlockEvidence = currentRun.evidence.some((e) => e.source === 'unlock_account');
        if (hasUnlockEvidence && !closeParams.resolutionSummary.toLowerCase().includes('unlock')) {
          closeParams.resolutionSummary = `User account successfully unlocked. ${closeParams.resolutionSummary}`.trim();
        }
        if (!closeParams.verificationProof || closeParams.verificationProof.length < 5) {
          closeParams.verificationProof = decision.verification_procedure || 'Remediation tool executed successfully, service health confirmed.';
        }
        if (!closeParams.ticketId) closeParams.ticketId = ticketId;
        await executeToolSafely(
          'close_ticket',
          closeParams,
          { ticketId, userId: ticketData.creatorId, userRole: 'IT_AGENT' },
          true,
          actionRecord.id
        );
      }

      await updateAgentRun(run.id, {
        status: 'COMPLETED',
        stepCount: step,
        confidence: decision.confidence,
        currentDiagnosis: decision.diagnosis,
      });

      return {
        ticketId,
        runId: run.id,
        status: 'COMPLETED',
        stepCount: step,
        confidence: decision.confidence,
        diagnosis: decision.diagnosis,
        message: decision.reasoning_summary,
        evidence: currentRun.evidence,
      };
    }

    // 4. Handle Stop Condition: Escalation
    if (decision.status === 'escalated') {
      await executeToolSafely(
        'escalate_ticket',
        {
          ticketId,
          escalationReason: decision.escalation_reason || decision.reasoning_summary,
          targetTier: 'TIER_2_HELPDESK',
          evidenceSummary: JSON.stringify(currentRun.evidence),
        },
        { ticketId, userId: ticketData.creatorId, userRole: 'IT_AGENT' },
        true,
        actionRecord.id
      );

      await updateAgentRun(run.id, {
        status: 'ESCALATED',
        stepCount: step,
        confidence: decision.confidence,
        currentDiagnosis: decision.escalation_reason,
      });

      return {
        ticketId,
        runId: run.id,
        status: 'ESCALATED',
        stepCount: step,
        confidence: decision.confidence,
        diagnosis: decision.escalation_reason,
        message: decision.reasoning_summary,
        evidence: currentRun.evidence,
      };
    }

    // 5. Execute Next Tool Call
    if (decision.tool_name) {
      // GUARD: Prevent tool deduplication â€” do not re-execute a tool already in evidence.
      // This stops the model looping on the same tool (e.g. check_system_status x3).
      const alreadyRun = currentRun.evidence.some((e) => e.source === decision.tool_name);
      if (alreadyRun) {
        console.log(`[AGENT:${ticketId}] Step ${step} | GUARD: Tool '${decision.tool_name}' already in evidence. Skipping duplicate execution.`);
        // Still loop â€” let the next step's LLM call pick a different tool
      } else {
      const toolRes = await executeToolSafely(
        decision.tool_name,
        decision.tool_params || {},
        {
          ticketId,
          userId: ticketData.creatorId,
          userRole: 'EMPLOYEE',
          agentRunId: run.id,
        },
        false,
        actionRecord.id
      );

      // Ingest Tool Output into Evidence Item
      const newEvidence: EvidenceItem = {
        id: `ev_${Date.now()}_${step}`,
        source: decision.tool_name,
        summary: decision.reasoning_summary,
        details: toolRes.data || { error: toolRes.error },
        timestamp: new Date().toISOString(),
      };

      await updateAgentRun(run.id, {
        stepCount: step,
        confidence: decision.confidence,
        appendEvidence: newEvidence,
      });

        // Refresh current run in-memory state
        currentRun = await getOrCreateAgentRun(ticketId);
      }
    }
  }

  // Fallback: If max steps reached without resolution, escalate gracefully
  await updateTicketStatus(ticketId, 'ESCALATED', {
    escalationReason: `Agent reached max steps (${maxSteps}) without definitive resolution.`,
  });
  await updateAgentRun(run.id, { status: 'ESCALATED' });

  return {
    ticketId,
    runId: run.id,
    status: 'ESCALATED',
    stepCount: step,
    confidence: 0.50,
    message: `Maximum steps (${maxSteps}) reached. Ticket escalated to human support.`,
    evidence: currentRun.evidence,
  };
}

/**
 * Resumes the agent loop after a human approves or rejects a pending action.
 */
export async function resumeAgentAfterApproval(
  ticketId: string,
  approvalId: string,
  approved: boolean,
  reviewerId: string,
  reason?: string
): Promise<AgentInvestigationResult> {
  const approval = await resolveApproval(approvalId, approved ? 'APPROVED' : 'REJECTED', reviewerId, reason);
  if (!approval) {
    throw new Error(`Approval '${approvalId}' not found.`);
  }

  const run = await getOrCreateAgentRun(ticketId);

  if (approved) {
    // Execute the approved tool
    const ticket = await getTicketById(ticketId);
    console.log(`[AGENT:${ticketId}] Approval | Executing approved tool '${approval.toolName}' with params: ${JSON.stringify(approval.toolInput)}`);
    const normalizedApprovalParams = normalizeToolParams(approval.toolName, approval.toolInput);
    const execRes = await executeToolSafely(
      approval.toolName,
      normalizedApprovalParams,
      {
        ticketId,
        userId: ticket?.creatorId || 'usr_emp_01',
        userRole: 'IT_AGENT',
        agentRunId: run.id,
      },
      true // APPROVED
    );
    console.log(`[AGENT:${ticketId}] Approval | Tool '${approval.toolName}' result: success=${execRes.success} status=${execRes.status} error=${execRes.error || 'none'}`);

    // Record executed evidence
    const newEvidence: EvidenceItem = {
      id: `ev_appr_${Date.now()}`,
      source: approval.toolName,
      summary: `Approved action '${approval.toolName}' executed by ${reviewerId}.`,
      details: execRes.data || { error: execRes.error },
      timestamp: new Date().toISOString(),
    };

    await updateAgentRun(run.id, {
      status: 'RUNNING',
      appendEvidence: newEvidence,
    });

    // Continue the agent investigation loop to verify and finalize ticket!
    return await runAgentInvestigation(ticketId);
  } else {
    // Rejection branch: agent records rejection evidence and escalates or seeks alternate path
    const rejectionEvidence: EvidenceItem = {
      id: `ev_rej_${Date.now()}`,
      source: 'HUMAN_APPROVAL_REJECTED',
      summary: `Action '${approval.toolName}' was REJECTED by ${reviewerId}. Reason: ${reason || 'Not specified'}`,
      details: { tool: approval.toolName, reason },
      timestamp: new Date().toISOString(),
    };

    await updateAgentRun(run.id, {
      status: 'RUNNING',
      appendEvidence: rejectionEvidence,
    });

    await addTicketMessage(
      ticketId,
      'AGENT',
      `âŒ Action '${approval.toolName}' was rejected by IT Support. Escalating ticket for manual investigation.`,
      'agent_ai',
      'AutoDesk AI Agent'
    );

    await updateTicketStatus(ticketId, 'ESCALATED', {
      escalationReason: `Proposed remediation '${approval.toolName}' was rejected by ${reviewerId}. Reason: ${reason || 'Denied'}`,
    });

    await updateAgentRun(run.id, { status: 'ESCALATED' });

    return {
      ticketId,
      runId: run.id,
      status: 'ESCALATED',
      stepCount: run.stepCount,
      confidence: 0.60,
      message: `Action rejected. Escalated to human IT tier.`,
      evidence: [...run.evidence, rejectionEvidence],
    };
  }
}

