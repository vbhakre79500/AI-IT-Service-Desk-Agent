'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/layout/AuthProvider';
import { 
  PlusCircle, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Laptop, 
  ShieldAlert, 
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  Terminal,
  Activity,
  Cpu,
  Lock,
  UserCheck
} from 'lucide-react';
import { Ticket } from '@/types';
import { 
  CyberButton, 
  CyberBadge, 
  CyberPanel, 
  CyberStatus, 
  CyberInput 
} from '@/components/ui/cyber';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);

  // New Ticket Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Authentication');
  const [priority, setPriority] = useState('MEDIUM');
  const [errorCode, setErrorCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tickets');
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets || []);
      }
    } catch (err) {
      console.error('Failed to load tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccount = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/users/${user.id}/account`);
      const data = await res.json();
      if (data.success) {
        setAccountInfo(data.account);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTickets();
    fetchAccount();
  }, [user]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          errorCode: errorCode || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShowCreateModal(false);
        setTitle('');
        setDescription('');
        setErrorCode('');
        fetchTickets();

        // Automatically trigger agent investigation for the new ticket
        fetch('/api/agent/investigate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticketId: data.ticket.id }),
        }).then(() => fetchTickets());
      }
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Top Banner: Employee Operations Console */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2a2a3a] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2 py-0.5 bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30">
              EMPLOYEE SELF-SERVICE HUD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
            IT Incident & Support Console
          </h1>
          <p className="text-xs text-[#a0a0b0] mt-1">
            Log technical disruptions, track autonomous AI investigations, and review account states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <CyberButton
            variant="cta"
            onClick={() => setShowCreateModal(true)}
            className="min-h-[44px]"
          >
            <PlusCircle className="w-4 h-4" />
            <span>REPORT NEW INCIDENT</span>
          </CyberButton>

          <CyberButton
            variant="outline"
            onClick={fetchTickets}
            className="min-h-[44px]"
            title="Refresh incident list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </CyberButton>
        </div>
      </div>

      {/* Account & Device Diagnostics HUD Widget */}
      {accountInfo && (
        <div className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer">
          <div className="flex items-center justify-between pb-3 border-b border-[#2a2a3a]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#00ff88] uppercase">
              <UserCheck className="w-4 h-4" />
              <span>ACTIVE DIRECTORY IDENTITY STATE &amp; DEVICE DIAGNOSTICS</span>
            </div>
            <span className="text-[10px] text-[#6b7280]">UID: {accountInfo.id}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3 text-xs">
            <div className="bg-[#0a0a0f] border border-[#2a2a3a] p-3">
              <span className="text-[10px] text-[#6b7280] uppercase block mb-1">ACCOUNT STATUS</span>
              <span
                className={`font-bold ${
                  accountInfo.accountStatus === 'LOCKED'
                    ? 'text-[#ff3366] text-neon-red'
                    : 'text-[#00ff88]'
                }`}
              >
                {accountInfo.accountStatus}
              </span>
            </div>

            <div className="bg-[#0a0a0f] border border-[#2a2a3a] p-3">
              <span className="text-[10px] text-[#6b7280] uppercase block mb-1">FAILED LOGINS</span>
              <span className="text-white font-bold">{accountInfo.failedLoginCount || 0} ATTEMPTS</span>
            </div>

            <div className="bg-[#0a0a0f] border border-[#2a2a3a] p-3">
              <span className="text-[10px] text-[#6b7280] uppercase block mb-1">MFA AUTHENTICATION</span>
              <span className="text-[#00d4ff] font-bold">
                {accountInfo.mfaEnabled ? 'ENABLED (TOTP)' : 'DISABLED'}
              </span>
            </div>

            <div className="bg-[#0a0a0f] border border-[#2a2a3a] p-3">
              <span className="text-[10px] text-[#6b7280] uppercase block mb-1">PRIMARY DEVICE</span>
              <span className="text-white font-bold">{accountInfo.primaryDeviceId || 'CORP-MBP-089'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Incidents Table / HUD Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase text-white tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#00ff88]" />
            <span>ACTIVE IT INCIDENT LOGS ({tickets.length})</span>
          </h2>
        </div>

        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-[#12121a] border border-[#2a2a3a] hover:border-[#00ff88] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cyber-chamfer-sm transition-all hover:shadow-[0_0_12px_rgba(0,255,136,0.15)] group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
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
                      <span className="text-[10px] px-1.5 py-0.5 bg-[#0a0a0f] text-[#f59e0b] border border-[#f59e0b]/40">
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
                      <span>INSPECT</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </CyberButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 bg-[#12121a] border border-[#2a2a3a] text-center space-y-3 cyber-chamfer">
            <HelpCircle className="w-10 h-10 text-[#6b7280] mx-auto" />
            <p className="text-sm font-bold text-white">// NO INCIDENTS RECORDED FOR THIS USER</p>
            <p className="text-xs text-[#6b7280] max-w-md mx-auto">
              Click &quot;Report New Incident&quot; above to log an IT issue and observe the autonomous AI triage loop.
            </p>
          </div>
        )}
      </div>

      {/* Cyberpunk Incident Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12121a] border-2 border-[#00ff88] p-6 max-w-lg w-full shadow-[0_0_30px_rgba(0,255,136,0.25)] cyber-chamfer space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#2a2a3a]">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#00ff88]" />
                <h2 className="font-heading font-black text-sm text-white tracking-wider uppercase">
                  // LOG NEW IT INCIDENT
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-[#6b7280] hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <CyberInput
                label="INCIDENT TITLE / SUMMARY"
                placeholder="e.g. Cannot connect to corporate VPN"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-[11px] uppercase tracking-wider text-[#6b7280]">
                  PROBLEM DESCRIPTION &amp; SYMPTOMS
                </label>
                <div className="relative flex items-start bg-[#0a0a0f] border border-[#2a2a3a] focus-within:border-[#00ff88] p-2.5">
                  <textarea
                    rows={3}
                    placeholder="Describe error symptoms, what happened, when it started..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-transparent text-xs text-[#e0e0e0] placeholder-[#6b7280] focus:outline-none resize-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase tracking-wider text-[#6b7280]">
                    CATEGORY
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#2a2a3a] text-xs text-[#e0e0e0] px-3 py-2 focus:outline-none focus:border-[#00ff88] font-mono"
                  >
                    <option value="Authentication">Authentication</option>
                    <option value="VPN">VPN &amp; Network</option>
                    <option value="Hardware">Hardware / Device</option>
                    <option value="Software">Software &amp; Access</option>
                    <option value="Other">Other / Infrastructure</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] uppercase tracking-wider text-[#6b7280]">
                    SEVERITY PRIORITY
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[#2a2a3a] text-xs text-[#e0e0e0] px-3 py-2 focus:outline-none focus:border-[#00ff88] font-mono"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <CyberInput
                label="OPTIONAL ERROR CODE / SYMPTOM ID"
                placeholder="e.g. ERR_AUTH_042 or TLS-handshake-timeout"
                value={errorCode}
                onChange={(e) => setErrorCode(e.target.value)}
              />

              <div className="pt-3 border-t border-[#2a2a3a] flex items-center justify-end gap-3">
                <CyberButton
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                >
                  CANCEL
                </CyberButton>
                <CyberButton
                  type="submit"
                  variant="cta"
                  disabled={isSubmitting}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'DISPATCHING...' : 'DISPATCH TO AI AGENT'}</span>
                </CyberButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
