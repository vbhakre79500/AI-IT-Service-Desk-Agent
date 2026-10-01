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
  const ticketData = getTicketById(ticketId);
  if (!ticketData) {
    throw new Error(`Ticket with ID '${ticketId}' does not exist.`);
  }

  const run = getOrCreateAgentRun(ticketId);
  updateTicketStatus(ticketId, 'INVESTIGATING');
  updateAgentRun(run.id, { status: 'RUNNING' });

  // Retrieve RAG context related to ticket
  const runbooks = searchKnowledgeBase(ticketData.title + ' ' + ticketData.description, 2);
  const ragContext = formatKnowledgeContext(runbooks);

  let currentRun = getOrCreateAgentRun(ticketId);
  let step = currentRun.stepCount;

  while (step < maxSteps) {
    step += 1;

    // Fetch up-to-date run details and past actions
    const runDetails = getAgentRunDetails(ticketId);
    const pastActions = runDetails.actions.map((a) => ({
      stepNumber: a.stepNumber,
      actionType: a.actionType,
      toolName: a.toolName,
      toolInput: a.toolInput,
      reasoningSummary: a.reasoningSummary,
    }));

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

    // Record the AgentAction reasoning step
    const actionRecord = recordAgentAction({
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
    if (decision.status === 'awaiting_approval' && decision.tool_name) {
      const approval = createApproval({
        ticketId,
        agentRunId: run.id,
        actionType: decision.intent || 'REMEDIATION',
        toolName: decision.tool_name,
        toolInput: decision.tool_params || {},
        riskLevel: decision.risk_level || 'MEDIUM',
        requestedBy: 'AutoDesk AI Agent',
      });

      updateAgentRun(run.id, {
        status: 'WAITING_APPROVAL',
        stepCount: step,
        confidence: decision.confidence,
        currentDiagnosis: decision.diagnosis || decision.reasoning_summary,
      });

      updateTicketStatus(ticketId, 'AWAITING_APPROVAL');

      addTicketMessage(
        ticketId,
        'AGENT',
        `⚠️ AutoDesk AI requires human authorization before executing action '${decision.tool_name}'.\nReason: ${decision.reasoning_summary}\nDiagnosis: ${decision.diagnosis || 'Root cause identified.'}`,
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
      if (decision.tool_name === 'close_ticket') {
        await executeToolSafely(
          'close_ticket',
          decision.tool_params || {
            ticketId,
            resolutionSummary: decision.recommended_remediation || 'Issue remediated and verified.',
            verificationProof: decision.verification_procedure || 'Service health checks passing.',
          },
          { ticketId, userId: ticketData.creatorId, userRole: 'IT_AGENT' },
          true,
          actionRecord.id
        );
      }

      updateAgentRun(run.id, {
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

      updateAgentRun(run.id, {
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

      updateAgentRun(run.id, {
        stepCount: step,
        confidence: decision.confidence,
        appendEvidence: newEvidence,
      });

      // Refresh current run in-memory state
      currentRun = getOrCreateAgentRun(ticketId);
    }
  }

  // Fallback: If max steps reached without resolution, escalate gracefully
  updateTicketStatus(ticketId, 'ESCALATED', {
    escalationReason: `Agent reached max steps (${maxSteps}) without definitive resolution.`,
  });
  updateAgentRun(run.id, { status: 'ESCALATED' });

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
  const approval = resolveApproval(approvalId, approved ? 'APPROVED' : 'REJECTED', reviewerId, reason);
  if (!approval) {
    throw new Error(`Approval '${approvalId}' not found.`);
  }

  const run = getOrCreateAgentRun(ticketId);

  if (approved) {
    // Execute the approved tool
    const ticket = getTicketById(ticketId);
    const execRes = await executeToolSafely(
      approval.toolName,
      approval.toolInput,
      {
        ticketId,
        userId: ticket?.creatorId || 'usr_emp_01',
        userRole: 'IT_AGENT',
        agentRunId: run.id,
      },
      true // APPROVED
    );

    // Record executed evidence
    const newEvidence: EvidenceItem = {
      id: `ev_appr_${Date.now()}`,
      source: approval.toolName,
      summary: `Approved action '${approval.toolName}' executed by ${reviewerId}.`,
      details: execRes.data || { error: execRes.error },
      timestamp: new Date().toISOString(),
    };

    updateAgentRun(run.id, {
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

    updateAgentRun(run.id, {
      status: 'RUNNING',
      appendEvidence: rejectionEvidence,
    });

    addTicketMessage(
      ticketId,
      'AGENT',
      `❌ Action '${approval.toolName}' was rejected by IT Support. Escalating ticket for manual investigation.`,
      'agent_ai',
      'AutoDesk AI Agent'
    );

    updateTicketStatus(ticketId, 'ESCALATED', {
      escalationReason: `Proposed remediation '${approval.toolName}' was rejected by ${reviewerId}. Reason: ${reason || 'Denied'}`,
    });

    updateAgentRun(run.id, { status: 'ESCALATED' });

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
