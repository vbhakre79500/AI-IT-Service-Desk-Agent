'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { 
  ShieldCheck, 
  Cpu, 
  ChevronDown, 
  Sparkles, 
  HelpCircle, 
  Wrench, 
  Layers,
  Terminal,
  Activity
} from 'lucide-react';
import { CyberBadge } from '@/components/ui/cyber';

export function Navbar() {
  const { user, personas, switchUser } = useAuth();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [systemHealth, setSystemHealth] = useState<'OPERATIONAL' | 'DEGRADED' | 'OUTAGE'>('OPERATIONAL');

  useEffect(() => {
    fetch('/api/system-status')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.services) {
          const hasOutage = data.services.some((s: any) => s.status === 'OUTAGE');
          const hasDegraded = data.services.some((s: any) => s.status === 'DEGRADED');
          if (hasOutage) setSystemHealth('OUTAGE');
          else if (hasDegraded) setSystemHealth('DEGRADED');
          else setSystemHealth('OPERATIONAL');
        }
      })
      .catch(() => {});
  }, []);

  const allNavLinks = [
    { href: '/', label: 'Overview & Demos', icon: Sparkles, code: '01', roles: ['EMPLOYEE', 'IT_AGENT', 'IT_ADMIN'] },
    { href: '/employee', label: 'Employee Portal', icon: HelpCircle, code: '02', roles: ['EMPLOYEE', 'IT_AGENT', 'IT_ADMIN'] },
    { href: '/it-desk', label: 'IT Workbench', icon: Wrench, code: '03', roles: ['IT_AGENT', 'IT_ADMIN'] },
    { href: '/admin', label: 'Admin Hub', icon: Layers, code: '04', roles: ['IT_ADMIN'] },
  ];

  const navLinks = allNavLinks.filter((link) => {
    if (!user) return link.href === '/';
    return link.roles.includes(user.role);
  });

  return (
    <header className="sticky top-0 z-50 bg-[#0a0a0f]/95 border-b border-[#2a2a3a] backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Cyber HUD Header */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-[#12121a] border-2 border-[#00ff88] cyber-chamfer-sm flex items-center justify-center text-[#00ff88] group-hover:shadow-[0_0_15px_#00ff88] transition-all">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-black text-base text-white tracking-wider glitch-text">
                  AUTODESK<span className="text-[#00ff88]">_AI</span>
                </span>
                <span className="text-[9px] px-1.5 py-0.5 bg-[#00ff88]/10 text-[#00ff88] font-mono font-bold border border-[#00ff88]/40 uppercase tracking-widest">
                  CORE_HUD
                </span>
              </div>
              <p className="text-[9px] text-[#6b7280] font-mono tracking-widest uppercase">
                AUTONOMOUS IT SERVICE DESK
              </p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 ml-6">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono uppercase font-bold tracking-wider transition-all cyber-chamfer-sm border ${
                    isActive
                      ? 'bg-[#12121a] border-[#00ff88] text-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                      : 'border-transparent text-[#6b7280] hover:text-[#e0e0e0] hover:border-[#2a2a3a] hover:bg-[#12121a]'
                  }`}
                >
                  <span className="text-[10px] text-[#6b7280]">{link.code}:</span>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: System Health & Persona Switcher */}
        <div className="flex items-center gap-3">
          {/* System Health Pill */}
          <Link
            href="/admin?tab=services"
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1 text-[11px] font-mono uppercase font-bold tracking-wider border transition-all ${
              systemHealth === 'OPERATIONAL'
                ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/40 hover:shadow-[0_0_8px_#00ff88]'
                : systemHealth === 'DEGRADED'
                ? 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/40 hover:shadow-[0_0_8px_#f59e0b]'
                : 'bg-[#ff3366]/10 text-[#ff3366] border-[#ff3366]/40 hover:shadow-[0_0_8px_#ff3366]'
            }`}
            title="Enterprise Services Status"
          >
            <span
              className={`w-2 h-2 ${
                systemHealth === 'OPERATIONAL' ? 'bg-[#00ff88] animate-pulse' : 'bg-[#ff3366] animate-ping'
              }`}
            />
            <span>SYS: {systemHealth}</span>
          </Link>

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-[#12121a] border border-[#2a2a3a] hover:border-[#00ff88] cyber-chamfer-sm transition-all text-left group min-h-[44px]"
            >
              <div className="w-7 h-7 bg-[#1c1c2e] border border-[#2a2a3a] flex items-center justify-center text-[#00ff88] font-mono font-bold text-xs">
                {user?.name.slice(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="hidden sm:block text-xs font-mono">
                <p className="font-bold text-[#e0e0e0] leading-tight truncate max-w-[120px]">
                  {user?.name || 'Loading...'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span
                    className={`text-[9px] font-mono px-1 border uppercase font-bold tracking-wider ${
                      user?.role === 'IT_ADMIN'
                        ? 'bg-[#ff00ff]/10 text-[#ff00ff] border-[#ff00ff]/40'
                        : user?.role === 'IT_AGENT'
                        ? 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/40'
                        : 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/40'
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#6b7280] group-hover:text-[#00ff88] transition-transform ${
                  dropdownOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-[#0a0a0f] border-2 border-[#00ff88] p-2 z-50 shadow-[0_0_20px_rgba(0,255,136,0.2)] font-mono animate-in fade-in duration-150">
                <div className="px-3 py-2 border-b border-[#2a2a3a] flex items-center justify-between">
                  <p className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest">
                    // SWITCH USER IDENTITY
                  </p>
                  <span className="text-[9px] text-[#6b7280]">RBAC MODE</span>
                </div>
                <div className="mt-1 space-y-1">
                  {personas.map((p) => {
                    const isSelected = p.id === user?.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          switchUser(p.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-3 py-2 text-left text-xs transition-all border ${
                          isSelected
                            ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]'
                            : 'border-transparent hover:bg-[#12121a] hover:border-[#2a2a3a] text-[#e0e0e0]'
                        }`}
                      >
                        <div className="w-6 h-6 bg-[#12121a] border border-[#2a2a3a] flex items-center justify-center font-bold text-[10px]">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate text-xs">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[9px]">
                            <span
                              className={`px-1 border font-bold uppercase ${
                                p.role === 'IT_ADMIN'
                                  ? 'text-[#ff00ff] border-[#ff00ff]/30'
                                  : p.role === 'IT_AGENT'
                                  ? 'text-[#00d4ff] border-[#00d4ff]/30'
                                  : 'text-[#00ff88] border-[#00ff88]/30'
                              }`}
                            >
                              {p.role}
                            </span>
                            <span className="text-[#6b7280] truncate">{p.department}</span>
                          </div>
                        </div>
                        {isSelected && <span className="w-1.5 h-1.5 bg-[#00ff88]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden border-t border-[#2a2a3a] bg-[#12121a] px-4 py-2 flex items-center justify-around">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-2 text-[10px] font-mono uppercase font-bold tracking-wider ${
                isActive ? 'text-[#00ff88]' : 'text-[#6b7280] hover:text-[#e0e0e0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{link.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </header>
  );
}
