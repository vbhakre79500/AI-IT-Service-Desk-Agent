'use client';

import React from 'react';

// ==========================================
// 1. CyberButton
// ==========================================
export interface CyberButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'outline' | 'ghost' | 'cta';
  size?: 'sm' | 'md' | 'lg';
  chamfer?: boolean;
  children: React.ReactNode;
}

export function CyberButton({
  variant = 'primary',
  size = 'md',
  chamfer = true,
  className = '',
  children,
  ...props
}: CyberButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs min-h-[36px]',
    md: 'px-4 py-2 text-xs min-h-[44px]',
    lg: 'px-6 py-3 text-sm min-h-[48px]',
  }[size];

  const variantClasses = {
    primary:
      'bg-transparent border-2 border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88] hover:text-[#0a0a0f] hover:shadow-[0_0_15px_#00ff88] focus-visible:ring-2 focus-visible:ring-[#00ff88]',
    secondary:
      'bg-transparent border-2 border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff] hover:text-[#0a0a0f] hover:shadow-[0_0_15px_#ff00ff] focus-visible:ring-2 focus-visible:ring-[#ff00ff]',
    tertiary:
      'bg-transparent border-2 border-[#00d4ff] text-[#00d4ff] hover:bg-[#00d4ff] hover:text-[#0a0a0f] hover:shadow-[0_0_15px_#00d4ff] focus-visible:ring-2 focus-visible:ring-[#00d4ff]',
    destructive:
      'bg-transparent border-2 border-[#ff3366] text-[#ff3366] hover:bg-[#ff3366] hover:text-[#0a0a0f] hover:shadow-[0_0_15px_#ff3366] focus-visible:ring-2 focus-visible:ring-[#ff3366]',
    outline:
      'bg-transparent border border-[#2a2a3a] text-[#e0e0e0] hover:border-[#00ff88] hover:text-[#00ff88] hover:shadow-[0_0_8px_rgba(0,255,136,0.3)] focus-visible:ring-2 focus-visible:ring-[#00ff88]',
    ghost:
      'bg-transparent border-transparent text-[#6b7280] hover:text-[#00ff88] hover:bg-[#1c1c2e] focus-visible:ring-2 focus-visible:ring-[#00ff88]',
    cta:
      'bg-[#00ff88] text-[#0a0a0f] border-2 border-[#00ff88] font-black hover:bg-[#00ff88]/90 hover:shadow-[0_0_20px_#00ff88] focus-visible:ring-2 focus-visible:ring-[#00ff88]',
  }[variant];

  const chamferClass = chamfer ? 'cyber-chamfer-sm' : 'rounded-none';

  return (
    <button
      className={`font-mono uppercase font-bold tracking-wider transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:pointer-events-none active:scale-[0.98] ${chamferClass} ${sizeClasses} ${variantClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ==========================================
// 2. CyberBadge
// ==========================================
export interface CyberBadgeProps {
  variant?: 'green' | 'magenta' | 'cyan' | 'red' | 'amber' | 'muted';
  glow?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function CyberBadge({
  variant = 'green',
  glow = false,
  className = '',
  children,
}: CyberBadgeProps) {
  const variantStyles = {
    green: 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/40',
    magenta: 'bg-[#ff00ff]/10 text-[#ff00ff] border-[#ff00ff]/40',
    cyan: 'bg-[#00d4ff]/10 text-[#00d4ff] border-[#00d4ff]/40',
    red: 'bg-[#ff3366]/10 text-[#ff3366] border-[#ff3366]/40',
    amber: 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/40',
    muted: 'bg-[#1c1c2e] text-[#6b7280] border-[#2a2a3a]',
  }[variant];

  const glowStyle = glow ? 'shadow-[0_0_8px_currentColor]' : '';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono uppercase font-bold tracking-widest border ${variantStyles} ${glowStyle} ${className}`}
    >
      {children}
    </span>
  );
}

// ==========================================
// 3. CyberPanel / CyberCard
// ==========================================
export interface CyberPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  chamfer?: boolean;
  hudCorners?: boolean;
  neonBorder?: boolean;
  children: React.ReactNode;
}

