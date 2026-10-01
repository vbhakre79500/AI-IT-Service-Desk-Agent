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
  ExternalLink,
  Cpu,
  Radio,
  Server
} from 'lucide-react';
import { SystemStatus, AuditLog } from '@/types';
import { 
  CyberButton, 
  CyberBadge, 
  CyberPanel, 
  CyberStatus 
} from '@/components/ui/cyber';

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
    <div className="space-y-8 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2a3a] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 bg-[#ff00ff]/10 text-[#ff00ff] border border-[#ff00ff]/30">
              SECURITY OPERATIONS &amp; INFRASTRUCTURE ADMIN HUD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
            IT Operations &amp; Administration Hub
          </h1>
          <p className="text-xs text-[#a0a0b0] mt-1">
            Manage registered agent tools, monitor enterprise service health, audit security logs, and verify SOP runbooks.
          </p>
        </div>

        <CyberButton
          variant="outline"
          onClick={fetchAdminData}
          className="min-h-[44px]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>REFRESH REGISTRY</span>
        </CyberButton>
      </div>

      {/* Cyber Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#2a2a3a] pb-3 overflow-x-auto text-xs">
        {[
          { id: 'tools', label: `AGENT TOOL REGISTRY (${tools.length})`, icon: Terminal },
          { id: 'services', label: `ENTERPRISE SERVICES (${services.length})`, icon: Activity },
          { id: 'audit', label: `IMMUTABLE AUDIT LOGS (${auditLogs.length})`, icon: ShieldCheck },
          { id: 'knowledge', label: 'RAG KNOWLEDGE SOPS', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 font-bold uppercase tracking-wider transition-all shrink-0 border ${
                isActive
                  ? 'bg-[#00ff88]/15 border-[#00ff88] text-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.25)]'
                  : 'bg-[#12121a] border-[#2a2a3a] text-[#6b7280] hover:text-[#e0e0e0]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Registered Tools */}
      {activeTab === 'tools' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase text-[#00ff88] tracking-widest">
              // REGISTERED AI TOOL DEFINITIONS &amp; RISK LEVEL MATRIX
            </h2>
            <span className="text-[10px] text-[#6b7280]">POLICY ENFORCEMENT: 100%</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tools.map((t) => (
              <div
                key={t.name}
                className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer-sm space-y-2 hover:border-[#00ff88] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white font-mono">
                    {t.name}
                  </span>
                  <CyberBadge
                    variant={
                      t.riskLevel === 'HIGH' || t.riskLevel === 'CRITICAL'
                        ? 'red'
                        : t.riskLevel === 'MEDIUM'
                        ? 'amber'
                        : 'green'
                    }
                  >
                    RISK: {t.riskLevel}
                  </CyberBadge>
                </div>

                <p className="text-xs text-[#a0a0b0]">
                  {t.description}
                </p>

                <div className="pt-2 border-t border-[#2a2a3a] flex items-center justify-between text-[10px] text-[#6b7280]">
                  <span>CATEGORY: {t.category || 'DIAGNOSTIC'}</span>
                  <span className={t.requiresApproval ? 'text-[#ff00ff] font-bold' : 'text-[#00ff88]'}>
                    {t.requiresApproval ? 'REQUIRES HUMAN AUTHORIZATION' : 'AUTONOMOUS EXECUTION PERMITTED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: Enterprise Services Health */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase text-[#00ff88] tracking-widest">
              // CORE ENTERPRISE SYSTEM HEALTH &amp; TELEMETRY
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((s) => (
              <div
                key={s.id}
                className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white font-mono uppercase">
                    {s.serviceName}
                  </span>
                  <CyberStatus status={s.status as any} />
                </div>

                <div className="space-y-1 text-xs">
                  <p className="text-[#a0a0b0]">{s.displayName || s.serviceName}</p>
                  <div className="flex items-center justify-between text-[10px] text-[#6b7280] pt-2 border-t border-[#2a2a3a]">
                    <span>STATUS: {s.status}</span>
                    <span>LATENCY: {s.latencyMs || '0'}MS</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Immutable Audit Logs */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase text-[#00ff88] tracking-widest">
              // IMMUTABLE SECURITY &amp; EXECUTION AUDIT TRAIL ({auditLogs.length})
            </h2>
            <span className="text-[10px] text-[#6b7280]">TAMPER-PROOF SQLite PERSISTENCE</span>
          </div>

          <div className="bg-[#12121a] border border-[#2a2a3a] overflow-x-auto cyber-chamfer">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0a0a0f] border-b border-[#2a2a3a] text-[#6b7280] uppercase text-[10px]">
                <tr>
                  <th className="p-3">TIMESTAMP</th>
                  <th className="p-3">ACTION</th>
                  <th className="p-3">RESOURCE</th>
                  <th className="p-3">ACTOR</th>
                  <th className="p-3">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2a2a3a]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1c1c2e]/40 transition-colors">
                    <td className="p-3 text-[#6b7280] whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="p-3 font-bold text-[#00d4ff] whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="p-3 text-[#00ff88] whitespace-nowrap font-bold">
                      {log.resource || '-'}
                    </td>
                    <td className="p-3 text-white whitespace-nowrap">
                      {log.userId || 'agent_ai'}
                    </td>
                    <td className="p-3 text-[#a0a0b0] truncate max-w-xs">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : String(log.details || '-')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: RAG Knowledge SOPs */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase text-[#00ff88] tracking-widest">
              // EMBEDDED IT SOP RUNBOOKS &amp; COSINE VECTOR SIMILARITY
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer-sm space-y-2">
              <CyberBadge variant="cyan">SOP-104</CyberBadge>
              <h3 className="font-heading font-bold text-white text-sm">HR Portal Auth Triage</h3>
              <p className="text-xs text-[#a0a0b0]">
                Covers authentication handshakes, Active Directory account lockout flags, and unlock authorization procedures.
              </p>
            </div>

            <div className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer-sm space-y-2">
              <CyberBadge variant="green">SOP-209</CyberBadge>
              <h3 className="font-heading font-bold text-white text-sm">GlobalProtect VPN Triage</h3>
              <p className="text-xs text-[#a0a0b0]">
                Addresses TLS handshake timeouts, client software version mismatch, and application cache flushing.
              </p>
            </div>

            <div className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer-sm space-y-2">
              <CyberBadge variant="red">SOP-999</CyberBadge>
              <h3 className="font-heading font-bold text-white text-sm">Infrastructure Outage Escalation</h3>
              <p className="text-xs text-[#a0a0b0]">
                Defines boundaries for L1 agent vs Tier-3 DevOps handoff when internal Git/microservice clusters fail.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
