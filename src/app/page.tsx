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
  Zap,
  Radio,
  Workflow,
  Server
} from 'lucide-react';
import { 
  CyberButton, 
  CyberBadge, 
  CyberPanel, 
  CyberTerminal 
} from '@/components/ui/cyber';

export default function HomePage() {
  const { user, personas, switchUser } = useAuth();

  const DEMO_SCENARIOS = [
    {
      id: 'tkt_1042',
      badge: 'PRIMARY DEMO // SOP-104',
      badgeVariant: 'green' as const,
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
      description: 'Demonstrates multi-source evidence triage, Active Directory lockout detection, human authorization intercept, and post-fix verification.',
    },
    {
      id: 'tkt_1043',
      badge: 'DYNAMIC NETWORK TRIAGE // SOP-209',
      badgeVariant: 'cyan' as const,
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
      description: 'Proves the agent dynamically selects a completely different set of network/device tools rather than following a static tree.',
    },
    {
      id: 'tkt_1044',
      badge: 'INFRASTRUCTURE OUTAGE // SOP-999',
      badgeVariant: 'red' as const,
      title: 'Internal Git Server 502 Bad Gateway',
      user: 'David Lightman (Employee)',
      userId: 'usr_emp_02',
      problem: 'Internal Git server returning 502 Bad Gateway on push.',
      trajectory: [
        'check_system_status (internal-git = OUTAGE)',
        'Evaluate policy: SOP-999 boundary',
        'Formulate Tier-3 DevOps handoff dossier',
        'escalate_ticket (ESCALATED)',
      ],
      description: 'Demonstrates graceful, immediate escalation to Tier-3 DevOps when infrastructure outages are beyond L1 autonomous remediation scope.',
    },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* HUD Header / Hero Section */}
      <div className="relative border-b border-[#2a2a3a] pb-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#12121a] border border-[#00ff88]/40 text-[#00ff88] text-[11px] font-mono uppercase tracking-widest font-bold">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>REAL AGENTIC AI // NOT A CHATBOT OR HARDCODED DECISION TREE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-wider uppercase leading-none">
            AI IT SERVICE DESK <br />
            <span className="text-neon-green glitch-text">AUTONOMOUS AGENT</span>
          </h1>

          <p className="text-xs sm:text-sm font-mono text-[#a0a0b0] max-w-2xl mx-auto leading-relaxed">
            Evidence-driven autonomous Helpdesk intelligence that dynamically investigates knowledge runbooks, inspects enterprise infrastructure, audits user states, halts for human approval on high-risk actions, and verifies resolution before closing tickets.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3 font-mono">
            <Link href="/tickets/tkt_1042">
              <CyberButton variant="cta" size="lg">
                <Cpu className="w-5 h-5" />
                <span>LAUNCH PRIMARY DEMO (#INC-1042)</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </CyberButton>
            </Link>
            <Link href="/employee">
              <CyberButton variant="outline" size="lg">
                <HelpCircle className="w-4 h-4 text-[#00ff88]" />
                <span>EMPLOYEE PORTAL</span>
              </CyberButton>
            </Link>
            <Link href="/it-desk">
              <CyberButton variant="outline" size="lg">
                <Wrench className="w-4 h-4 text-[#00d4ff]" />
                <span>IT WORKBENCH</span>
              </CyberButton>
            </Link>
          </div>
        </div>
      </div>

      {/* Cyber Operations Console: Live Demo Scenarios */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#2a2a3a] pb-3">
          <div>
            <h2 className="text-lg font-black text-white tracking-widest uppercase">
              // VERIFIED AUTONOMOUS DEMO SCENARIOS
            </h2>
            <p className="text-xs font-mono text-[#6b7280]">
              Click any ticket scenario to observe dynamic tool selection and policy execution
            </p>
          </div>
          <CyberBadge variant="green" glow>
            3 SCENARIOS READY
          </CyberBadge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {DEMO_SCENARIOS.map((scen) => (
            <div
              key={scen.id}
              className="bg-[#12121a] border border-[#2a2a3a] hover:border-[#00ff88] p-5 flex flex-col justify-between space-y-4 cyber-chamfer transition-all hover:shadow-[0_0_15px_rgba(0,255,136,0.15)] group"
            >
              <div className="space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <CyberBadge variant={scen.badgeVariant}>
                    {scen.badge}
                  </CyberBadge>
                  <span className="text-[10px] text-[#6b7280] font-bold">#{scen.id}</span>
                </div>

                <h3 className="font-heading font-black text-base text-white group-hover:text-[#00ff88] transition-colors">
                  {scen.title}
                </h3>

                <div className="p-2.5 bg-[#0a0a0f] border border-[#2a2a3a] text-xs space-y-1">
                  <span className="text-[10px] text-[#6b7280] block font-bold">SUBMITTER: {scen.user}</span>
                  <p className="text-[#e0e0e0] italic">&ldquo;{scen.problem}&rdquo;</p>
                </div>

                {/* Trajectory visualization */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-[#6b7280] uppercase font-bold block">
                    DYNAMIC AGENT TRAJECTORY:
                  </span>
                  <div className="space-y-1">
                    {scen.trajectory.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[11px] text-[#a0a0b0]">
                        <span className="text-[9px] text-[#00ff88] font-bold font-mono">
                          0{idx + 1}&gt;
                        </span>
                        <span className="truncate">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-xs text-[#6b7280] pt-2 border-t border-[#2a2a3a]">
                  {scen.description}
                </p>
              </div>

              <div className="pt-2">
                <Link href={`/tickets/${scen.id}`} className="block">
                  <CyberButton variant="primary" className="w-full">
                    <span>INSPECT INCIDENT TRAJECTORY</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </CyberButton>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Architecture & Verification Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono">
        <div className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer-sm space-y-2">
          <div className="flex items-center gap-2 text-[#00ff88]">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">DYNAMIC REACT LOOP</span>
          </div>
          <p className="text-xs text-[#a0a0b0]">
            Autonomous evidence synthesis over live runbooks, network states, and system APIs.
          </p>
        </div>

        <div className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer-sm space-y-2">
          <div className="flex items-center gap-2 text-[#ff00ff]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">POLICY GUARDRAILS</span>
          </div>
          <p className="text-xs text-[#a0a0b0]">
            Zero privilege escalation. State modifications intercepted for explicit human authorization.
          </p>
        </div>

        <div className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer-sm space-y-2">
          <div className="flex items-center gap-2 text-[#00d4ff]">
            <Workflow className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">15 EXTENSIBLE TOOLS</span>
          </div>
          <p className="text-xs text-[#a0a0b0]">
            Diagnose networks, query Active Directory, test connectivity, restart services, and clear caches.
          </p>
        </div>

        <div className="bg-[#12121a] border border-[#2a2a3a] p-4 cyber-chamfer-sm space-y-2">
          <div className="flex items-center gap-2 text-[#00ff88]">
            <Server className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">GEMINI + FALLBACK</span>
          </div>
          <p className="text-xs text-[#a0a0b0]">
            Live Google Gemini 3.5 Flash Lite engine paired with local zero-dependency reasoning fallback.
          </p>
        </div>
      </div>
    </div>
  );
}
