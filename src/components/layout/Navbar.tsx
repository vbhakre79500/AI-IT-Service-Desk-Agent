'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { 
  ShieldCheck, 
  Cpu, 
  UserCheck, 
  Activity, 
  ChevronDown, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  Wrench,
  Layers
} from 'lucide-react';

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

  const navLinks = [
    { href: '/', label: 'Overview & Demos', icon: Sparkles },
    { href: '/employee', label: 'Employee Portal', icon: HelpCircle },
    { href: '/it-desk', label: 'IT Workbench', icon: Wrench },
    { href: '/admin', label: 'Admin Hub', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-white tracking-tight">AutoDesk</span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono font-semibold border border-cyan-500/30">
                  AI AGENT
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 tracking-wider uppercase">Autonomous Resolution</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 ml-4">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: System Health & Persona Switcher */}
        <div className="flex items-center gap-4">
          {/* System Health Pill */}
          <Link
            href="/admin?tab=services"
            className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-mono border transition-colors ${
              systemHealth === 'OPERATIONAL'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : systemHealth === 'DEGRADED'
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20'
            }`}
            title="Enterprise Services Status"
          >
            <span className={`w-2 h-2 rounded-full ${systemHealth === 'OPERATIONAL' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400 animate-ping'}`} />
            <span>Systems: {systemHealth}</span>
          </Link>

          {/* Persona Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl glass-panel hover:border-slate-600 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-inner">
                {user?.name.slice(0, 2).toUpperCase() || 'US'}
              </div>
              <div className="hidden sm:block text-xs">
                <p className="font-semibold text-slate-200 leading-tight">{user?.name || 'Loading...'}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`text-[10px] font-mono px-1.5 rounded uppercase font-semibold ${
                      user?.role === 'IT_ADMIN'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : user?.role === 'IT_AGENT'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {user?.role}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-white transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl glass-panel bg-slate-900/95 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Switch Persona</p>
                  <p className="text-[11px] text-slate-500">Test different RBAC roles & permissions</p>
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
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs transition-all ${
                          isSelected
                            ? 'bg-cyan-500/15 border border-cyan-500/30 text-white'
                            : 'hover:bg-slate-800/80 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-[10px]">
                          {p.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{p.name}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`text-[9px] font-mono px-1 rounded uppercase ${
                                p.role === 'IT_ADMIN'
                                  ? 'bg-purple-500/20 text-purple-300'
                                  : p.role === 'IT_AGENT'
                                  ? 'bg-blue-500/20 text-blue-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {p.role}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate">{p.department}</span>
                          </div>
                        </div>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
