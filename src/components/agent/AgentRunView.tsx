'use client';

import React, { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  HelpCircle, 
  ArrowRight, 
  ShieldAlert, 
  Cpu, 
  ChevronDown, 
  ChevronUp,
  Database,
  Terminal,
  FileText,
  Lock,
  RefreshCw,
  Search,
  Activity
} from 'lucide-react';
import { EvidenceItem } from '@/types';

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

  const getToolIcon = (name?: string) => {
    switch (name) {
      case 'search_knowledge_base':
        return <Search className="w-4 h-4 text-cyan-400" />;
      case 'check_system_status':
        return <Activity className="w-4 h-4 text-emerald-400" />;
      case 'check_user_account':
        return <Lock className="w-4 h-4 text-amber-400" />;
      case 'run_diagnostics':
        return <Terminal className="w-4 h-4 text-indigo-400" />;
      case 'unlock_account':
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
      case 'clear_application_cache':
        return <RefreshCw className="w-4 h-4 text-blue-400" />;
      case 'close_ticket':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'escalate_ticket':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      default:
        return <Cpu className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header status banner */}
      <div className={`p-4 rounded-2xl border transition-all ${
        run?.status === 'COMPLETED'
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : run?.status === 'WAITING_APPROVAL'
          ? 'bg-amber-500/10 border-amber-500/30 agent-active-glow'
          : run?.status === 'ESCALATED'
          ? 'bg-rose-500/10 border-rose-500/30'
          : 'bg-cyan-500/10 border-cyan-500/30'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              run?.status === 'COMPLETED'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : run?.status === 'WAITING_APPROVAL'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : run?.status === 'ESCALATED'
                ? 'bg-rose-500 text-white font-bold'
                : 'bg-cyan-500 text-slate-950 font-bold'
            }`}>
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {run?.status === 'COMPLETED'
                    ? 'Autonomous Resolution Verified'
                    : run?.status === 'WAITING_APPROVAL'
                    ? 'Human Authorization Required'
                    : run?.status === 'ESCALATED'
                    ? 'Escalated to Human IT Support'
                    : 'Autonomous Agent Investigation'}
                </h3>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Step {run?.stepCount || 0} / {run?.maxSteps || 10}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {run?.currentDiagnosis || 'Agent evaluating evidence and hypothesis tree.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {run?.status !== 'COMPLETED' && run?.status !== 'WAITING_APPROVAL' && run?.status !== 'ESCALATED' && (
              <button
                onClick={onTriggerInvestigation}
                disabled={isProcessing}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                <Cpu className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                {isProcessing ? 'Agent Reasoning...' : 'Trigger Autonomous Triage'}
              </button>
            )}
          </div>
        </div>

        {/* Pending Approval Banner */}
        {ticket?.status === 'AWAITING_APPROVAL' && (
          <div className="mt-4 pt-4 border-t border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Human-In-The-Loop Approval Action
                </span>
              </div>
              <p className="text-xs text-slate-200">
                The agent proposes executing a sensitive remediation. Review evidence below and authorize or decline.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!showRejectInput ? (
                <>
                  <button
                    onClick={() => onApprove && onApprove(ticket.id)}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] transition-all"
                  >
                    ✓ Authorize & Execute
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    disabled={isProcessing}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold transition-all"
                  >
                    ✕ Reject Action
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                  <button
                    onClick={() => {
                      if (onReject) onReject(ticket.id, rejectReason || 'Denied by reviewer');
                      setShowRejectInput(false);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
                  >
                    Confirm Rejection
                  </button>
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-2 py-1.5 rounded-lg text-slate-400 text-xs hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Observability Timeline: Dynamic Actions Taken */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Observable Agent Trajectory & Evidence Graph
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            {actions?.length || 0} Dynamic Steps Executed
          </span>
        </div>

        {actions && actions.length > 0 ? (
          <div className="space-y-3">
            {actions.map((act, index) => {
              const tc = toolCalls?.find((t) => t.agentActionId === act.id);
              const isExpanded = expandedAction === act.id;

              return (
                <div
                  key={act.id || index}
                  className="rounded-2xl glass-panel border border-slate-800/80 p-4 transition-all hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5 border border-slate-700">
                        {getToolIcon(act.toolName)}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">
                            {act.actionType === 'REQUEST_APPROVAL'
                              ? `Request Approval: ${act.toolName}`
                              : act.actionType === 'RESOLVE'
                              ? 'Verified Resolution'
                              : act.actionType === 'ESCALATE'
                              ? 'Escalation Dossier Formulated'
                              : `Tool Executed: ${act.toolName}`}
                          </span>
                          {tc && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {tc.durationMs}ms
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-300">{act.reasoningSummary}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* "Why this action?" explainer button */}
                      <button
                        onClick={() => setShowWhyModal(act.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 text-[11px] font-semibold transition-colors"
                        title="View evidence explanation"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Why this action?</span>
                      </button>

                      <button
                        onClick={() => setExpandedAction(isExpanded ? null : act.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Technical Evidence Inspection */}
                  {isExpanded && tc && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs font-mono space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                            Input Parameters
                          </p>
                          <pre className="text-slate-300 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(tc.inputParams, null, 2)}
                          </pre>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                            Execution Evidence Output
                          </p>
                          <pre className="text-emerald-400/90 overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(tc.outputResult || tc.errorMessage, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* "Why this action?" Modal / Popover */}
                  {showWhyModal === act.id && (
                    <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-cyan-500/30 text-xs space-y-2 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                          <Sparkles className="w-4 h-4" />
                          <span>Evidence-Based Rationale</span>
                        </div>
                        <button
                          onClick={() => setShowWhyModal(null)}
                          className="text-slate-400 hover:text-white text-xs font-bold px-1"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="text-slate-200 leading-relaxed">
                        {act.reasoningSummary}
                      </p>
                      <div className="pt-1.5 flex items-center gap-2 text-[10px] text-slate-400 border-t border-slate-800">
                        <span className="font-semibold text-slate-300">Policy Guard:</span>
                        <span>Enforced role boundary & input validation via Deterministic Policy Engine.</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl glass-panel border border-slate-800/80 text-center space-y-3">
            <Cpu className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <p className="text-sm font-semibold text-slate-300">No agent actions recorded yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Click &quot;Trigger Autonomous Triage&quot; above to watch the agent dynamically inspect knowledge, systems, and user accounts.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sparkles(props: any) {
  return <HelpCircle {...props} />;
}
