'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  HelpCircle, 
  ShieldAlert, 
  Cpu, 
  ChevronDown, 
  ChevronUp,
  Terminal,
  Lock,
  RefreshCw,
  Search,
  Activity,
  Zap,
  Radio,
  FileCode2,
  Server
} from 'lucide-react';
import { 
  CyberButton, 
  CyberBadge, 
  CyberPanel, 
  CyberTerminal, 
  CyberStatus 
} from '@/components/ui/cyber';

interface AgentRunViewProps {
  run: any;
  actions: any[];
  toolCalls: any[];
  ticket: any;
  onApprove?: (approvalId: string) => void;
  onReject?: (approvalId: string, reason: string) => void;
  onTriggerInvestigation?: () => void;
  isProcessing?: boolean;
}

export function AgentRunView({
  run,
  actions,
  toolCalls,
  ticket,
  onApprove,
  onReject,
  onTriggerInvestigation,
  isProcessing,
}: AgentRunViewProps) {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);
  const [showWhyModal, setShowWhyModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [activeTab, setActiveTab] = useState<'graph' | 'terminal'>('graph');

  const getToolIcon = (name?: string) => {
    switch (name) {
      case 'search_knowledge_base':
        return <Search className="w-4 h-4 text-[#00d4ff]" />;
      case 'check_system_status':
        return <Activity className="w-4 h-4 text-[#00ff88]" />;
      case 'check_user_account':
        return <Lock className="w-4 h-4 text-[#f59e0b]" />;
      case 'run_diagnostics':
        return <Terminal className="w-4 h-4 text-[#00d4ff]" />;
      case 'unlock_account':
        return <ShieldAlert className="w-4 h-4 text-[#ff00ff]" />;
      case 'clear_application_cache':
        return <RefreshCw className="w-4 h-4 text-[#00d4ff]" />;
      case 'close_ticket':
        return <CheckCircle2 className="w-4 h-4 text-[#00ff88]" />;
      case 'escalate_ticket':
        return <AlertTriangle className="w-4 h-4 text-[#ff3366]" />;
      default:
        return <Cpu className="w-4 h-4 text-[#6b7280]" />;
    }
  };

  // Convert real action sequence into terminal logs for the CyberTerminal component
  const terminalLines = (actions || []).map((act, index) => {
    const isApproval = act.actionType === 'REQUEST_APPROVAL';
    const isResolve = act.actionType === 'RESOLVE';
    const isEscalate = act.actionType === 'ESCALATE';
    return {
      prompt: isApproval ? '!' : isResolve ? '✓' : isEscalate ? '▲' : '>',
      text: `[STEP ${act.stepNumber || index + 1}] ${act.toolName ? `EXEC ${act.toolName} // ` : ''}${act.reasoningSummary}`,
      type: (isApproval ? 'warn' : isResolve ? 'success' : isEscalate ? 'error' : 'info') as any,
    };
  });

  if (run?.status === 'WAITING_APPROVAL') {
    terminalLines.push({
      prompt: '!',
      text: `HUMAN AUTHORIZATION INTERCEPT // Awaiting IT review for '${run.currentDiagnosis || 'remediation action'}'`,
      type: 'warn',
    });
  } else if (run?.status === 'COMPLETED') {
    terminalLines.push({
      prompt: '✓',
      text: `RESOLUTION CONFIRMED // Automated verification passed. Ticket closed safely.`,
      type: 'success',
    });
  }

  return (
    <div className="space-y-6">
      {/* 1. High-Priority Cyber Security Authorization Intercept Panel */}
      {ticket?.status === 'AWAITING_APPROVAL' && (
        <div className="relative bg-[#12121a] border-2 border-[#ff00ff] p-5 shadow-[0_0_25px_rgba(255,0,255,0.3)] cyber-chamfer animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#ff00ff]/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#ff00ff] animate-pulse" />
              <h2 className="font-heading font-black text-sm text-[#ff00ff] tracking-widest uppercase">
                // AUTHORIZATION REQUIRED: ELEVATED PRIVILEGE ACTION
              </h2>
            </div>
            <CyberBadge variant="magenta" glow>
              POLICY INTERCEPT
            </CyberBadge>
          </div>

          <div className="py-4 space-y-3 font-mono text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-[#0a0a0f] border border-[#2a2a3a] p-2.5">
                <span className="text-[10px] text-[#6b7280] block uppercase font-bold">TARGET ACTION</span>
                <span className="text-white font-bold text-sm text-neon-pink">
                  {actions?.find((a) => a.actionType === 'REQUEST_APPROVAL')?.toolName || 'Remediation Action'}
                </span>
              </div>
              <div className="bg-[#0a0a0f] border border-[#2a2a3a] p-2.5">
                <span className="text-[10px] text-[#6b7280] block uppercase font-bold">SECURITY RISK LEVEL</span>
                <span className="text-[#f59e0b] font-bold text-sm">MEDIUM / SENSITIVE</span>
              </div>
              <div className="bg-[#0a0a0f] border border-[#2a2a3a] p-2.5">
                <span className="text-[10px] text-[#6b7280] block uppercase font-bold">POLICY ENFORCEMENT</span>
                <span className="text-[#00ff88] font-bold text-sm">RESTRICTED_ROLE</span>
              </div>
            </div>

            <div className="bg-[#0a0a0f] border border-[#2a2a3a] p-3 text-slate-200">
              <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">EVIDENCE-BASED REASONING:</span>
              <p className="leading-relaxed">
                {run?.currentDiagnosis || 'Agent identified root cause and requested human approval before executing state-altering remediation.'}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#ff00ff]/30 flex flex-wrap items-center justify-between gap-3">
            <div className="text-[10px] font-mono text-[#6b7280]">
              * Zero unauthorized state mutations permitted by Deterministic Policy Engine.
            </div>

            <div className="flex items-center gap-3">
              {!showRejectInput ? (
                <>
                  <CyberButton
                    variant="cta"
                    onClick={() => onApprove && onApprove(ticket.id)}
                    disabled={isProcessing}
                    className="min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>AUTHORIZE & EXECUTE</span>
                  </CyberButton>
                  <CyberButton
                    variant="destructive"
                    onClick={() => setShowRejectInput(true)}
                    disabled={isProcessing}
                    className="min-h-[44px]"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>DENY ACTION</span>
                  </CyberButton>
                </>
              ) : (
                <div className="flex items-center gap-2 font-mono">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for denial..."
                    className="px-3 py-2 bg-[#0a0a0f] border border-[#ff3366] text-xs text-white focus:outline-none min-h-[40px]"
                  />
                  <CyberButton
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (onReject) onReject(ticket.id, rejectReason || 'Denied by reviewer');
                      setShowRejectInput(false);
                    }}
                  >
                    CONFIRM DENY
                  </CyberButton>
                  <CyberButton
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRejectInput(false)}
                  >
                    CANCEL
                  </CyberButton>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Top Cyber HUD Status Console */}
      <div className={`p-4 bg-[#12121a] border ${
        run?.status === 'COMPLETED'
          ? 'border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.15)]'
          : run?.status === 'WAITING_APPROVAL'
          ? 'border-[#ff00ff] shadow-[0_0_15px_rgba(255,0,255,0.15)]'
          : run?.status === 'ESCALATED'
          ? 'border-[#ff3366] shadow-[0_0_15px_rgba(255,51,102,0.15)]'
          : 'border-[#00d4ff] shadow-[0_0_15px_rgba(0,212,255,0.15)]'
      } cyber-chamfer transition-all`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 cyber-chamfer-sm flex items-center justify-center font-bold ${
              run?.status === 'COMPLETED'
                ? 'bg-[#00ff88] text-[#0a0a0f]'
                : run?.status === 'WAITING_APPROVAL'
                ? 'bg-[#ff00ff] text-[#0a0a0f]'
                : run?.status === 'ESCALATED'
                ? 'bg-[#ff3366] text-white'
                : 'bg-[#00d4ff] text-[#0a0a0f]'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-white text-sm tracking-wider">
                  {run?.status === 'COMPLETED'
                    ? 'AUTONOMOUS RESOLUTION VERIFIED'
                    : run?.status === 'WAITING_APPROVAL'
                    ? 'HUMAN AUTHORIZATION REQUIRED'
                    : run?.status === 'ESCALATED'
                    ? 'ESCALATED TO TIER-2 HUMAN SUPPORT'
                    : 'AUTONOMOUS AGENT INVESTIGATION'}
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-[#0a0a0f] text-[#00ff88] border border-[#2a2a3a]">
                  STEP {run?.stepCount || 0} / {run?.maxSteps || 10}
                </span>
              </div>
              <p className="text-xs font-mono text-[#a0a0b0] mt-1">
                {run?.currentDiagnosis || 'Agent evaluating evidence graph and selecting dynamic tools.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {run?.status !== 'COMPLETED' && run?.status !== 'WAITING_APPROVAL' && run?.status !== 'ESCALATED' && (
              <CyberButton
                variant="cta"
                onClick={onTriggerInvestigation}
                disabled={isProcessing}
                className="min-h-[44px]"
              >
                <Cpu className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'AGENT REASONING...' : 'TRIGGER AUTONOMOUS TRIAGE'}</span>
              </CyberButton>
            )}
          </div>
        </div>
      </div>

      {/* 3. Investigation Tabs: Visual Execution Graph vs. Live Cyber Terminal */}
      <div className="flex items-center justify-between border-b border-[#2a2a3a] pb-2 font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-3 py-1 text-xs uppercase font-bold tracking-wider transition-all border ${
              activeTab === 'graph'
                ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]'
                : 'text-[#6b7280] border-transparent hover:text-white'
            }`}
          >
            [ EXECUTION GRAPH ]
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1 text-xs uppercase font-bold tracking-wider transition-all border ${
              activeTab === 'terminal'
                ? 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]'
                : 'text-[#6b7280] border-transparent hover:text-white'
            }`}
          >
            [ AGENT TERMINAL HUD ]
          </button>
        </div>

        <span className="text-[11px] text-[#6b7280]">
          {actions?.length || 0} DYNAMIC ACTIONS RECORDED
        </span>
      </div>

      {/* TAB A: Visual Execution Graph */}
      {activeTab === 'graph' && (
        <div className="space-y-3 font-mono">
          {actions && actions.length > 0 ? (
            <div className="space-y-3 relative before:absolute before:top-4 before:bottom-4 before:left-4 before:w-0.5 before:bg-[#2a2a3a] before:z-0">
              {actions.map((act, index) => {
                const tc = toolCalls?.find((t) => t.agentActionId === act.id);
                const isExpanded = expandedAction === act.id;
                const isApproval = act.actionType === 'REQUEST_APPROVAL';
                const isResolve = act.actionType === 'RESOLVE';
                const isEscalate = act.actionType === 'ESCALATE';

                const borderAccent = isApproval
                  ? 'border-[#ff00ff]/60 hover:border-[#ff00ff]'
                  : isResolve
                  ? 'border-[#00ff88]/60 hover:border-[#00ff88]'
                  : isEscalate
                  ? 'border-[#ff3366]/60 hover:border-[#ff3366]'
                  : 'border-[#2a2a3a] hover:border-[#00d4ff]';

                const badgeVariant = isApproval
                  ? 'magenta'
                  : isResolve
                  ? 'green'
                  : isEscalate
                  ? 'red'
                  : 'cyan';

                return (
                  <div
                    key={act.id || index}
                    className={`relative z-10 bg-[#12121a] border ${borderAccent} p-4 cyber-chamfer-sm transition-all`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 flex items-center justify-center shrink-0 border ${
                          isApproval
                            ? 'bg-[#ff00ff]/10 border-[#ff00ff]/40 text-[#ff00ff]'
                            : isResolve
                            ? 'bg-[#00ff88]/10 border-[#00ff88]/40 text-[#00ff88]'
                            : isEscalate
                            ? 'bg-[#ff3366]/10 border-[#ff3366]/40 text-[#ff3366]'
                            : 'bg-[#00d4ff]/10 border-[#00d4ff]/40 text-[#00d4ff]'
                        }`}>
                          {getToolIcon(act.toolName)}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-white">
                              {act.actionType === 'REQUEST_APPROVAL'
                                ? `REQUEST APPROVAL: ${act.toolName}`
                                : act.actionType === 'RESOLVE'
                                ? 'VERIFIED RESOLUTION'
                                : act.actionType === 'ESCALATE'
                                ? 'ESCALATION DOSSIER FORMULATED'
                                : `EXEC TOOL: ${act.toolName}`}
                            </span>
                            <CyberBadge variant={badgeVariant as any}>
                              {act.actionType}
                            </CyberBadge>
                            {tc && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-[#0a0a0f] text-[#6b7280] border border-[#2a2a3a]">
                                {tc.durationMs}MS
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#a0a0b0] leading-relaxed">
                            {act.reasoningSummary}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Evidence explanation toggle */}
                        <button
                          onClick={() => setShowWhyModal(showWhyModal === act.id ? null : act.id)}
                          className="px-2.5 py-1 text-[10px] uppercase font-bold border border-[#00d4ff]/40 text-[#00d4ff] bg-[#00d4ff]/10 hover:bg-[#00d4ff]/20 transition-colors"
                          title="View evidence rationale"
                        >
                          // WHY THIS?
                        </button>

                        <button
                          onClick={() => setExpandedAction(isExpanded ? null : act.id)}
                          className="p-1 text-[#6b7280] hover:text-[#00ff88] transition-colors"
                          aria-label="Toggle details"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded Technical Inspection */}
                    {isExpanded && tc && (
                      <div className="mt-3 pt-3 border-t border-[#2a2a3a] text-xs space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="p-3 bg-[#0a0a0f] border border-[#2a2a3a]">
                            <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">
                              &gt; INPUT PARAMETERS
                            </span>
                            <pre className="text-[#00d4ff] overflow-x-auto whitespace-pre-wrap text-[11px]">
                              {JSON.stringify(tc.inputParams, null, 2)}
                            </pre>
                          </div>
                          <div className="p-3 bg-[#0a0a0f] border border-[#2a2a3a]">
                            <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-1">
                              &gt; EVIDENCE OUTPUT
                            </span>
                            <pre className="text-[#00ff88] overflow-x-auto whitespace-pre-wrap text-[11px]">
                              {JSON.stringify(tc.outputResult || tc.errorMessage, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* "Why this action?" Explainer Popover */}
                    {showWhyModal === act.id && (
                      <div className="mt-3 p-3.5 bg-[#0a0a0f] border border-[#00d4ff] text-xs space-y-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between pb-1 border-b border-[#2a2a3a]">
                          <div className="flex items-center gap-1.5 text-[#00d4ff] font-bold text-[11px]">
                            <Activity className="w-3.5 h-3.5" />
                            <span>EVIDENCE-BASED REASONING SUMMARY</span>
                          </div>
                          <button
                            onClick={() => setShowWhyModal(null)}
                            className="text-[#6b7280] hover:text-white text-xs font-bold"
                          >
                            ✕
                          </button>
                        </div>
                        <p className="text-[#e0e0e0] leading-relaxed">
                          {act.reasoningSummary}
                        </p>
                        <div className="pt-1.5 flex items-center gap-2 text-[10px] text-[#6b7280] border-t border-[#2a2a3a]">
                          <span className="font-bold text-[#00ff88]">POLICY GUARD:</span>
                          <span>Zero hallucination constraint enforced. Tool executed strictly via Policy Engine.</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-[#12121a] border border-[#2a2a3a] text-center space-y-3 cyber-chamfer">
              <Cpu className="w-10 h-10 text-[#6b7280] mx-auto" />
              <div>
                <p className="text-sm font-bold text-white font-mono">// NO AGENT ACTIONS RECORDED YET</p>
                <p className="text-xs text-[#6b7280] max-w-sm mx-auto mt-1 font-mono">
                  Trigger autonomous triage to start dynamic evidence collection and automated resolution.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB B: Cyber Terminal View */}
      {activeTab === 'terminal' && (
        <CyberTerminal
          title="AUTONOMOUS AGENT REASONING STREAM // REAL-TIME LOG"
          lines={terminalLines}
        />
      )}
    </div>
  );
}
