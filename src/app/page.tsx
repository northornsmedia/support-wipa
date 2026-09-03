'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Headphones, 
  Send, 
  Paperclip, 
  Sparkles, 
  CheckCheck, 
  Clock, 
  Phone, 
  Mail, 
  HelpCircle, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  RefreshCw, 
  X, 
  Check, 
  Copy, 
  Volume2, 
  VolumeX, 
  ShieldCheck, 
  User, 
  MessageSquare, 
  ArrowRight,
  Info,
  Calendar,
  CreditCard,
  GraduationCap,
  Building2,
  Bug,
  Smile,
  FileText,
  AlertCircle,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Globe,
  Radio,
  BarChart3,
  Flame,
  Zap,
  Tag,
  CornerDownRight,
  StickyNote,
  MoreVertical,
  SlidersHorizontal,
  ChevronLeft,
  CircleDot,
  UserCheck,
  Hash
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

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

    // Supabase Realtime subscriptions for support_sessions and support_messages
    const channel = supabase.channel('support-agent-global')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_sessions' }, (payload: any) => {
        const item = payload.new as SupportSession;
        if (item && item.last_message === 'Session initiated') return;

        if (payload.eventType === 'INSERT') {
          setSessions(prev => [item, ...prev.filter(s => s.id !== item.id)]);
          setSelectedSessionId(prev => prev || item.id);
          playAlert();
        } else if (payload.eventType === 'UPDATE') {
          setSessions(prev => {
            const exists = prev.some(s => s.id === item.id);
            if (exists) {
              return prev.map(s => s.id === item.id ? { ...s, ...item } : s);
            }
            return [item, ...prev];
          });
        } else if (payload.eventType === 'DELETE') {
          setSessions(prev => prev.filter(s => s.id !== payload.old.id));
        }
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, (payload: any) => {
        const newMsg = payload.new as SupportMessage;
        setMessages(prev => {
          const list = prev[newMsg.session_id] || [];
          // Deduplicate by ID
          if (list.some(m => m.id === newMsg.id)) return prev;

          // Deduplicate by sender and content in case optimistic update had a temporary client ID
          const optIdx = list.findIndex(m => 
            m.sender_type === newMsg.sender_type && 
            m.content === newMsg.content
          );

          if (optIdx !== -1) {
            const updated = [...list];
            updated[optIdx] = newMsg;
            return {
              ...prev,
              [newMsg.session_id]: updated
            };
          }

          return {
            ...prev,
            [newMsg.session_id]: [...list, newMsg]
          };
        });

        if (newMsg.sender_type === 'user') {
          playAlert();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch messages when changing selected session
  useEffect(() => {
    if (!selectedSessionId) return;
    const loadSessionMessages = async () => {
      try {
        const { data: dbMessages } = await supabase
          .from('support_messages')
          .select('*')
          .eq('session_id', selectedSessionId)
          .order('created_at', { ascending: true });

        if (dbMessages && dbMessages.length > 0) {
          setMessages(prev => ({
            ...prev,
            [selectedSessionId]: dbMessages as SupportMessage[]
          }));
        }
      } catch (e) {}
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
      sender_name: 'Sarah Jenkins',
      sender_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop',
      content: isInternalNote ? `[INTERNAL NOTE]: ${content}` : content,
      created_at: new Date().toISOString(),
      is_internal_note: isInternalNote
    };

    // Optimistic UI update
    setMessages(prev => ({
      ...prev,
      [currentSession.id]: [...(prev[currentSession.id] || []), newMsg]
    }));

    setInputMessage('');
    setIsInternalNote(false);
    setShowMacros(false);

    // Update session snippet
    setSessions(prev => prev.map(s => s.id === currentSession.id ? {
      ...s,
      last_message: isInternalNote ? `[Note]: ${content}` : content,
      last_message_at: new Date().toISOString(),
      unread_agent_count: 0
    } : s));

    // Persist to Supabase with the same ID
    try {
      await supabase.from('support_messages').insert({
        id: msgId,
        session_id: currentSession.id,
        sender_type: 'agent',
        sender_name: 'Sarah Jenkins',
        sender_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop',
        content: isInternalNote ? `[INTERNAL NOTE]: ${content}` : content,
        is_read: true
      });

      await supabase.from('support_sessions').update({
        last_message: content,
        last_message_at: new Date().toISOString(),
        unread_agent_count: 0
      }).eq('id', currentSession.id);
    } catch (err) {
      console.warn('Sync error:', err);
    }
  };

  const handleApplyMacro = (macroContent: string) => {
    const formatted = macroContent.replace('{TICKET}', currentSession?.ticket_number || 'WIP-8942');
    setInputMessage(prev => prev ? `${prev}\n\n${formatted}` : formatted);
    setShowMacros(false);
    composerRef.current?.focus();
  };

  const handleUpdateStatus = async (newStatus: 'active' | 'pending' | 'resolved' | 'closed') => {
    if (!currentSession) return;
    setSessions(prev => prev.map(s => s.id === currentSession.id ? { ...s, status: newStatus } : s));
    
    // Add system notification message
    const sysMsg: SupportMessage = {
      id: `sys-${Date.now()}`,
      session_id: currentSession.id,
      sender_type: 'system',
      sender_name: 'System',
      content: `Ticket status updated to: ${newStatus.toUpperCase()} by Sarah Jenkins.`,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => ({
      ...prev,
      [currentSession.id]: [...(prev[currentSession.id] || []), sysMsg]
    }));

    try {
      await supabase.from('support_sessions').update({ status: newStatus }).eq('id', currentSession.id);
      await supabase.from('support_messages').insert({
        session_id: currentSession.id,
        sender_type: 'system',
        sender_name: 'System',
        content: `Ticket status updated to: ${newStatus.toUpperCase()}`
      });
    } catch {}
  };

  const filteredSessions = sessions.filter(sess => {
    const matchesSearch = 
      sess.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sess.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sess.user_email && sess.user_email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sess.last_message && sess.last_message.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return sess.status === statusFilter;
  });

  const activeCount = sessions.filter(s => s.status === 'active').length;
  const pendingCount = sessions.filter(s => s.status === 'pending').length;
  const resolvedCount = sessions.filter(s => s.status === 'resolved').length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070913] text-slate-100 select-none">
      
      {/* 1. TOP GLOBAL COMMAND BAR */}
      <header className="shrink-0 h-16 border-b border-white/10 bg-[#0c1020]/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-30 shadow-xs">
        
        {/* Left branding & Domain Context */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#5a32fa] via-[#7c3aed] to-[#ff2a5f] p-0.5 shadow-md shadow-purple-500/25">
            <div className="h-full w-full rounded-[10px] bg-[#0c1020] flex items-center justify-center text-white">
              <Headphones size={18} className="text-purple-400" />
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white tracking-tight">
                WIPA Support Global Console
              </span>
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60">
                <Lock size={10} />
                supportglobal.womensipalliance.com
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-2">
              <span>Agent Workspace v2.4</span>
              <span className="text-slate-600">•</span>
              <span className="text-purple-400">Live WebSockets Active</span>
            </p>
          </div>
        </div>

        {/* Center KPI Stats Bar (Desktop) */}
        <div className="hidden xl:flex items-center gap-6 px-4 py-1.5 rounded-2xl bg-white/5 border border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Queue:</span>
            <span className="font-bold text-white px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 font-mono">
              {activeCount} active
            </span>
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Avg First Response:</span>
            <span className="font-bold text-emerald-400 font-mono">38s</span>
          </div>
          <div className="h-3 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Today Resolution:</span>
            <span className="font-bold text-white font-mono">98.6%</span>
          </div>
        </div>

        {/* Right Agent Controls */}
        <div className="flex items-center gap-3 shrink-0">
          
          {/* Sound Mute Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute notification chimes' : 'Unmute notification chimes'}
          >
            {soundEnabled ? <Volume2 size={17} className="text-purple-400" /> : <VolumeX size={17} />}
          </button>

          {/* Agent Status Selector */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white/5 border border-white/10">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop" 
                alt="Sarah Jenkins" 
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-purple-400" 
              />
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[#0c1020] ${
                agentStatus === 'online' ? 'bg-emerald-500 animate-pulse' :
                agentStatus === 'busy' ? 'bg-rose-500' : 'bg-amber-500'
              }`} />
            </div>

            <div className="hidden sm:block text-left min-w-0 pr-1">
              <p className="text-xs font-bold text-white leading-none truncate">Sarah Jenkins</p>
              <select
                value={agentStatus}
                onChange={(e) => setAgentStatus(e.target.value as any)}
                className="bg-transparent text-[10px] font-semibold text-purple-400 focus:outline-hidden cursor-pointer"
              >
                <option value="online" className="bg-slate-900 text-emerald-400">● Online</option>
                <option value="busy" className="bg-slate-900 text-rose-400">● In Call / Busy</option>
                <option value="away" className="bg-slate-900 text-amber-400">● Away</option>
              </select>
            </div>
          </div>

          {/* Mobile Right Drawer Button */}
          <button
            type="button"
            onClick={() => setShowRightDrawerMobile(!showRightDrawerMobile)}
            className="lg:hidden p-2 rounded-xl bg-white/5 text-slate-300 border border-white/10"
          >
            <User size={17} />
          </button>
        </div>
      </header>

      {/* 2. THREE-COLUMN CONSOLE WORKSPACE */}
      <div className="flex-1 flex w-full h-[calc(100vh-64px)] min-h-0 overflow-hidden relative">
        
        {/* LEFT COLUMN: Ticket Queue & Sessions List */}
        <aside className="w-80 xl:w-88 shrink-0 h-full flex flex-col border-r border-white/10 bg-[#090d1a] z-20">
          
          {/* Search & Filter Header */}
          <div className="p-3.5 border-b border-white/10 space-y-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, member or issue..."
                className="w-full rounded-xl bg-white/5 border border-white/10 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-purple-500 transition-all"
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-white/5 text-[11px] font-bold text-slate-400">
              <button
                type="button"
                onClick={() => setStatusFilter('active')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  statusFilter === 'active' ? 'bg-[#5a32fa] text-white shadow-xs' : 'hover:text-white'
                }`}
              >
                Active ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  statusFilter === 'pending' ? 'bg-purple-900/60 text-purple-300 shadow-xs' : 'hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('resolved')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  statusFilter === 'resolved' ? 'bg-emerald-950 text-emerald-300 shadow-xs' : 'hover:text-white'
                }`}
              >
                Done ({resolvedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                  statusFilter === 'all' ? 'bg-white/10 text-white' : 'hover:text-white'
                }`}
              >
                All
              </button>
            </div>
          </div>

          {/* Sessions Queue List */}
          <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-white/5">
            {filteredSessions.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-500 space-y-2">
                <CheckCircle2 size={32} className="mx-auto text-slate-600 opacity-60" />
                <p className="text-xs font-semibold">No tickets in this view</p>
                <p className="text-[10px] text-slate-600">All incoming member chats will stream here live.</p>
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
                        ? 'bg-gradient-to-r from-purple-950/70 via-purple-900/30 to-transparent border-l-3 border-[#5a32fa]' 
                        : 'hover:bg-white/5 border-l-3 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="relative shrink-0">
                          {sess.user_avatar ? (
                            <img src={sess.user_avatar} alt={sess.user_name} className="h-8 w-8 rounded-xl object-cover ring-1 ring-white/10" />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-900/50 text-purple-300 font-bold text-xs">
                              {sess.user_name.charAt(0)}
                            </div>
                          )}
                          <span className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ${
                            sess.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'
                          }`} />
                        </div>

                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {sess.user_name}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 truncate">
                            {sess.user_tier || 'Member'}
                          </p>
                        </div>
                      </div>

                      {/* Ticket Badge & Priority */}
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-mono text-[10px] font-bold text-[#5a32fa] dark:text-purple-300">
                          #{sess.ticket_number}
                        </span>
                        {sess.priority === 'high' || sess.priority === 'urgent' ? (
                          <span className="text-[9px] font-bold text-rose-400 bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-800/40">
                            High SLA
                          </span>
                        ) : null}
                      </div>
                    </div>

                    {/* Last message preview */}
                    <p className="text-[11px] text-slate-400 line-clamp-1 mb-1.5 pl-10">
                      {sess.last_message || 'New session initiated...'}
                    </p>

                    {/* Meta footer */}
                    <div className="flex items-center justify-between pl-10 text-[10px] text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-purple-400/90">
                        <Tag size={10} /> {sess.category || 'General'}
                      </span>
                      <span>
                        {sess.last_message_at 
                          ? new Date(sess.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                          : 'Just now'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* CENTER COLUMN: Live Agent Chat Workspace */}
        <main className="flex-1 flex flex-col h-full min-w-0 bg-[#070913] relative">
          
          {currentSession ? (
            <>
              {/* Active Ticket Banner */}
              <div className="shrink-0 border-b border-white/10 bg-[#0c1020]/90 px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-bold text-white truncate">
                        {currentSession.user_name}
                      </h2>
                      <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-800/40">
                        #{currentSession.ticket_number}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        currentSession.status === 'active' ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40' :
                        currentSession.status === 'pending' ? 'bg-amber-950/60 text-amber-400 border-amber-800/40' :
                        'bg-slate-800 text-slate-300 border-white/10'
                      }`}>
                        {currentSession.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate flex items-center gap-2">
                      <span>{currentSession.user_email || 'Member on Web'}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-emerald-400">Response target: &lt; 2m</span>
                    </p>
                  </div>
                </div>

                {/* Session Resolution & Action Controls */}
                <div className="flex items-center gap-2 shrink-0">
                  {currentSession.status !== 'resolved' ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('resolved')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-800/50 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                    >
                      <CheckCircle2 size={13} />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus('active')}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/50 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
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
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title="Copy direct ticket URL"
                  >
                    {copySuccess ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 no-scrollbar">
                
                {/* Security context alert */}
                <div className="max-w-md mx-auto text-center">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                    <ShieldCheck size={12} className="text-emerald-400" />
                    Encrypted Member Live Chat Stream • Ticket #{currentSession.ticket_number}
                  </span>
                </div>

                {activeMessages.map((msg) => {
                  if (msg.sender_type === 'system') {
                    return (
                      <div key={msg.id} className="text-center my-3">
                        <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
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
                            ? 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop'
                            : currentSession.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'
                          )} 
                          alt={msg.sender_name} 
                          className="h-8 w-8 rounded-xl object-cover ring-1 ring-white/10" 
                        />
                      </div>

                      {/* Message Bubble */}
                      <div className={`max-w-[80%] flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 mb-1 px-1">
                          <span className="text-xs font-bold text-slate-200">
                            {msg.sender_name}
                          </span>
                          {isWhisper && (
                            <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60">
                              Internal Staff Whisper
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">{formatMessageTime(msg.created_at)}</span>
                        </div>

                        <div className={`rounded-2xl px-4 py-3 text-xs sm:text-[13px] leading-relaxed shadow-xs whitespace-pre-line ${
                          isWhisper 
                            ? 'bg-amber-950/60 border border-amber-600/50 text-amber-100 rounded-tr-xs' 
                            : isAgent 
                            ? 'bg-gradient-to-r from-[#5a32fa] to-[#7c3aed] text-white rounded-tr-xs shadow-purple-500/10' 
                            : 'bg-white/10 text-slate-100 border border-white/10 rounded-tl-xs'
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
              <div className="shrink-0 border-t border-white/10 bg-[#0c1020]/95 backdrop-blur-xl p-4">
                
                {/* Canned Macros Menu Drawer */}
                {showMacros && (
                  <div className="mb-3 rounded-2xl bg-[#090d1a] border border-purple-500/30 p-3 shadow-xl space-y-2 max-h-56 overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between pb-1 border-b border-white/10">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <Sparkles size={13} /> Quick Response Macros
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setShowMacros(false)} 
                        className="text-slate-400 hover:text-white"
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
                          className="text-left p-2.5 rounded-xl bg-white/5 hover:bg-purple-950/60 border border-white/5 hover:border-purple-500/40 text-xs text-slate-200 hover:text-white transition-all cursor-pointer"
                        >
                          <p className="font-bold mb-1">{macro.label}</p>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{macro.content}</p>
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
                          : 'text-slate-400 hover:text-white bg-white/5'
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
                          : 'text-slate-400 hover:text-white bg-white/5'
                      }`}
                    >
                      <StickyNote size={12} /> Internal Note
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowMacros(!showMacros)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/5 hover:bg-white/10 text-purple-300 border border-purple-500/20 transition-all cursor-pointer"
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
                        ? 'Type an internal team note (only visible to support agents)...' 
                        : `Reply to ${currentSession.user_name}... (Press Enter to send, Shift+Enter for new line)`
                      }
                      className={`w-full rounded-2xl p-3 text-xs sm:text-[13px] text-white placeholder-slate-500 focus:outline-hidden transition-all resize-none border ${
                        isInternalNote 
                          ? 'bg-amber-950/20 border-amber-600/40 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30' 
                          : 'bg-white/5 border-white/10 focus:border-[#5a32fa] focus:ring-2 focus:ring-[#5a32fa]/20'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono text-[10px]">Enter ↵</kbd></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        disabled={!inputMessage.trim()}
                        className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer flex items-center gap-1.5 ${
                          isInternalNote 
                            ? 'bg-amber-600 hover:bg-amber-500' 
                            : 'bg-gradient-to-r from-[#5a32fa] to-[#7c3aed] hover:from-[#4b26dc] hover:to-[#6d28d9] shadow-purple-500/25'
                        }`}
                      >
                        <span>{isInternalNote ? 'Save Note' : 'Send Reply'}</span>
                        <Send size={13} />
                      </button>
                    </div>
                  </div>
                </form>

              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 space-y-4 p-8 text-center">
              <div className="relative">
                <div className="h-16 w-16 rounded-3xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-500/10">
                  <Radio size={32} className="animate-pulse text-[#5a32fa] dark:text-purple-400" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="text-base font-bold text-white">Agent Standby • Ready for Chats</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Listening for incoming member support messages. As soon as a user sends their first message in live chat, it will appear in the queue on the left.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-emerald-400 font-mono">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Realtime WebSocket: Connected (24/7)
              </div>
            </div>
          )}

        </main>

        {/* RIGHT COLUMN: Customer Dossier & Knowledge Base (Desktop always, Mobile Drawer) */}
        <aside className={`
          ${showRightDrawerMobile ? 'fixed inset-0 z-50 flex flex-col bg-[#0c1020] p-6' : 'hidden'}
          lg:flex lg:static lg:w-80 xl:w-88 shrink-0 h-full flex-col border-l border-white/10 bg-[#090d1a] overflow-y-auto no-scrollbar
        `}>
          {/* Mobile close */}
          <div className="lg:hidden flex items-center justify-between pb-3 border-b border-white/10 mb-4">
            <h3 className="text-sm font-bold text-white">Member Dossier</h3>
            <button 
              type="button" 
              onClick={() => setShowRightDrawerMobile(false)}
              className="p-1 rounded-lg hover:bg-white/10"
            >
              <X size={16} />
            </button>
          </div>

          {currentSession ? (
            <div className="p-4 space-y-4">
              
              {/* Profile Card */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 text-center space-y-3">
                <div className="relative inline-block">
                  <img 
                    src={currentSession.user_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop'} 
                    alt={currentSession.user_name} 
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-purple-400/40 mx-auto shadow-md" 
                  />
                  <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-[#090d1a]" />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{currentSession.user_name}</h4>
                  <p className="text-xs text-purple-300 font-medium">{currentSession.user_tier || 'Verified Member'}</p>
                  <p className="text-[11px] text-slate-400">{currentSession.user_email}</p>
                </div>

                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-left text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Practice Area</span>
                    <span className="font-semibold text-slate-200">Patent Prosecution</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Location</span>
                    <span className="font-semibold text-slate-200">London, UK</span>
                  </div>
                </div>
              </div>

              {/* Ticket Metadata */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2 text-xs">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ticket Attributes
                </h5>

                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Session ID</span>
                  <span className="font-mono font-bold text-purple-300">#{currentSession.ticket_number}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Priority</span>
                  <span className="font-bold text-rose-400 uppercase">{currentSession.priority}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Assigned Agent</span>
                  <span className="font-bold text-white">Sarah Jenkins</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Origin Domain</span>
                  <span className="font-mono text-[10px] text-slate-300">supportglobal...</span>
                </div>
              </div>

              {/* Knowledge Assistant Snippets */}
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4 space-y-2.5">
                <h5 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <HelpCircle size={12} className="text-purple-400" />
                  Quick Knowledge Insert
                </h5>

                <div className="space-y-2">
                  {CANNED_RESPONSES.slice(0, 3).map((cr) => (
                    <div 
                      key={cr.id}
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-xs"
                    >
                      <p className="font-bold text-slate-200 mb-1">{cr.label}</p>
                      <button
                        type="button"
                        onClick={() => handleApplyMacro(cr.content)}
                        className="text-[10px] font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                      >
                        <CornerDownRight size={10} /> Insert into response
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-2 my-auto">
              <UserCheck size={32} className="mx-auto text-slate-600 opacity-60" />
              <p className="text-xs font-semibold text-slate-400">No member selected</p>
              <p className="text-[11px] text-slate-600">Member profile and practice details will display here when a session is active.</p>
            </div>
          )}
        </aside>

      </div>

    </div>
  );
}
