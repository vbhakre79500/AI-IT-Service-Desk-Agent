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
  ExternalLink
} from 'lucide-react';
import { Ticket } from '@/types';

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
    <div className="space-y-8">
      {/* Workbench Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              TIER-2 / HELP DESK OPERATOR
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            IT Service Desk Workbench
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Oversee autonomous agent investigations, review pending remediation approvals, and override tickets.
          </p>
        </div>

        <button
          onClick={fetchDeskData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl glass-panel border border-slate-800">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Queue Total</p>
          <p className="text-2xl font-bold text-white mt-1">{tickets.length}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-amber-500/30 bg-amber-500/5">
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Pending Approval</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{approvals.length}</p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 bg-cyan-500/5">
          <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">AI Investigating</p>
          <p className="text-2xl font-bold text-cyan-400 mt-1">
            {tickets.filter((t) => t.status === 'INVESTIGATING').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-emerald-500/30 bg-emerald-500/5">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">AI Resolved</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {tickets.filter((t) => t.status === 'RESOLVED').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-rose-500/30 bg-rose-500/5">
          <p className="text-[10px] text-rose-400 font-bold uppercase tracking-wider">Escalated</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">
            {tickets.filter((t) => t.status === 'ESCALATED').length}
          </p>
        </div>
        <div className="p-4 rounded-2xl glass-panel border border-purple-500/30 bg-purple-500/5">
          <p className="text-[10px] text-purple-400 font-bold uppercase tracking-wider">Avg MTTR</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">4.2 min</p>
        </div>
      </div>

      {/* Action Center: Pending Human Approvals */}
      {approvals.length > 0 && (
        <div className="rounded-3xl glass-panel border border-amber-500/40 p-6 bg-gradient-to-r from-amber-950/20 to-slate-900 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>Action Required: {approvals.length} Remediations Pending IT Authorization</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {approvals.map((appr) => (
              <div
                key={appr.id}
                className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">Ticket #{appr.ticketId}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                    {appr.riskLevel} RISK
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-white text-sm">Execute: {appr.toolName}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Proposed Tool Input: {JSON.stringify(appr.toolInput)}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleApprove(appr.id)}
                    className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all"
                  >
                    ✓ Authorize Action
                  </button>
                  <button
                    onClick={() => handleReject(appr.id)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-slate-700 transition-all"
                  >
                    ✕ Reject
                  </button>
                  <Link
                    href={`/tickets/${appr.ticketId}`}
                    className="p-2 rounded-xl bg-slate-800 hover:text-cyan-400 text-slate-400 transition-colors"
                    title="View Evidence Dossier"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Triage Queue Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            Incident Triage & Investigation Queue
          </h2>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {['ALL', 'AWAITING_APPROVAL', 'INVESTIGATING', 'OPEN', 'RESOLVED', 'ESCALATED'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  filterStatus === status
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'glass-panel text-slate-300 hover:text-white'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Problem</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{t.ticketNumber}</td>
                    <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">{t.title}</td>
                    <td className="py-3.5 px-4">{t.category}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        t.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                        t.status === 'RESOLVED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : t.status === 'AWAITING_APPROVAL'
                          ? 'bg-amber-500/20 text-amber-400 animate-pulse'
                          : t.status === 'ESCALATED'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/tickets/${t.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-semibold transition-all"
                      >
                        <span>Investigate</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
