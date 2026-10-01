'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/layout/AuthProvider';
import { 
  Wrench, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight, 
  ShieldAlert,
  Cpu,
  RefreshCw,
  ExternalLink,
  Terminal,
  Activity,
  Check,
  X
} from 'lucide-react';
import { Ticket } from '@/types';
import { 
  CyberButton, 
  CyberBadge, 
  CyberPanel, 
  CyberStatus 
} from '@/components/ui/cyber';

export default function ITDeskDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const fetchDeskData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets?all=true');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }

      const apprRes = await fetch('/api/approvals/pending');
      const apprData = await apprRes.json();
      if (apprData.success) {
        setApprovals(apprData.approvals || []);
      }
    } catch (err) {
      console.error('Failed to load desk data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeskData();
  }, []);

  const handleApprove = async (approvalId: string) => {
    try {
      await fetch(`/api/actions/${approvalId}/approve`, { method: 'POST' });
      fetchDeskData();
    } catch (err) {
      console.error('Approval failed:', err);
    }
  };

  const handleReject = async (approvalId: string) => {
    try {
      await fetch(`/api/actions/${approvalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Rejected by IT Support Agent' }),
      });
      fetchDeskData();
    } catch (err) {
      console.error('Rejection failed:', err);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus === 'ALL') return true;
    return t.status === filterStatus;
  });

  return (
    <div className="space-y-8 font-mono">
      {/* Workbench Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2a3a] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 bg-[#00d4ff]/10 text-[#00d4ff] border border-[#00d4ff]/30">
              TIER-2 HELPDESK WORKBENCH // HUMAN-IN-THE-LOOP
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
            IT Service Desk Operations
          </h1>
          <p className="text-xs text-[#a0a0b0] mt-1">
            Authorize sensitive AI remediation actions, monitor autonomous triage runs, and inspect escalations.
          </p>
        </div>

        <CyberButton
          variant="outline"
          onClick={fetchDeskData}
          className="min-h-[44px]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH DESK QUEUE</span>
        </CyberButton>
      </div>

      {/* High-Priority Human Authorization Queue */}
      {approvals.length > 0 && (
        <div className="bg-[#12121a] border-2 border-[#ff00ff] p-5 shadow-[0_0_20px_rgba(255,0,255,0.25)] cyber-chamfer space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#ff00ff]/30">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#ff00ff] animate-pulse" />
              <h2 className="font-heading font-black text-sm text-white tracking-widest uppercase">
                // ELEVATED PRIVILEGE ACTION AUTHORIZATION QUEUE ({approvals.length})
              </h2>
            </div>
            <CyberBadge variant="magenta" glow>
              ACTION REQUIRED
            </CyberBadge>
          </div>

          <div className="space-y-3">
            {approvals.map((appr) => (
              <div
                key={appr.id}
                className="bg-[#0a0a0f] border border-[#2a2a3a] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#ff00ff]">AUTH_REQ: #{appr.id.slice(0, 12)}</span>
                    <span className="text-[#6b7280]">::</span>
                    <CyberBadge variant="amber">
                      RISK: {appr.riskLevel || 'MEDIUM'}
                    </CyberBadge>
                    <span className="text-[#6b7280]">::</span>
                    <span className="text-xs text-[#00ff88] font-bold">TOOL: {appr.toolName}</span>
                  </div>

                  <p className="text-xs text-[#e0e0e0]">
                    Action Type: <span className="font-bold text-white">{appr.actionType}</span>
                  </p>

                  <div className="text-[11px] text-[#6b7280]">
                    Parameters: <span className="text-[#00d4ff]">{JSON.stringify(appr.toolInput)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <CyberButton
                    variant="cta"
                    size="sm"
                    onClick={() => handleApprove(appr.id)}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>AUTHORIZE &amp; EXECUTE</span>
                  </CyberButton>

                  <CyberButton
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(appr.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>DENY</span>
                  </CyberButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Queue with Cyber Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2a2a3a]">
          <h2 className="text-sm font-bold uppercase text-white tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00ff88]" />
            <span>GLOBAL INCIDENT QUEUE ({filteredTickets.length})</span>
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {['ALL', 'INVESTIGATING', 'AWAITING_APPROVAL', 'RESOLVED', 'ESCALATED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1.5 uppercase font-bold text-[10px] tracking-wider transition-all border ${
                  filterStatus === status
                    ? 'bg-[#00ff88]/15 border-[#00ff88] text-[#00ff88]'
                    : 'bg-[#12121a] border-[#2a2a3a] text-[#6b7280] hover:text-[#e0e0e0]'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Tickets Table */}
        <div className="space-y-2">
          {filteredTickets.map((t) => (
            <div
              key={t.id}
              className="bg-[#12121a] border border-[#2a2a3a] hover:border-[#00ff88] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cyber-chamfer-sm transition-all group"
            >
              <div className="space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#00ff88]">{t.ticketNumber}</span>
                  <span className="text-[#6b7280]">•</span>
                  <span className="text-xs text-[#00d4ff] uppercase">{t.category}</span>
                  <span className="text-[#6b7280]">•</span>
                  <CyberBadge
                    variant={t.priority === 'HIGH' || t.priority === 'CRITICAL' ? 'red' : 'green'}
                  >
                    {t.priority}
                  </CyberBadge>
                  {t.errorCode && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-[#0a0a0f] text-[#f59e0b] border border-[#f59e0b]/30">
                      {t.errorCode}
                    </span>
                  )}
                </div>

                <h3 className="font-heading font-bold text-sm text-white group-hover:text-[#00ff88] transition-colors truncate">
                  {t.title}
                </h3>

                <p className="text-xs text-[#6b7280] truncate max-w-xl">
                  {t.description}
                </p>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <CyberStatus status={t.status as any} />
                <Link href={`/tickets/${t.id}`}>
                  <CyberButton variant="primary" size="sm">
                    <span>TRIAGE CONSOLE</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </CyberButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