export function CyberPanel({
  chamfer = true,
  hudCorners = false,
  neonBorder = false,
  className = '',
  children,
  ...props
}: CyberPanelProps) {
  const chamferClass = chamfer ? 'cyber-chamfer' : '';
  const hudClass = hudCorners ? 'hud-corner' : '';
  const borderClass = neonBorder
    ? 'border border-[#00ff88]/50 shadow-[0_0_12px_rgba(0,255,136,0.15)]'
    : 'border border-[#2a2a3a]';

  return (
    <div
      className={`bg-[#12121a] relative ${borderClass} ${chamferClass} ${hudClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

// ==========================================
// 4. CyberInput
// ==========================================
export interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  prefixSymbol?: string;
}

export function CyberInput({
  label,
  prefixSymbol = '>',
  className = '',
  ...props
}: CyberInputProps) {
  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label className="block text-[11px] font-mono uppercase tracking-wider text-[#6b7280]">
          {label}
        </label>
      )}
      <div className="relative flex items-center bg-[#12121a] border border-[#2a2a3a] focus-within:border-[#00ff88] focus-within:shadow-[0_0_10px_rgba(0,255,136,0.25)] transition-all">
        {prefixSymbol && (
          <span className="pl-3 text-[#00ff88] font-mono text-sm select-none font-bold">
            {prefixSymbol}
          </span>
        )}
        <input
          className={`w-full bg-transparent px-3 py-2 text-xs font-mono text-[#e0e0e0] placeholder-[#6b7280] focus:outline-none ${className}`}
          {...props}
        />
      </div>
    </div>
  );
}

// ==========================================
// 5. CyberTerminal
// ==========================================
export interface CyberTerminalProps {
  title?: string;
  lines: Array<{
    prompt?: string;
    text: string;
    type?: 'info' | 'success' | 'warn' | 'error' | 'cmd';
    timestamp?: string;
  }>;
  className?: string;
}

export function CyberTerminal({
  title = 'AI AGENT CORE TERMINAL // ACTIVE SUBSYSTEM',
  lines,
  className = '',
}: CyberTerminalProps) {
  return (
    <div className={`bg-[#0a0a0f] border border-[#2a2a3a] relative overflow-hidden font-mono ${className}`}>
      {/* Terminal Title Bar */}
      <div className="bg-[#12121a] border-b border-[#2a2a3a] px-3 py-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-[#ff3366] inline-block" />
          <span className="w-2 h-2 bg-[#f59e0b] inline-block" />
          <span className="w-2 h-2 bg-[#00ff88] inline-block" />
          <span className="text-[#6b7280] uppercase tracking-wider ml-1 font-bold">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#00ff88]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
          <span>CONNECTED</span>
        </div>
      </div>

      {/* Terminal Output */}
      <div className="p-3.5 space-y-1.5 text-xs max-h-72 overflow-y-auto">
        {lines.map((l, i) => {
          const colorClass = {
            info: 'text-[#e0e0e0]',
            success: 'text-[#00ff88]',
            warn: 'text-[#f59e0b]',
            error: 'text-[#ff3366]',
            cmd: 'text-[#00d4ff]',
          }[l.type || 'info'];

          return (
            <div key={i} className="flex items-start gap-2 leading-relaxed">
              {l.timestamp && (
                <span className="text-[#6b7280] text-[10px] shrink-0 font-mono select-none">
                  [{l.timestamp}]
                </span>
              )}
              <span className="text-[#00ff88] select-none font-bold shrink-0">
                {l.prompt || '>'}
              </span>
              <span className={`break-all ${colorClass}`}>{l.text}</span>
            </div>
          );
        })}
        {/* Blinking Prompt Line */}
        <div className="flex items-center gap-2 pt-1 text-[#00ff88]">
          <span className="font-bold select-none">&gt;</span>
          <span className="inline-block w-2 h-3.5 bg-[#00ff88] terminal-cursor" />
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. CyberStatus
// ==========================================
export interface CyberStatusProps {
  status: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE' | 'RUNNING' | 'INVESTIGATING' | 'AWAITING_APPROVAL' | 'COMPLETED' | 'ESCALATED';
  showLabel?: boolean;
}

export function CyberStatus({ status, showLabel = true }: CyberStatusProps) {
  const config = {
    OPERATIONAL: { color: '#00ff88', text: 'OPERATIONAL', bg: 'bg-[#00ff88]/10', border: 'border-[#00ff88]/30', ping: false },
    DEGRADED: { color: '#f59e0b', text: 'DEGRADED', bg: 'bg-[#f59e0b]/10', border: 'border-[#f59e0b]/30', ping: true },
    OUTAGE: { color: '#ff3366', text: 'OUTAGE', bg: 'bg-[#ff3366]/10', border: 'border-[#ff3366]/30', ping: true },
    RUNNING: { color: '#00d4ff', text: 'EXECUTING', bg: 'bg-[#00d4ff]/10', border: 'border-[#00d4ff]/30', ping: true },
    INVESTIGATING: { color: '#00d4ff', text: 'INVESTIGATING', bg: 'bg-[#00d4ff]/10', border: 'border-[#00d4ff]/30', ping: true },
    AWAITING_APPROVAL: { color: '#ff00ff', text: 'APPROVAL REQUIRED', bg: 'bg-[#ff00ff]/10', border: 'border-[#ff00ff]/40', ping: true },
    COMPLETED: { color: '#00ff88', text: 'RESOLVED', bg: 'bg-[#00ff88]/10', border: 'border-[#00ff88]/30', ping: false },
    ESCALATED: { color: '#ff3366', text: 'ESCALATED', bg: 'bg-[#ff3366]/10', border: 'border-[#ff3366]/30', ping: false },
  }[status] || { color: '#6b7280', text: status, bg: 'bg-[#1c1c2e]', border: 'border-[#2a2a3a]', ping: false };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono uppercase font-bold tracking-wider border ${config.bg} ${config.border}`} style={{ color: config.color }}>
      <span
        className={`w-1.5 h-1.5 inline-block ${config.ping ? 'animate-ping' : ''}`}
        style={{ backgroundColor: config.color }}
      />
      {showLabel && <span>{config.text}</span>}
    </span>
  );
}
