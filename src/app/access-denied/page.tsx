'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert, ArrowLeft, Lock, Terminal, UserCheck } from 'lucide-react';
import { CyberButton, CyberBadge } from '@/components/ui/cyber';
import { useAuth } from '@/components/layout/AuthProvider';

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const requiredRole = searchParams.get('required') || 'IT_ADMIN';
  const currentRole = searchParams.get('current') || 'EMPLOYEE';
  const target = searchParams.get('target') || '/';
  const { user, personas, switchUser } = useAuth();

  return (
    <div className="max-w-2xl mx-auto py-12 px-4 font-mono space-y-6">
      <div className="bg-[#12121a] border-2 border-[#ff3366] p-6 shadow-[0_0_25px_rgba(255,51,102,0.3)] cyber-chamfer space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#ff3366]/40">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-6 h-6 text-[#ff3366] animate-pulse" />
            <h1 className="font-heading font-black text-lg text-[#ff3366] tracking-wider uppercase">
              // 403 FORBIDDEN: ACCESS DENIED
            </h1>
          </div>
          <CyberBadge variant="red" glow>
            SECURITY BREACH BLOCKED
          </CyberBadge>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-[#e0e0e0] leading-relaxed">
            Your active identity clearance lacks the required privileges to enter this operational zone. Server-side role-based access control has intercepted your request.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0a0a0f] border border-[#2a2a3a] p-3 text-xs">
            <div>
              <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-0.5">TARGET RESOURCE</span>
              <span className="text-white font-bold">{target}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-0.5">REQUIRED CLEARANCE</span>
              <span className="text-[#00ff88] font-bold">{requiredRole}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#6b7280] uppercase font-bold block mb-0.5">YOUR ROLE</span>
              <span className="text-[#ff3366] font-bold text-neon-red">{currentRole}</span>
            </div>
          </div>
        </div>

        {/* Identity switch prompt for judges/testers */}
        <div className="p-3.5 bg-[#0a0a0f] border border-[#2a2a3a] text-xs space-y-2">
          <div className="flex items-center gap-2 text-[#00d4ff] font-bold text-[11px] uppercase">
            <UserCheck className="w-4 h-4" />
            <span>SWITCH IDENTITY TO AN AUTHORIZED ROLE:</span>
          </div>
          <p className="text-[#6b7280]">
            Select an account with <span className="text-[#00ff88] font-bold">{requiredRole}</span> clearance to verify server-side authorization:
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {personas
              .filter((p) => (requiredRole === 'IT_ADMIN' ? p.role === 'IT_ADMIN' : p.role === 'IT_ADMIN' || p.role === 'IT_AGENT'))
              .map((p) => (
                <button
                  key={p.id}
                  onClick={() => switchUser(p.id)}
                  className="px-3 py-1.5 bg-[#12121a] border border-[#00d4ff]/40 text-[#00d4ff] hover:bg-[#00d4ff]/20 text-xs font-bold font-mono transition-all"
                >
                  ⚡ Log in as {p.name} ({p.role})
                </button>
              ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#2a2a3a] flex items-center justify-between gap-3">
          <Link href="/">
            <CyberButton variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4" />
              <span>RETURN TO OVERVIEW</span>
            </CyberButton>
          </Link>
          <Link href="/employee">
            <CyberButton variant="primary" size="sm">
              <span>GO TO EMPLOYEE PORTAL</span>
            </CyberButton>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-[#6b7280] font-mono">Loading access check...</div>}>
      <AccessDeniedContent />
    </Suspense>
  );
}
