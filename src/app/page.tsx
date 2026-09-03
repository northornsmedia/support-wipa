'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Send, 
  Sparkles, 
  Clock, 
  Phone, 
  Mail, 
  ChevronDown, 
  RefreshCw, 
  X, 
  Check, 
  Copy, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  User, 
  Search, 
  CheckCircle2, 
  Lock, 
  Tag, 
  StickyNote, 
  UserPlus, 
  Users, 
  LogOut,
  ArrowRight
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface AgentProfile {
  id: string;
  username?: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
}

export const AGENT_TEAM: AgentProfile[] = [
  {
    id: 'sarah-jenkins',
    username: 'sarah.jenkins',
    name: 'Sarah Jenkins',
    role: 'Senior Member Support Specialist',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop',
    email: 'sarah.jenkins@womensipalliance.com'
  },
  {
    id: 'alex-rivera',
    username: 'alex.rivera',
    name: 'Alex Rivera',
    role: 'Billing & Corporate Operations Lead',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop',
    email: 'alex.rivera@womensipalliance.com'
  },
  {
    id: 'priya-sharma',
    username: 'priya.sharma',
    name: 'Priya Sharma',
    role: 'Mentorship & Legal Credentials Lead',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=256&auto=format&fit=crop',
    email: 'priya.sharma@womensipalliance.com'
  },
  {
    id: 'marcus-vance',
    username: 'marcus.vance',
    name: 'Marcus Vance',
    role: 'Platform Engineering & Technical Lead',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&auto=format&fit=crop',
    email: 'marcus.vance@womensipalliance.com'
  }
];

interface SupportSession {
  id: string;
  ticket_number: string;
  user_id?: string;
  user_name: string;
  user_email?: string;
  user_avatar?: string;
  user_tier?: string;
  status: 'active' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  assigned_agent_name?: string;
  assigned_agent_avatar?: string;
  assigned_agent_email?: string;
  last_message?: string;
  last_message_at?: string;
  unread_agent_count?: number;
  created_at?: string;
}

interface SupportMessage {
  id: string;
  session_id: string;
  sender_type: 'user' | 'agent' | 'system';
  sender_name: string;
  sender_avatar?: string;
  sender_id?: string;
  content: string;
  attachment_name?: string;
  attachment_url?: string;
  attachment_size?: string;
  attachment_type?: string;
  is_read?: boolean;
  created_at?: string;
  is_internal_note?: boolean;
}

const CANNED_RESPONSES = [
  {
    id: 'cal-sync',
    label: '📅 Google Calendar Sync Guide',
    content: "To sync your WIPA events to Google Calendar:\n1. Open your WIPA Calendar (wipa.org/platform/calendar)\n2. Click the 'Sync Google Calendar' button in the top-right\n3. Authorize Google permissions\nAll webinar and event RSVPs will automatically appear on your Google Calendar with reminders!"
  },
  {
    id: 'tier-upgrade',
    label: '💎 Membership Tier & Billing',
    content: "You can manage your membership or upgrade to Executive/Corporate tier directly at: wipa.org/pricing.\n\nAll invoices with VAT/Tax breakdown are accessible under Settings > Billing History. Let me know if you'd like me to apply a corporate discount code for your firm!"
  },
  {
    id: 'mentorship',
    label: '🤝 Mentorship Program Matching',
    content: "The WIPA Mentorship Program pairs members quarterly based on practice area and industry focus. You can apply as a mentor or mentee at wipa.org/platform/mentorship. Applications for the next cohort close on the 15th of this month!"
  },
  {
    id: 'firm-profile',
    label: '🏢 Verified Firm Directory',
    content: "You can claim or create a verified Law Firm Profile at wipa.org/platform/business/create.\nOnce submitted, our Member Relations team verifies bar credentials and firm active status within 24 hours."
  },
  {
    id: 'bug-investigate',
    label: '🛠️ Bug Logged to Engineering',
    content: "Thank you for reporting this issue. I have escalated this directly to our platform engineering team under ticket #{TICKET}. We are investigating the telemetry logs and will follow up shortly."
  },
  {
    id: 'closing',
    label: '👋 Wrap Up & Thank You',
    content: "It was my pleasure assisting you today! If you need anything else, don't hesitate to reach back out anytime. Have a wonderful day!"
  }
];

