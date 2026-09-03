'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Headphones, 
  Lock, 
  User, 
  KeyRound, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Users
} from 'lucide-react';

const AGENT_SHORTCUTS = [
  {
    username: 'sarah.jenkins',
    name: 'Sarah Jenkins',
    role: 'Senior Member Support Specialist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop'
  },
  {
    username: 'alex.rivera',
    name: 'Alex Rivera',
    role: 'Billing & Corporate Operations Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'
  },
  {
    username: 'priya.sharma',
    name: 'Priya Sharma',
    role: 'Mentorship & Legal Credentials Lead',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&auto=format&fit=crop'
  },
  {
    username: 'marcus.vance',
    name: 'Marcus Vance',
    role: 'Platform Engineering & Technical Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop'
  }
];

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMsg('Please enter both your agent username and password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.error || 'Authentication failed. Please verify your credentials.');
        setIsLoading(false);
        return;
      }

      // Successful login
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg('Network error connecting to authentication service.');
      setIsLoading(false);
    }
  };

  const handleSelectQuickAgent = (agentUsername: string) => {
    setUsername(agentUsername);
    setPassword('wipa2026');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen w-screen bg-[#f8fafc] text-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#5a32fa]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#ff2a5f]/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5a32fa] via-[#7c3aed] to-[#ff2a5f] p-0.5 shadow-lg shadow-purple-500/20 mb-1">
            <div className="h-full w-full rounded-[14px] bg-white flex items-center justify-center">
              <Headphones size={26} className="text-[#5a32fa]" />
            </div>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            WIPA Support Console
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 border border-slate-300/80 text-[11px] font-mono text-slate-700">
            <Lock size={11} className="text-purple-600" />
            <span>supportglobal.womensipalliance.com</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xl shadow-slate-200/60 space-y-5 backdrop-blur-sm">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Agent Portal Login
            </h2>
            <p className="text-xs text-slate-500">
              Sign in to answer live member chats, tickets, and escalation queues.
            </p>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2 animate-fade-in">
              <AlertCircle size={16} className="shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Agent Username or Email
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. sarah, alex, priya, marcus"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#5a32fa] focus:bg-white focus:ring-2 focus:ring-[#5a32fa]/15 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Password
                </label>
                <span className="text-[10px] text-slate-400">Default: wipa2026</span>
              </div>
              <div className="relative">
                <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#5a32fa] focus:bg-white focus:ring-2 focus:ring-[#5a32fa]/15 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#5a32fa] to-[#7c3aed] hover:from-[#4b26dc] hover:to-[#6d28d9] shadow-md shadow-purple-500/25 disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Agent Console</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Staff Selection */}
          <div className="pt-4 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users size={12} />
                <span>Authorized Agent Accounts</span>
              </span>
              <span className="text-[10px] text-purple-600 font-semibold">1-Click Auto Fill</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {AGENT_SHORTCUTS.map((agent) => (
                <button
                  key={agent.username}
                  type="button"
                  onClick={() => handleSelectQuickAgent(agent.username)}
                  className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-purple-50 hover:border-purple-300 text-left transition-all cursor-pointer flex items-center gap-2 group"
                >
                  <img 
                    src={agent.avatar} 
                    alt={agent.name} 
                    className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200 group-hover:ring-purple-400" 
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-purple-700 truncate">
                      {agent.name}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      {agent.username}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 text-center">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>PostgreSQL Server-Side Session Auth • WIPA Internal Support Protocol</span>
        </div>
      </div>
    </div>
  );
}
