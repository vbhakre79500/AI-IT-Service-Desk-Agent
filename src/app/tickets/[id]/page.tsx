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
  Terminal,
  Radio,
  User,
  Hash
} from 'lucide-react';
import { Ticket, TicketMessage } from '@/types';
import { 
  CyberButton, 
  CyberBadge, 
  CyberPanel, 
  CyberStatus 
} from '@/components/ui/cyber';

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
      if (res.status === 401) {
        router.push(`/login?next=/tickets/${id}`);
        return;
      }
      const data = await res.json();
      if (res.status === 403 || data.code === 'FORBIDDEN') {
        router.push(`/access-denied?required=TICKET_OWNER_OR_IT&current=${user?.role || 'EMPLOYEE'}`);
        return;
      }

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
      <div className="flex items-center justify-center min-h-[50vh] font-mono">
        <div className="flex items-center gap-3 text-[#00ff88] text-sm font-bold">
          <Cpu className="w-5 h-5 animate-spin" />
          <span>INITIALIZING INCIDENT INVESTIGATION CONSOLE...</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-16 space-y-4 font-mono">
        <h2 className="text-xl font-bold text-[#ff3366]">// INCIDENT NOT FOUND IN REGISTRY</h2>
        <Link href="/employee">
          <CyberButton variant="outline" className="mx-auto">
            RETURN TO EMPLOYEE PORTAL
          </CyberButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono">
      {/* Top Cyber Navigation Bar & Metadata Header */}
      <div className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/employee">
              <CyberButton variant="outline" size="sm" className="min-h-[38px]">
                <ArrowLeft className="w-4 h-4" />
                <span>BACK</span>
              </CyberButton>
            </Link>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-[#00ff88]">{ticket.ticketNumber}</span>
                <span className="text-[#6b7280]">::</span>
                <span className="text-xs font-semibold text-[#00d4ff] uppercase">{ticket.category}</span>
                <span className="text-[#6b7280]">::</span>
                <CyberBadge
                  variant={ticket.priority === 'CRITICAL' || ticket.priority === 'HIGH' ? 'red' : 'green'}
                >
                  {ticket.priority} PRIORITY
                </CyberBadge>
              </div>
              <h1 className="text-lg sm:text-xl font-heading font-black text-white mt-1">
                {ticket.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CyberStatus status={ticket.status as any} />
          </div>
        </div>
      </div>

      {/* Main Grid: Left = AI Investigation Console (7 cols), Right = Audit Trail & Terminal Stream (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Autonomous Investigation & Trajectory (7 cols) */}
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

        {/* Right Column: Ticket Conversation & Cyber Audit Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#12121a] border border-[#2a2a3a] p-4 flex flex-col h-[700px] cyber-chamfer">
            {/* Header */}
            <div className="pb-3 border-b border-[#2a2a3a] flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white uppercase">
                <Terminal className="w-4 h-4 text-[#00ff88]" />
                <span>AUDIT TRAIL & CONVERSATION</span>
              </div>
              <span className="text-[10px] text-[#6b7280]">{messages.length} MESSAGES</span>
            </div>

            {/* Scrollable messages container */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 pr-1 text-xs">
              {messages.map((m) => {
                const isUser = m.senderType === 'USER';
                const isSystem = m.senderType === 'SYSTEM';

                if (isSystem) {
                  return (
                    <div key={m.id} className="p-3 bg-[#0a0a0f] border-l-2 border-[#00d4ff] text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[#00d4ff] font-bold text-[10px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>SYSTEM EVENT LOG</span>
                      </div>
                      <p className="text-[#e0e0e0] whitespace-pre-wrap">{m.message}</p>
                    </div>
                  );
                }

                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#6b7280]">
                      <span className="font-bold text-[#e0e0e0]">{m.senderName || m.senderType}</span>
                      <span>•</span>
                      <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div
                      className={`max-w-[88%] p-3 text-xs leading-relaxed border ${
                        isUser
                          ? 'bg-[#00ff88]/10 text-[#e0e0e0] border-[#00ff88]/40'
                          : 'bg-[#0a0a0f] text-[#00d4ff] border-[#2a2a3a]'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.message}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Terminal Input Box */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-[#2a2a3a] flex gap-2">
              <div className="relative flex-1 flex items-center bg-[#0a0a0f] border border-[#2a2a3a] focus-within:border-[#00ff88] transition-all">
                <span className="pl-3 text-[#00ff88] font-bold select-none">&gt;</span>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type investigation reply..."
                  className="w-full bg-transparent px-2.5 py-2.5 text-xs text-[#e0e0e0] placeholder-[#6b7280] focus:outline-none"
                />
              </div>
              <CyberButton type="submit" variant="primary" size="md">
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">SEND</span>
              </CyberButton>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