const formatMessageTime = (ts?: string) => {
  if (!ts) return 'Just now';
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
};

export default function AgentCommandCenter() {
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, SupportMessage[]>>({});

  const [currentAgent, setCurrentAgent] = useState<AgentProfile>(AGENT_TEAM[0]);
  const [showAgentPicker, setShowAgentPicker] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'mine' | 'unassigned'>('all');

  const [inputMessage, setInputMessage] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'resolved'>('active');
  const [agentStatus, setAgentStatus] = useState<'online' | 'busy' | 'away'>('online');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showMacros, setShowMacros] = useState(false);
  const [showRightDrawerMobile, setShowRightDrawerMobile] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  // Authenticate on mount via Server Auth API
  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.agent) {
          setCurrentAgent(data.agent);
        } else {
          window.location.href = '/login';
        }
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  // Play audio alert on new member message
  const playAlert = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {}
  };

  // Fetch real sessions from Supabase on mount
  useEffect(() => {
    const fetchSupabaseData = async () => {
      try {
        const { data: dbSessions, error: sessError } = await supabase
          .from('support_sessions')
          .select('*')
          .neq('last_message', 'Session initiated')
          .order('last_message_at', { ascending: false });

        if (!sessError && dbSessions) {
          setSessions(dbSessions as SupportSession[]);
          if (dbSessions.length > 0) {
            setSelectedSessionId(dbSessions[0].id);

            // Fetch messages for the first session
            const { data: dbMessages } = await supabase
              .from('support_messages')
              .select('*')
              .eq('session_id', dbSessions[0].id)
              .order('created_at', { ascending: true });

            if (dbMessages) {
              setMessages(prev => ({
                ...prev,
                [dbSessions[0].id]: dbMessages as SupportMessage[]
              }));
            }
          } else {
            setSelectedSessionId(null);
          }
        }
      } catch (err) {
        console.warn('Error fetching support sessions:', err);
      }
    };

    fetchSupabaseData();

    // Supabase Realtime for Sessions & Messages
    const sessionChannel = supabase
      .channel('agent-sessions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_sessions' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          const newSess = payload.new as SupportSession;
          if (newSess.last_message === 'Session initiated') return;
          setSessions(prev => [newSess, ...prev.filter(s => s.id !== newSess.id)]);
          playAlert();
        } else if (payload.eventType === 'UPDATE') {
          const updatedSess = payload.new as SupportSession;
          setSessions(prev => prev.map(s => s.id === updatedSess.id ? updatedSess : s));
        } else if (payload.eventType === 'DELETE') {
          setSessions(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload: any) => {
        const newMsg = payload.new as SupportMessage;
        
        setMessages(prev => {
          const existingList = prev[newMsg.session_id] || [];
          if (existingList.some(m => m.id === newMsg.id)) {
            return prev;
          }
          if (newMsg.sender_type === 'agent') {
            const dupIndex = existingList.findIndex(
              m => m.sender_type === 'agent' && m.content === newMsg.content && Math.abs(new Date(m.created_at || '').getTime() - new Date(newMsg.created_at || '').getTime()) < 3000
            );
            if (dupIndex !== -1) {
              const copy = [...existingList];
              copy[dupIndex] = newMsg;
              return { ...prev, [newMsg.session_id]: copy };
            }
          }

          return {
            ...prev,
            [newMsg.session_id]: [...existingList, newMsg]
          };
        });

        if (newMsg.sender_type === 'user') {
          playAlert();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
    };
  }, []);

  // Fetch messages when switching session
  useEffect(() => {
    if (!selectedSessionId) return;

    const loadSessionMessages = async () => {
      if (messages[selectedSessionId] && messages[selectedSessionId].length > 0) return;

      const { data: dbMessages } = await supabase
        .from('support_messages')
        .select('*')
        .eq('session_id', selectedSessionId)
        .order('created_at', { ascending: true });

      if (dbMessages) {
        setMessages(prev => ({
          ...prev,
          [selectedSessionId]: dbMessages as SupportMessage[]
        }));
      }
    };

    loadSessionMessages();
  }, [selectedSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedSessionId]);

  const currentSession = selectedSessionId ? (sessions.find(s => s.id === selectedSessionId) || null) : null;
  const activeMessages = (currentSession ? messages[currentSession.id] : []) || [];

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const content = inputMessage.trim();
    if (!content || !currentSession) return;

    const msgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `agent-msg-${Date.now()}`;
    const newMsg: SupportMessage = {
      id: msgId,
      session_id: currentSession.id,
      sender_type: 'agent',
      sender_name: currentAgent.name,
      sender_avatar: currentAgent.avatar,
      content: isInternalNote ? `[INTERNAL NOTE]: ${content}` : content,
      created_at: new Date().toISOString(),
      is_internal_note: isInternalNote
    };

    // Auto-claim ticket if currently unassigned
    const isCurrentlyUnassigned = !currentSession.assigned_agent_name || currentSession.assigned_agent_name === 'Unassigned';
    const effectiveAgentName = isCurrentlyUnassigned ? currentAgent.name : currentSession.assigned_agent_name;
    const effectiveAgentAvatar = isCurrentlyUnassigned ? currentAgent.avatar : currentSession.assigned_agent_avatar;

    // Optimistic UI update
    setMessages(prev => ({
      ...prev,
      [currentSession.id]: [...(prev[currentSession.id] || []), newMsg]
    }));

    setInputMessage('');
    setIsInternalNote(false);
    setShowMacros(false);

    // Update session snippet & assignment
    setSessions(prev => prev.map(s => s.id === currentSession.id ? {
      ...s,
      assigned_agent_name: effectiveAgentName,
      assigned_agent_avatar: effectiveAgentAvatar,
      last_message: isInternalNote ? `[Note]: ${content}` : content,
      last_message_at: new Date().toISOString(),
      unread_agent_count: 0
    } : s));

    // Persist to Supabase with the same ID
    try {
      if (isCurrentlyUnassigned) {
        const joinMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sys-${Date.now()}`;
        await supabase.from('support_messages').insert({
          id: joinMsgId,
          session_id: currentSession.id,
          sender_type: 'system',
          sender_name: 'System',
          content: `👋 ${currentAgent.name} has joined the chat and is here to help you.`
        });
      }

      await supabase.from('support_messages').insert({
        id: msgId,
        session_id: currentSession.id,
        sender_type: 'agent',
        sender_name: currentAgent.name,
        sender_avatar: currentAgent.avatar,
        content: isInternalNote ? `[INTERNAL NOTE]: ${content}` : content,
        is_read: true
      });

      await supabase.from('support_sessions').update({
        assigned_agent_name: effectiveAgentName,
        assigned_agent_avatar: effectiveAgentAvatar,
        last_message: content,
        last_message_at: new Date().toISOString(),
        unread_agent_count: 0
      }).eq('id', currentSession.id);
    } catch (err) {
      console.warn('Sync error:', err);
    }
  };

  const handleClaimTicket = async () => {
    if (!currentSession) return;
    setSessions(prev => prev.map(s => s.id === currentSession.id ? {
      ...s,
      assigned_agent_name: currentAgent.name,
      assigned_agent_avatar: currentAgent.avatar
    } : s));

    try {
      await supabase.from('support_sessions').update({
        assigned_agent_name: currentAgent.name,
        assigned_agent_avatar: currentAgent.avatar
      }).eq('id', currentSession.id);

      const sysMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sys-${Date.now()}`;
      await supabase.from('support_messages').insert({
        id: sysMsgId,
        session_id: currentSession.id,
        sender_type: 'system',
        sender_name: 'System',
        content: `👋 ${currentAgent.name} has joined the chat and is here to help you.`
      });
    } catch {}
  };

  const handleReassignTicket = async (targetAgentName: string) => {
    if (!currentSession) return;
    const target = AGENT_TEAM.find(a => a.name === targetAgentName);
    const newAvatar = target ? target.avatar : undefined;

    setSessions(prev => prev.map(s => s.id === currentSession.id ? {
      ...s,
      assigned_agent_name: targetAgentName,
      assigned_agent_avatar: newAvatar
    } : s));

    try {
      await supabase.from('support_sessions').update({
        assigned_agent_name: targetAgentName,
        assigned_agent_avatar: newAvatar
      }).eq('id', currentSession.id);

      const sysMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sys-${Date.now()}`;
      await supabase.from('support_messages').insert({
        id: sysMsgId,
        session_id: currentSession.id,
        sender_type: 'system',
        sender_name: 'System',
        content: `Ticket #${currentSession.ticket_number} reassigned to ${targetAgentName} by ${currentAgent.name}.`
      });
    } catch {}
  };

  const handleSelectAgent = (agent: AgentProfile) => {
    setCurrentAgent(agent);
    setShowAgentPicker(false);
  };

  const handleApplyMacro = (macroContent: string) => {
    const formatted = macroContent.replace('{TICKET}', currentSession?.ticket_number || 'WIP-8942');
    setInputMessage(prev => prev ? `${prev}\n\n${formatted}` : formatted);
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'pending' | 'resolved' | 'closed') => {
    if (!currentSession) return;

    setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, status: newStatus } : s));

    try {
      await supabase
        .from('support_sessions')
        .update({ status: newStatus })
        .eq('id', currentSession.id);

      const sysMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sys-${Date.now()}`;
      await supabase.from('support_messages').insert({
        id: sysMsgId,
        session_id: currentSession.id,
        sender_type: 'system',
        sender_name: 'System',
        content: `Ticket #${currentSession.ticket_number} marked as ${newStatus.toUpperCase()} by ${currentAgent.name}.`
      });
    } catch (err) {
      console.warn('Status update error:', err);
    }
  };

  const filteredSessions = sessions.filter(sess => {
    const matchesSearch = 
      sess.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sess.user_email && sess.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sess.last_message && sess.last_message.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'resolved') {
      if (sess.status !== 'resolved' && sess.status !== 'closed') return false;
    } else if (statusFilter !== 'all' && sess.status !== statusFilter) {
      return false;
    }

    // Assignment filter
    if (assignmentFilter === 'mine') {
      return sess.assigned_agent_name === currentAgent.name;
    }
    if (assignmentFilter === 'unassigned') {
      return !sess.assigned_agent_name || sess.assigned_agent_name === 'Unassigned';
    }

    return true;
  });

  const activeCount = sessions.filter(s => s.status === 'active').length;
  const pendingCount = sessions.filter(s => s.status === 'pending').length;
  const resolvedCount = sessions.filter(s => s.status === 'resolved' || s.status === 'closed').length;
  const myTicketsCount = sessions.filter(s => s.assigned_agent_name === currentAgent.name && s.status !== 'resolved' && s.status !== 'closed').length;
  const unassignedCount = sessions.filter(s => (!s.assigned_agent_name || s.assigned_agent_name === 'Unassigned') && s.status !== 'resolved' && s.status !== 'closed').length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafc] text-slate-900 select-none font-sans">
      
      {/* 1. TOP GLOBAL COMMAND BAR (WHITE MODE) */}
      <header className="shrink-0 h-16 border-b border-slate-200/90 bg-white/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 shadow-2xs">
        
        {/* Left branding & Domain Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5a32fa] via-[#7c3aed] to-[#ff2a5f] p-0.5 shadow-md shadow-purple-500/20">
            <div className="h-full w-full rounded-[10px] bg-white flex items-center justify-center">
              <Headphones size={18} className="text-[#5a32fa]" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 tracking-tight">
                WIPA Support Global Console
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Lock size={10} />
                supportglobal.womensipalliance.com
              </span>
            </div>
            <p className="text-[11px] text-slate-500 truncate flex items-center gap-2">
              <span>Agent Workspace v2.4</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#5a32fa] font-medium">Live WebSockets Active</span>
            </p>
          </div>
        </div>

        {/* Center KPI Stats Bar (Desktop) */}
        <div className="hidden xl:flex items-center gap-6 px-4 py-1.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Queue:</span>
            <span className="font-bold text-[#5a32fa] px-2 py-0.5 rounded-md bg-purple-100 font-mono">
              {activeCount} active
            </span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Avg First Response:</span>
            <span className="font-bold text-emerald-600 font-mono">38s</span>
          </div>
          <div className="h-3 w-[1px] bg-slate-200" />
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Today Resolution:</span>
            <span className="font-bold text-slate-800 font-mono">98.6%</span>
          </div>
        </div>

        {/* Right Agent Controls */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute notification chimes' : 'Unmute notification chimes'}
          >
            {soundEnabled ? <Volume2 size={17} className="text-[#5a32fa]" /> : <VolumeX size={17} />}
          </button>

          {/* Agent Switcher & Status Profile */}
          <div className="relative">
            <div 
              onClick={() => setShowAgentPicker(!showAgentPicker)}
              className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-all shadow-2xs"
              title="Click to switch active agent account"
            >
              <div className="relative">
                <img 
                  src={currentAgent.avatar} 
                  alt={currentAgent.name} 
                  className="h-7 w-7 rounded-lg object-cover ring-1 ring-purple-300" 
                />
                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white ${
                  agentStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                  agentStatus === 'busy' ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
              </div>

              <div className="hidden sm:block text-left min-w-0 pr-1">
                <div className="flex items-center gap-1">
                  <p className="text-xs font-bold text-slate-900 leading-none truncate">{currentAgent.name}</p>
                  <ChevronDown size={12} className="text-slate-400" />
                </div>
                <p className="text-[10px] font-semibold text-[#5a32fa] truncate">{currentAgent.role.split(' ')[0]} Specialist</p>
              </div>
            </div>

            {/* Agent Switcher Dropdown Modal */}
            {showAgentPicker && (
              <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl bg-white border border-slate-200 p-3 shadow-2xl space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Users size={13} className="text-[#5a32fa]" /> Support Team Roster
                  </span>
                  <span className="text-[10px] text-slate-400">Switch Agent</span>
                </div>

                <div className="space-y-1">
                  {AGENT_TEAM.map((agent) => {
                    const isCurrent = agent.id === currentAgent.id || agent.name === currentAgent.name;
                    return (
                      <div
                        key={agent.id}
                        onClick={() => handleSelectAgent(agent)}
                        className={`flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                          isCurrent ? 'bg-purple-50 border border-purple-300' : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <img src={agent.avatar} alt={agent.name} className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 flex items-center justify-between">
                            <span>{agent.name}</span>
                            {isCurrent && <span className="text-[9px] text-[#5a32fa] font-bold bg-purple-100 px-1.5 py-0.5 rounded">Active</span>}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{agent.role}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Status:</span>
                  <select
                    value={agentStatus}
                    onChange={(e) => setAgentStatus(e.target.value as any)}
                    className="bg-slate-100 text-slate-800 rounded-lg px-2 py-1 text-xs border border-slate-200 focus:outline-hidden cursor-pointer"
                  >
                    <option value="online">● Online</option>
                    <option value="busy">● In Call / Busy</option>
                    <option value="away">● Away</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Log Out Button */}
          <button
            type="button"
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors cursor-pointer"
            title="Log out of agent console"
          >
            <LogOut size={16} />
          </button>

          {/* Mobile Right Drawer Button */}
          <button
            type="button"
            onClick={() => setShowRightDrawerMobile(!showRightDrawerMobile)}
            className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200"
          >
            <User size={17} />
          </button>
        </div>
      </header>

      {/* 2. THREE-COLUMN CONSOLE WORKSPACE (WHITE MODE) */}
      <div className="flex-1 flex w-full h-[calc(100vh-64px)] min-h-0 overflow-hidden relative">
        
        {/* LEFT COLUMN: Ticket Queue & Sessions List */}
        <aside className="w-80 xl:w-88 shrink-0 h-full flex flex-col border-r border-slate-200/90 bg-white z-20">
          
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-slate-200/80 space-y-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, member or issue..."
                className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-[#5a32fa] focus:bg-white transition-all"
              />
            </div>

            {/* Assignment Filter Pills */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 text-[10px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setAssignmentFilter('all')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  assignmentFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setAssignmentFilter('mine')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  assignmentFilter === 'mine' ? 'bg-[#5a32fa] text-white shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                My Chats ({myTicketsCount})
              </button>
              <button
                type="button"
                onClick={() => setAssignmentFilter('unassigned')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  assignmentFilter === 'unassigned' ? 'bg-amber-100 text-amber-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Unassigned ({unassignedCount})
              </button>
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-slate-100 text-[11px] font-bold text-slate-600">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  statusFilter === 'active' ? 'bg-[#5a32fa] text-white shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-purple-100 text-purple-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resolved')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  statusFilter === 'resolved' ? 'bg-emerald-100 text-emerald-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                Done ({resolvedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Sessions Queue List */}
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-400 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No tickets in this view</p>
                <p className="text-[10px] text-slate-400">All incoming member chats will stream here live.</p>
              </div>
            ) : (
              filteredSessions.map((sess) => {
                const isSelected = sess.id === currentSession?.id;

                return (
                  <div
                    key={sess.id}
                    onClick={() => setSelectedSessionId(sess.id)}
                    className={`p-3.5 transition-all cursor-pointer relative group ${
                      isSelected 
                        ? 'bg-purple-50/80 border-l-4 border-[#5a32fa]' 
                        : 'hover:bg-slate-50 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          {sess.user_avatar ? (
                            <img src={sess.user_avatar} alt={sess.user_name} className="h-8 w-8 rounded-xl object-cover ring-1 ring-slate-200" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-100 text-[#5a32fa] font-bold text-xs">
                              {sess.user_name.charAt(0)}
                            </div>
                          )}
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${
                            sess.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                          }`} />
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#5a32fa]' : 'text-slate-900'}`}>
                            {sess.user_name}
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 truncate">
                            {sess.user_tier || 'Member'}
                          </p>
                        </div>
                      </div>

                      {/* Ticket Badge & Priority */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-[10px] font-bold text-[#5a32fa]">
                          #{sess.ticket_number}
                        </span>
                        {sess.priority === 'high' || sess.priority === 'urgent' ? (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                            High SLA
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Last message preview */}
                    <p className="text-[11px] text-slate-600 line-clamp-1 mb-1.5 pl-10">
                      {sess.last_message || 'New session initiated...'}
                    </p>

                    {/* Meta footer with Assignment Badge */}
                    <div className="flex items-center justify-between pl-10 text-[10px]">
                      <div>
                        {!sess.assigned_agent_name || sess.assigned_agent_name === 'Unassigned' ? (
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Unassigned
                          </span>
                        ) : sess.assigned_agent_name === currentAgent.name ? (
                          <span className="text-[9px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-1.5 py-0.5 rounded">
                            You
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium text-slate-700 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">
                            {sess.assigned_agent_name.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      <span className="text-slate-400">
                        {sess.last_message_at 
                          ? formatMessageTime(sess.last_message_at) 
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* CENTER COLUMN: Live Agent Chat Workspace (WHITE MODE) */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-[#f8fafc] relative">
          
          {currentSession ? (
            <>
              {/* Active Ticket Banner */}
              <div className="shrink-0 border-b border-slate-200/90 bg-white px-6 py-3.5 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-slate-900 truncate">
                        {currentSession.user_name}
                      </h2>
                      <span className="font-mono text-xs font-bold text-[#5a32fa] bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                        #{currentSession.ticket_number}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        currentSession.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        currentSession.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {currentSession.status}
                      </span>
                    </div>

                    {/* Assignment Status & Quick Transfer */}
                    <div className="flex items-center gap-2 mt-1">
                      {!currentSession.assigned_agent_name || currentSession.assigned_agent_name === 'Unassigned' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Unassigned Ticket
                          </span>
                          <button
                            type="button"
                            onClick={handleClaimTicket}
                            className="px-2.5 py-0.5 rounded-md text-[11px] font-bold text-white bg-gradient-to-r from-[#5a32fa] to-[#7c3aed] hover:from-[#4b26dc] hover:to-[#6d28d9] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                          >
                            <UserPlus size={11} />
                            <span>Claim Ticket</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500">Assigned:</span>
                          <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                            {currentSession.assigned_agent_name === currentAgent.name ? (
                              <span className="text-[#5a32fa]">You ({currentAgent.name})</span>
                            ) : (
                              currentSession.assigned_agent_name
                            )}
                          </span>
                          
                          {/* Reassign dropdown */}
                          <div className="relative ml-2">
                            <select
                              value={currentSession.assigned_agent_name}
                              onChange={(e) => handleReassignTicket(e.target.value)}
                              className="bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg px-2 py-0.5 text-[10px] font-bold text-[#5a32fa] cursor-pointer focus:outline-hidden"
                            >
                              <option disabled value="">Transfer to...</option>
                              {AGENT_TEAM.map(a => (
                                <option key={a.id} value={a.name}>
                                  Assign to {a.name}
                                </option>
                              ))}
                              <option value="Unassigned">Mark Unassigned</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Session Resolution & Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {currentSession.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('resolved')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('active')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-300 flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                    >
                      <RefreshCw size={13} />
                      <span>Reopen Ticket</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`https://supportglobal.womensipalliance.com/tickets/${currentSession.ticket_number}`);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                    title="Copy direct ticket URL"
                  >
                    {copySuccess ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar bg-[#fbfcfe]">
                
                {/* Security context alert */}
                <div className="max-w-md mx-auto text-center">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-2xs">
                    <ShieldCheck size={12} className="text-emerald-600" />
                    Encrypted Member Live Chat Stream • Ticket #{currentSession.ticket_number}
                  </span>
                </div>

                {activeMessages.map((msg) => {
                  if (msg.sender_type === 'system') {
                    return (
                      <div key={msg.id} className="text-center my-3">
                        <span className="text-[11px] font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                          {msg.content}
                        </span>
                      </div>
                    );
                  }

                  const isAgent = msg.sender_type === 'agent';
                  const isWhisper = msg.is_internal_note;

                  return (
                    <div 
                      key={msg.id}
                      className={`flex items-start gap-3 ${isAgent ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      {/* Avatar */}
                      <div className="shrink-0 mt-0.5">
                        <img 
                          src={msg.sender_avatar || (isAgent 
                            ? currentAgent.avatar
                            : currentSession.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'
                          )} 
                          alt={msg.sender_name} 
                          className="h-8 w-8 rounded-xl object-cover ring-1 ring-slate-200 shadow-2xs" 
                        />
                      </div>

                      {/* Message Bubble */}
                      <div className={`max-w-[80%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-xs font-bold text-slate-800">
                            {msg.sender_name}
                          </span>
                          {isWhisper && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                              Internal Staff Whisper
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400">{formatMessageTime(msg.created_at)}</span>
                        </div>

                        <div className={`rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed shadow-xs whitespace-pre-line ${
                          isWhisper 
                            ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tr-xs' 
                            : isAgent 
                            ? 'bg-gradient-to-r from-[#5a32fa] to-[#7c3aed] text-white rounded-tr-xs shadow-purple-500/10' 
                            : 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs shadow-2xs'
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              {/* Composer Toolbar & Textarea */}
              <div className="shrink-0 border-t border-slate-200/90 bg-white p-4">
                
                {/* Canned Macros Menu Drawer */}
                {showMacros && (
                  <div className="mb-3 rounded-2xl bg-slate-50 border border-purple-200 p-3 shadow-xl space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-xs font-bold text-[#5a32fa] flex items-center gap-1.5">
                        <Sparkles size={13} /> Quick Response Macros
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowMacros(false)} 
                        className="text-slate-400 hover:text-slate-700"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {CANNED_RESPONSES.map((macro) => (
                        <button
                          key={macro.id}
                          type="button"
                          onClick={() => handleApplyMacro(macro.content)}
                          className="text-left p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-xs text-slate-800 transition-all cursor-pointer shadow-2xs"
                        >
                          <p className="font-bold mb-1 text-slate-900">{macro.label}</p>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{macro.content}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode Selector (Reply vs Internal Note) & Quick Actions */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(false)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        !isInternalNote 
                          ? 'bg-[#5a32fa] text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      Reply to Member
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsInternalNote(true)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isInternalNote 
                          ? 'bg-amber-600 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900 bg-slate-100'
                      }`}
                    >
                      <StickyNote size={12} /> Internal Note
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMacros(!showMacros)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-[#5a32fa] border border-slate-200 transition-all cursor-pointer"
                  >
                    <Sparkles size={12} />
                    <span>Insert Macro</span>
                  </button>
                </div>

                {/* Form Input */}
                <form onSubmit={handleSendMessage} className="space-y-2">
                  <div className="relative">
                    <textarea
                      ref={composerRef}
                      rows={3}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={isInternalNote 
                        ? 'Type private internal note for other agents... (Will NOT be seen by member)' 
                        : `Reply to ${currentSession.user_name}... (Press Enter to send, Shift+Enter for new line)`}
                      className={`w-full rounded-2xl p-3 text-xs sm:text-[13px] placeholder-slate-400 focus:outline-hidden resize-none transition-all ${
                        isInternalNote
                          ? 'bg-amber-50/70 border border-amber-300 text-amber-950 focus:border-amber-500'
                          : 'bg-slate-50 border border-slate-200 text-slate-900 focus:bg-white focus:border-[#5a32fa] focus:ring-2 focus:ring-[#5a32fa]/10'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px]">Enter ↵</kbd>
                    </span>

                    <button
                      type="submit"
                      disabled={!inputMessage.trim()}
                      className="px-4 py-2 rounded-xl font-bold text-xs sm:text-[13px] text-white bg-gradient-to-r from-[#5a32fa] to-[#7c3aed] hover:from-[#4b26dc] hover:to-[#6d28d9] shadow-md shadow-purple-500/25 disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{isInternalNote ? 'Save Note' : 'Send Reply'}</span>
                      <Send size={13} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4">
              <div className="h-16 w-16 rounded-3xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-xs">
                <Headphones size={28} className="text-[#5a32fa]" />
              </div>
              <div className="max-w-sm space-y-1">
                <h3 className="text-base font-bold text-slate-900">Support Queue Standby</h3>
                <p className="text-xs text-slate-500">
                  No ticket selected. Pick an incoming ticket from the left sidebar to start live chatting with members.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT COLUMN: Member Profile Dossier & Intelligence (WHITE MODE) */}
        <aside className={`
          ${showRightDrawerMobile ? 'fixed inset-y-0 right-0 z-50 flex' : 'hidden'}
          lg:flex w-80 shrink-0 h-full flex-col border-l border-slate-200/90 bg-white overflow-y-auto no-scrollbar
        `}>
          {currentSession ? (
            <div className="p-4 space-y-4">
              
              {/* Member Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-center space-y-2">
                <div className="relative inline-block">
                  <img 
                    src={currentSession.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'} 
                    alt={currentSession.user_name}
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-purple-300 mx-auto"
                  />
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{currentSession.user_name}</h3>
                  <p className="text-xs font-semibold text-[#5a32fa]">{currentSession.user_tier || 'Verified Member'}</p>
                  <p className="text-[11px] text-slate-500">{currentSession.user_email || 'No email registered'}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-left text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Practice Area</span>
                    <span className="font-semibold text-slate-700">Patent Prosecution</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Location</span>
                    <span className="font-semibold text-slate-700">London, UK</span>
                  </div>
                </div>
              </div>

              {/* Ticket Meta Details */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2 text-xs">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ticket Attributes
                </p>
                <div className="space-y-1.5">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Session ID</span>
                    <span className="font-mono font-bold text-[#5a32fa]">#{currentSession.ticket_number}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Priority</span>
                    <span className="font-bold text-rose-600 uppercase text-[11px]">{currentSession.priority}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">Assigned Agent</span>
                    <span className="font-semibold text-slate-900">{currentSession.assigned_agent_name || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Origin Domain</span>
                    <span className="font-mono text-[10px] text-slate-600 truncate max-w-[120px]">
                      supportglobal...
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions / One-Click Knowledge Insert */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Knowledge Insert
                </p>
                <div className="space-y-1.5">
                  {CANNED_RESPONSES.slice(0, 3).map((macro) => (
                    <button
                      key={macro.id}
                      type="button"
                      onClick={() => handleApplyMacro(macro.content)}
                      className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-xs text-slate-700 transition-all cursor-pointer shadow-2xs group"
                    >
                      <p className="font-bold text-slate-900 group-hover:text-[#5a32fa] transition-colors">{macro.label}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <ArrowRight size={10} /> Insert into response
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 text-xs space-y-2">
              <User size={24} className="mx-auto text-slate-300" />
              <p>Select a session to review member profile and practice credentials.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
