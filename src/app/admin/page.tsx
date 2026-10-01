'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/layout/AuthProvider';
import { 
  Layers, 
  Activity, 
  ShieldCheck, 
  FileText, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Terminal,
  Lock,
  Search,
  ExternalLink
} from 'lucide-react';
import { SystemStatus, AuditLog } from '@/types';

export default function AdminHubPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tools' | 'services' | 'audit' | 'knowledge'>('tools');
  const [tools, setTools] = useState<any[]>([]);
  const [services, setServices] = useState<SystemStatus[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const tRes = await fetch('/api/tools');
      const tData = await tRes.json();
      if (tData.success) setTools(tData.tools || []);

      const sRes = await fetch('/api/system-status');
      const sData = await sRes.json();
      if (sData.success) setServices(sData.services || []);

      const aRes = await fetch('/api/admin/audit-logs');
      const aData = await aRes.json();
      if (aData.success) setAuditLogs(aData.logs || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
              ENTERPRISE SECURITY & INFRASTRUCTURE ADMIN
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            IT Operations & Administration Hub
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage registered agent tools, inspect system health, verify SOP runbooks, and audit immutable security logs.
          </p>
        </div>

        <button
          onClick={fetchAdminData}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass-panel text-xs text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        {[
          { id: 'tools', label: `Agent Tool Registry (${tools.length})`, icon: Terminal },
          { id: 'services', label: `Enterprise Services (${services.length})`, icon: Activity },
          { id: 'audit', label: `Security Audit Logs (${auditLogs.length})`, icon: ShieldCheck },
          { id: 'knowledge', label: 'RAG Knowledge SOPs', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                  : 'glass-panel text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: Registered Tools */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Tool Name</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4">Approval Policy</th>
                  <th className="py-3.5 px-4">Permitted Role</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300 font-sans">
                {tools.map((tool) => (
                  <tr key={tool.name} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">{tool.name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300 max-w-sm">{tool.description}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        tool.riskLevel === 'HIGH'
                          ? 'bg-rose-500/20 text-rose-300'
                          : tool.riskLevel === 'MEDIUM'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        {tool.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      {tool.requiresApproval ? (
                        <span className="text-amber-400 font-bold">REQUIRED</span>
                      ) : (
                        <span className="text-slate-500">Autonomous</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">{tool.requiredRole}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400">
                        ENABLED
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Enterprise Services Status */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((srv) => (
            <div
              key={srv.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-cyan-400">{srv.serviceName}</span>
                <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                  srv.status === 'OPERATIONAL'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : srv.status === 'DEGRADED'
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-rose-500/20 text-rose-400'
                }`}>
                  {srv.status}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-white text-sm">{srv.displayName}</h3>
                <p className="text-xs text-slate-400 mt-1">{srv.incidentNotes}</p>
              </div>

              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>Latency: {srv.latencyMs}ms</span>
                <span>Checked: Just now</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Immutable Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Resource</th>
                  <th className="py-3.5 px-4">Risk Level</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">{log.action}</td>
                    <td className="py-3.5 px-4 text-cyan-400">{log.resource}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        log.riskLevel === 'HIGH' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {log.riskLevel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 truncate max-w-xs">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Knowledge SOPs */}
      {activeTab === 'knowledge' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'SOP-104', title: 'HR Portal Access & Authentication Failure Resolution', cat: 'Authentication' },
            { id: 'SOP-209', title: 'GlobalProtect VPN Connection Failure & Gateway Timeout', cat: 'VPN' },
            { id: 'SOP-301', title: 'Enterprise Password Reset & Account Lockout Policy', cat: 'Password' },
            { id: 'SOP-999', title: 'Infrastructure Outages and Tier-3 Escalation Protocol', cat: 'Other' },
          ].map((sop) => (
            <div key={sop.id} className="glass-panel rounded-2xl p-5 border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-cyan-400">{sop.id}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {sop.cat}
                </span>
              </div>
              <h3 className="font-bold text-white text-sm">{sop.title}</h3>
              <p className="text-xs text-slate-400">
                Vector indexed in knowledge_chunks with 128-dim dense embeddings. Protected against prompt injection overrides via safety wrapper.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
