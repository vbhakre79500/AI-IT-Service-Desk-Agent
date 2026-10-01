'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/layout/AuthProvider';
import { AgentRunView } from '@/components/agent/AgentRunView';
import { 
  ArrowLeft, 
  HelpCircle, 
  Send, 
  Cpu, 
  ShieldAlert, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Laptop
} from 'lucide-react';
import { Ticket, TicketMessage } from '@/types';

export default function TicketDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [agentRun, setAgentRun] = useState<any>(null);
  const [actions, setActions] = useState<any[]>([]);
  const [toolCalls, setToolCalls] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      const data = await res.json();
      if (data.success && data.ticket) {
        setTicket(data.ticket);
        setMessages(data.ticket.messages || []);
      }

      // Fetch Agent Run Details
      const runRes = await fetch(`/api/agent/runs/${id}`);
      const runData = await runRes.json();
      if (runData.success) {
        setAgentRun(runData.run);
        setActions(runData.actions || []);
        setToolCalls(runData.toolCalls || []);
      }
    } catch (err) {
      console.error('Failed to load ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
    const interval = setInterval(fetchTicketDetails, 4000);
    return () => clearInterval(interval);
  }, [id]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });
      const data = await res.json();
      if (data.success) {
        setNewMessage('');
        fetchTicketDetails();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleTriggerInvestigation = async () => {
    try {
      setIsProcessing(true);
      const res = await fetch('/api/agent/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: id }),
      });
      await res.json();
      fetchTicketDetails();
    } catch (err) {
      console.error('Failed to trigger investigation:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsProcessing(true);
      // Fetch pending approval for this ticket
      const apprRes = await fetch(`/api/approvals/pending?ticketId=${id}`);
      const apprData = await apprRes.json();
      const approval = apprData.approvals?.[0];

      if (approval) {
        await fetch(`/api/actions/${approval.id}/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        fetchTicketDetails();
      }
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setIsProcessing(true);
      const apprRes = await fetch(`/api/approvals/pending?ticketId=${id}`);
      const apprData = await apprRes.json();
      const approval = apprData.approvals?.[0];

      if (approval) {
        await fetch(`/api/actions/${approval.id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        });
        fetchTicketDetails();
      }
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading && !ticket) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex items-center gap-3 text-cyan-400 font-semibold text-sm">
          <Cpu className="w-5 h-5 animate-spin" />
          <span>Loading ticket & agent state...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16 space-y-4">
        <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
        <Link href="/employee" className="text-sm text-cyan-400 hover:underline">
          Return to Helpdesk Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar: Back & Ticket Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/employee"
            className="p-2 rounded-xl glass-panel text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-cyan-400">{ticket.ticketNumber}</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-400">{ticket.category}</span>
              <span className="text-slate-600">•</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                ticket.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' : 'bg-slate-800 text-slate-300'
              }`}>
                {ticket.priority} PRIORITY
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-1">{ticket.title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {ticket.status === 'RESOLVED' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Resolved by AI</span>
            </div>
          )}
          {ticket.status === 'ESCALATED' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>Escalated to IT Tier-2</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Left = AI Investigation / Evidence (60%), Right = Conversation Thread (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Autonomous AI Investigation (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <AgentRunView
            run={agentRun}
            actions={actions}
            toolCalls={toolCalls}
            ticket={ticket}
            onApprove={handleApprove}
            onReject={handleReject}
            onTriggerInvestigation={handleTriggerInvestigation}
            isProcessing={isProcessing}
          />
        </div>

        {/* Right Column: Ticket Conversation & User Input (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl p-5 border border-slate-800/80 flex flex-col h-[650px]">
            <div className="pb-3 border-b border-slate-800/80 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Ticket Conversation & Audit Trail
              </h3>
              <span className="text-[10px] font-mono text-slate-500">{messages.length} messages</span>
            </div>

            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1">
              {messages.map((m) => {
                const isUser = m.senderType === 'USER';
                const isSystem = m.senderType === 'SYSTEM';

                if (isSystem) {
                  return (
                    <div key={m.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SYSTEM UPDATE</span>
                      </div>
                      <p className="text-slate-300 whitespace-pre-wrap">{m.message}</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400">
                        {isUser ? m.senderName || 'Employee' : 'AutoDesk AI Agent'}
                      </span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[88%] p-3.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none'
                          : 'glass-panel bg-slate-900/90 border border-slate-700/80 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {m.message}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Reply to agent or send more details..."
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all"
                title="Send"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
