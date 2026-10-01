'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/layout/AuthProvider';
import { 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Activity, 
  Wrench,
  HelpCircle,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const { user, personas, switchUser } = useAuth();

  const DEMO_SCENARIOS = [
    {
      id: 'tkt_1042',
      badge: 'PRIMARY DEMO SCENARIO',
      badgeColor: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10',
      title: 'HR Portal Authentication Failure',
      user: 'Sarah Connor (Employee)',
      userId: 'usr_emp_01',
      problem: "I can't access the HR portal. It says authentication failed.",
      trajectory: [
        'search_knowledge_base (SOP-104)',
        'check_system_status (hr-portal = UP)',
        'check_user_account (status = LOCKED)',
        'run_diagnostics (HTTP 403 verified)',
        'Approval: unlock_account',
        'Verification: account = ACTIVE',
        'close_ticket (RESOLVED)',
      ],
      description: 'Demonstrates multi-source evidence triage, account lock detection, human authorization, and automated post-fix verification.',
    },
    {
      id: 'tkt_1043',
      badge: 'ALTERNATIVE PATH DEMO',
      badgeColor: 'border-indigo-500/40 text-indigo-400 bg-indigo-500/10',
      title: 'VPN Stopped Connecting (TLS Timeout)',
      user: 'David Lightman (Employee)',
      userId: 'usr_emp_02',
      problem: 'VPN client refuses to connect with error TLS-handshake-timeout.',
      trajectory: [
        'search_knowledge_base (SOP-209)',
        'check_system_status (gateway = UP)',
        'check_network_status (latency = 24ms)',
        'check_device_status (client outdated)',
        'Approval: clear_application_cache',
        'Verification: handshake verified',
        'close_ticket (RESOLVED)',
      ],
      description: 'Proves the agent dynamically selects a completely different set of network/device tools rather than following a fixed workflow.',
    },
    {
      id: 'tkt_1044',
      badge: 'INFRASTRUCTURE ESCALATION',
      badgeColor: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
      title: 'Internal Git Server 502 Bad Gateway',
      user: 'David Lightman (Employee)',
      userId: 'usr_emp_02',
      problem: 'Internal Git server returning 502 Bad Gateway on push.',
      trajectory: [
        'check_system_status (internal-git = OUTAGE)',
        'Evaluate policy: SOP-999',
        'Formulate Tier-3 handoff dossier',
        'escalate_ticket (ESCALATED)',
      ],
      description: 'Demonstrates graceful, immediate escalation to Tier-3 DevOps when infrastructure outages are beyond L1 autonomous scope.',
    },
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel border border-cyan-500/30 text-xs font-semibold text-cyan-300">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real Agentic AI — Not A Rule Bot, Chatbot, Or Hardcoded Tree</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
          AI IT Service Desk <br />
          <span className="gradient-text">Autonomous Resolution Agent</span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          An evidence-driven Helpdesk agent that dynamically queries knowledge runbooks, checks enterprise systems, investigates accounts, requests human approvals for sensitive actions, and verifies resolution before closing tickets.
        </p>

        {/* Quick CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link
            href="/tickets/tkt_1042"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-cyan-500/25 hover:scale-105 transition-all"
          >
            <Cpu className="w-5 h-5" />
            <span>Launch Primary Demo (#INC-1042)</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
          <Link
            href="/employee"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-panel text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 hover:border-slate-500 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Employee Portal</span>
          </Link>
          <Link
            href="/it-desk"
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl glass-panel text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 hover:border-slate-500 transition-all"
          >
            <Wrench className="w-4 h-4 text-blue-400" />
            <span>IT Agent Workbench</span>
          </Link>
        </div>
      </div>

      {/* Core Dynamic Differentiator Section */}
      <div className="p-8 rounded-3xl glass-panel border border-slate-800 bg-gradient-to-br from-slate-900/90 to-slate-950 space-y-6">
        <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
          <Terminal className="w-4 h-4" />
          <span>The Core Agentic Requirement</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">
              Dynamic Tool Selection Based on Evolving Evidence
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              AutoDesk AI does <strong className="text-white">not</strong> blindly execute the same sequence of steps. Each action evaluates the problem statement, prior tool responses, policy permissions, and hypothesis state:
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>No Fixed Workflows:</strong> VPN problems check networks; auth problems check lockout policies.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Zero Privilege Escalation:</strong> The LLM never touches raw infrastructure. All tools route through the Policy Engine.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Automated Verification:</strong> Tickets are never marked resolved without proof that the fix worked.</span>
              </li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between text-slate-500 text-[10px] pb-2 border-b border-slate-800">
              <span>EVIDENCE DECISION GRAPH</span>
              <span className="text-emerald-400 font-bold">STATE: EVALUATING</span>
            </div>
            <div className="space-y-1.5 text-slate-300">
              <p><span className="text-cyan-400">1. INPUT:</span> &quot;Can&apos;t access HR portal, authentication failed&quot;</p>
              <p><span className="text-indigo-400">2. HYPOTHESIS:</span> Outage vs. Stale Token vs. Account Lock</p>
              <p><span className="text-emerald-400">3. TOOL 1:</span> search_knowledge_base &rarr; SOP-104 retrieved</p>
              <p><span className="text-emerald-400">4. TOOL 2:</span> check_system_status &rarr; HR portal OPERATIONAL</p>
              <p><span className="text-emerald-400">5. TOOL 3:</span> check_user_account &rarr; LOCKED (5 bad logins)</p>
              <p><span className="text-amber-400">6. DECISION:</span> Request approval to unlock_account</p>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Scenarios Grid */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Interactive Hackathon Demo Scenarios</h2>
          <p className="text-xs text-slate-400 mt-1">
            Click on any scenario to inspect the autonomous agent trajectory, test human approval, or trigger fresh triage.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {DEMO_SCENARIOS.map((demo) => (
            <div
              key={demo.id}
              className="glass-panel glass-panel-hover rounded-3xl p-6 border border-slate-800/90 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${demo.badgeColor}`}>
                  {demo.badge}
                </span>

                <div>
                  <h3 className="text-lg font-bold text-white">{demo.title}</h3>
                  <p className="text-xs text-cyan-400 mt-0.5">Reported by {demo.user}</p>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs italic text-slate-300">
                  &quot;{demo.problem}&quot;
                </div>

                <div className="space-y-1.5">
                  <p className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                    Observed Tool Trajectory:
                  </p>
                  <div className="space-y-1">
                    {demo.trajectory.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
                        <span className="text-slate-600 text-[10px]">{idx + 1}.</span>
                        <span className={step.includes('Approval') ? 'text-amber-400 font-bold' : step.includes('close_ticket') ? 'text-emerald-400 font-bold' : step.includes('escalate') ? 'text-rose-400 font-bold' : ''}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-slate-400">{demo.description}</p>
              </div>

              <div className="pt-4 border-t border-slate-800/80">
                <Link
                  href={`/tickets/${demo.id}`}
                  onClick={() => switchUser(demo.userId)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-cyan-400 font-bold text-xs transition-all"
                >
                  <span>Launch & Run Scenario</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
