'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/layout/AuthProvider';
import { ShieldCheck, Cpu, Terminal, ArrowRight, Lock, Key } from 'lucide-react';
import { CyberButton, CyberBadge, CyberInput } from '@/components/ui/cyber';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/';
  const { personas, switchUser } = useAuth();
  const [selectedUserId, setSelectedUserId] = useState<string>('usr_emp_01');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (userId: string) => {
    try {
      setIsSubmitting(true);
      await switchUser(userId);
      router.push(next);
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12 px-4 font-mono space-y-6">
      <div className="bg-[#12121a] border-2 border-[#00ff88] p-6 shadow-[0_0_25px_rgba(0,255,136,0.2)] cyber-chamfer space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#2a2a3a]">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#00ff88]" />
            <h1 className="font-heading font-black text-sm text-white tracking-wider uppercase">
              // ENTERPRISE IDENTITY &amp; ACCESS LOGIN
            </h1>
          </div>
          <CyberBadge variant="green" glow>
            AUTH REQUIRED
          </CyberBadge>
        </div>

        <p className="text-xs text-[#a0a0b0] leading-relaxed">
          Authentication is required to access protected IT service desk consoles. Select an enterprise persona below to establish an authentic signed cryptographic session.
        </p>

        {/* Persona Selectors */}
        <div className="space-y-2 pt-2">
          <span className="text-[10px] text-[#6b7280] uppercase font-bold block">
            SELECT AUTHENTICATED PERSONA FOR THIS SESSION:
          </span>

          <div className="space-y-2">
            {personas.map((p) => {
              const isSelected = selectedUserId === p.id;
              const roleColor =
                p.role === 'IT_ADMIN'
                  ? 'text-[#ff00ff] border-[#ff00ff]/40 bg-[#ff00ff]/10'
                  : p.role === 'IT_AGENT'
                  ? 'text-[#00d4ff] border-[#00d4ff]/40 bg-[#00d4ff]/10'
                  : 'text-[#00ff88] border-[#00ff88]/40 bg-[#00ff88]/10';

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedUserId(p.id)}
                  className={`p-3 bg-[#0a0a0f] border cursor-pointer transition-all flex items-center justify-between ${
                    isSelected
                      ? 'border-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.2)]'
                      : 'border-[#2a2a3a] hover:border-[#6b7280]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-white">{p.name}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 border font-bold uppercase ${roleColor}`}>
                        {p.role}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6b7280]">{p.department} • {p.email}</p>
                  </div>

                  <input
                    type="radio"
                    name="persona"
                    checked={isSelected}
                    onChange={() => setSelectedUserId(p.id)}
                    className="accent-[#00ff88]"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-[#2a2a3a] flex items-center justify-between">
          <span className="text-[10px] text-[#6b7280]">
            * Sets signed HttpOnly cookie (SameSite=Lax)
          </span>

          <CyberButton
            variant="cta"
            onClick={() => handleLogin(selectedUserId)}
            disabled={isSubmitting}
            className="min-h-[44px]"
          >
            <span>{isSubmitting ? 'AUTHENTICATING...' : 'AUTHENTICATE & ENTER'}</span>
            <ArrowRight className="w-4 h-4" />
          </CyberButton>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-[#6b7280] font-mono">Loading authentication console...</div>}>
      <LoginContent />
    </Suspense>
  );
}
