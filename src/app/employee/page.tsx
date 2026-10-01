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
  Filter
} from 'lucide-react';
import { Ticket } from '@/types';

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'INVESTIGATING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">AI Investigating</span>;
      case 'AWAITING_APPROVAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse">Approval Required</span>;
      case 'RESOLVED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Resolved</span>;
      case 'ESCALATED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">Escalated</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">Open</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Banner: Employee Context & Status */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || 'Employee'}
              </h1>
              {accountInfo && (
                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-full border ${
                    accountInfo.accountStatus === 'LOCKED'
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  Account: {accountInfo.accountStatus}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400 max-w-2xl">
              Cyberdyne Systems Self-Service IT Desk with Autonomous AI Triage. Submit any IT problem, and the AutoDesk agent will immediately diagnose, test, and request approved fixes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              Create Support Ticket
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Tickets</p>
            <p className="text-2xl font-bold text-white mt-1">{tickets.length}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[11px] text-cyan-400 font-semibold uppercase tracking-wider">Active Investigations</p>
            <p className="text-2xl font-bold text-cyan-400 mt-1">
              {tickets.filter((t) => t.status === 'INVESTIGATING' || t.status === 'OPEN').length}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[11px] text-amber-400 font-semibold uppercase tracking-wider">Pending Approval</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">
              {tickets.filter((t) => t.status === 'AWAITING_APPROVAL').length}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Resolved</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">
              {tickets.filter((t) => t.status === 'RESOLVED').length}
            </p>
          </div>
        </div>
      </div>

      {/* Ticket List Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-cyan-400" />
            My Support Incidents
          </h2>
          <button
            onClick={fetchTickets}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-panel text-xs text-slate-300 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tickets Grid */}
        {tickets.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/tickets/${t.id}`}
                className="block glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400">{t.ticketNumber}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs font-semibold text-slate-400">{t.category}</span>
                      <span className="text-slate-600">•</span>
                      {getStatusBadge(t.status)}
                    </div>
                    <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
                    <span className="hidden sm:inline font-mono">
                      {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-1 text-cyan-400 font-semibold group-hover:translate-x-1 transition-transform">
                      <span>Inspect Agent Run</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-3xl glass-panel text-center space-y-4">
            <HelpCircle className="w-12 h-12 text-slate-600 mx-auto" />
            <div>
              <p className="text-base font-bold text-white">No active support tickets</p>
              <p className="text-xs text-slate-400 mt-1">Submit your first IT incident or choose a demo scenario.</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              Create Ticket
            </button>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 max-w-xl w-full border border-slate-700 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">Report IT Incident</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Problem Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Can't access HR portal, says authentication failed"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Authentication">Authentication / SSO</option>
                    <option value="VPN">VPN & Network</option>
                    <option value="Password">Password & Security</option>
                    <option value="Application">Application / Software</option>
                    <option value="Device">Device & Hardware</option>
                    <option value="Other">Other Infrastructure</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Description of Issue & Error Messages
                </label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what happened, any error messages displayed, and steps taken..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Optional Error Code (e.g. ERR_AUTH_042)
                </label>
                <input
                  type="text"
                  value={errorCode}
                  onChange={(e) => setErrorCode(e.target.value)}
                  placeholder="ERR_AUTH_042"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Dispatching to AI Agent...' : 'Submit & Start Autonomous Triage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
