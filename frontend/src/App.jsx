import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#0058bb','#3853b7','#006a26','#8b5cf6','#ec4899',
  '#f59e0b','#ef4444','#06b6d4','#10b981','#f97316',
];
function colorFor(name = '') {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function initials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}
function fmt(ts) {
  if (!ts) return '';
  try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
  catch { return ''; }
}

const EMOJIS = ['😀','😂','😍','😎','🥳','🤔','😢','😡','👍','👎',
                '❤️','🔥','✨','💯','🙏','👏','🎉','😴','🤣','💀',
                '😱','🥺','😤','🤯','🫶','💪','👀','🫠','🧠','🎯'];

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, size = 40 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: colorFor(name), color: '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, userSelect: 'none',
      boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
    }}>
      {initials(name)}
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onJoin }) {
  const [name, setName] = useState('');
  const ref = useRef();
  useEffect(() => ref.current?.focus(), []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative mesh-background">
      <div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4 glass-cta shadow-lg shadow-primary/20">
          <span className="material-symbols-outlined text-3xl text-white" style={{ fontVariationSettings: "'FILL' 1" }}>bubble_chart</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Chitchat</h1>
      </div>
      <div className="glass-card rounded-3xl p-10 w-full max-w-md relative z-10 weightless-shadow">
        <header className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-on-surface mb-2">Welcome Back</h2>
          <p className="text-sm text-on-surface-variant">Enter your name to start chatting</p>
        </header>
        <form className="space-y-6" onSubmit={e => { e.preventDefault(); const v = name.trim(); if (v.length >= 2) onJoin(v); }}>
          <div className="space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Display Name</label>
            <input
              ref={ref}
              className="w-full px-4 py-3.5 bg-white/50 border border-white/20 rounded-xl text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              placeholder="e.g. Alex Rivera"
              value={name} onChange={e => setName(e.target.value)} maxLength={30}
            />
          </div>
          <button type="submit" disabled={name.trim().length < 2}
            className="w-full glass-cta text-white font-semibold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            Join Chat →
          </button>
        </form>
        <footer className="mt-6 text-center"><p className="text-sm text-on-surface-variant">Minimum 2 characters required</p></footer>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ users, me, activeConv, onSelectConv, unread, isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden" onClick={onClose} />}
      <aside className={`h-full flex-col border-r-0 p-4 gap-y-2 glass-panel z-30 hidden md:flex w-[28%] max-w-[340px]
        ${isOpen ? '!flex fixed top-0 left-0 h-full w-[80vw] max-w-[320px]' : ''}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 mb-4">
          <h1 className="text-lg font-black tracking-tight text-on-surface">Conversations</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Active Now</span>
            <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(0,106,38,0.4)]" />
          </div>
        </div>

        {/* Search */}
        <div className="px-2 mb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline text-sm">search</span>
            </div>
            <input className="w-full bg-surface-container/40 border border-outline-variant/10 rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder:text-outline/60 outline-none"
              placeholder="Search contacts..." readOnly />
          </div>
        </div>

        <nav className="flex flex-col gap-y-1 flex-1 overflow-y-auto hide-scrollbar">
          {/* Global Chat */}
          <button
            onClick={() => { onSelectConv('global'); onClose?.(); }}
            className={`px-4 py-3 flex items-center gap-4 rounded-xl transition-all w-full text-left
              ${activeConv === 'global' ? 'bg-white/80 text-primary shadow-sm ring-1 ring-black/[0.03]' : 'text-on-surface-variant hover:bg-white/40'}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeConv === 'global' ? "'FILL' 1" : "'FILL' 0" }}>chat</span>
            <span className="font-semibold">Global Chat</span>
            {unread['global'] > 0 && (
              <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread['global']}</span>
            )}
          </button>

          {/* Direct Messages section */}
          {users.filter(u => u.username !== me).length > 0 && (
            <div className="mt-5 pt-4 border-t border-outline-variant/10">
              <div className="px-4 mb-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant/50">Direct Messages</p>
              </div>
              <div className="space-y-1">
                {users.filter(u => u.username !== me).map(u => {
                  const dmKey = `dm_${u.username}`;
                  const isActive = activeConv === dmKey;
                  const badge = unread[dmKey] || 0;
                  return (
                    <button key={u.id}
                      onClick={() => { onSelectConv(dmKey); onClose?.(); }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all
                        ${isActive ? 'bg-white/80 shadow-sm ring-1 ring-black/[0.03]' : 'hover:bg-white/40'}`}>
                      <div className="relative flex-shrink-0">
                        <Avatar name={u.username} size={38} />
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-tertiary border-2 border-white rounded-full" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-primary' : 'text-on-surface'}`}>{u.username}</p>
                        <p className="text-[10px] text-tertiary font-bold uppercase tracking-wide">Online</p>
                      </div>
                      {badge > 0 && (
                        <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">{badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* My own user in a section called "You" */}
          {users.filter(u => u.username === me).length > 0 && (
            <div className="mt-5 pt-4 border-t border-outline-variant/10">
              <div className="px-4 mb-3">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant/50">You</p>
              </div>
              {users.filter(u => u.username === me).map(u => (
                <div key={u.id} className="px-3 py-2.5 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <Avatar name={u.username} size={38} />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-tertiary border-2 border-white rounded-full" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-on-surface">{u.username} <span className="text-[10px] font-medium text-on-surface-variant">(you)</span></p>
                    <p className="text-[10px] text-tertiary font-bold uppercase tracking-wide">Online</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </nav>

        {/* Profile footer */}
        {me && (
          <div className="mt-auto pt-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-3 px-2 py-3 bg-surface-container/30 rounded-2xl border border-outline-variant/5">
              <Avatar name={me} size={34} />
              <div>
                <span className="text-xs font-bold text-on-surface">{me}</span>
                <p className="text-[10px] font-medium text-on-surface-variant">Member</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── Typing Indicator ─────────────────────────────────────────────────────────
function TypingIndicator({ typers }) {
  if (!typers.length) return null;
  return (
    <div className="flex gap-4 max-w-[75%]">
      <div className="flex-shrink-0 mt-auto"><Avatar name={typers[0]} size={36} /></div>
      <div className="space-y-1">
        <div className="bg-white/60 backdrop-blur-sm border border-white/40 px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 ml-2">
          {typers[0]} is typing…
        </span>
      </div>
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function Bubble({ msg, isMe }) {
  if (msg.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 bg-white/40 backdrop-blur-sm border border-white/40 px-5 py-1.5 rounded-full shadow-sm">
          {msg.content}
        </span>
      </div>
    );
  }

  const content = (
    <>
      {msg.type === 'text'  && <p>{msg.content}</p>}
      {msg.type === 'image' && (
        <div className="flex flex-col gap-2">
          <img src={`http://localhost:8000${msg.file_url}`} alt="img" className="max-w-[200px] rounded-xl" />
          <span className="text-xs opacity-70">{msg.content}</span>
        </div>
      )}
      {msg.type === 'file'  && (
        <a href={`http://localhost:8000${msg.file_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">
          📄 {msg.content}
        </a>
      )}
    </>
  );

  if (isMe) return (
    <div className="flex flex-col items-end gap-1.5 ml-auto max-w-[85%] md:max-w-[72%]">
      <div className="bg-gradient-to-br from-primary to-primary-dim text-on-primary p-5 rounded-2xl rounded-br-sm shadow-xl shadow-primary/20 leading-relaxed font-medium">
        {content}
      </div>
      <div className="flex items-center gap-1.5 mr-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">{fmt(msg.timestamp)}</span>
        <span className="material-symbols-outlined text-[12px] text-primary">done_all</span>
      </div>
    </div>
  );

  return (
    <div className="flex gap-4 max-w-[85%] md:max-w-[72%]">
      <div className="flex-shrink-0 mt-auto"><Avatar name={msg.username} size={36} /></div>
      <div className="space-y-1.5">
        <div className="bg-white text-on-surface p-5 rounded-2xl rounded-bl-sm shadow-xl shadow-on-surface/5 border border-white/50 leading-relaxed">
          {content}
        </div>
        <span className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 ml-2">
          {msg.username} · {fmt(msg.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ─── Emoji Picker ─────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);
  return (
    <div ref={ref} className="emoji-picker glass-card rounded-2xl p-3 shadow-2xl border border-white/50">
      {EMOJIS.map(e => (
        <button key={e} onClick={() => onSelect(e)}
          className="w-9 h-9 text-xl rounded-lg hover:bg-surface-container transition-all hover:scale-110 flex items-center justify-center">
          {e}
        </button>
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [username, setUsername]       = useState(null);
  const [messages, setMessages]       = useState({});   // { global: [], dm_Bob: [], ... }
  const [input, setInput]             = useState('');
  const [users, setUsers]             = useState([]);
  const [typers, setTypers]           = useState([]);   // [{name, conv}]
  const [activeConv, setActiveConv]   = useState('global');
  const [wsReady, setWsReady]         = useState(false);
  const [showEmoji, setShowEmoji]     = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unread, setUnread]           = useState({});   // { conv_key: count }
  const [dmLoaded, setDmLoaded]       = useState({});   // which DM convs we fetched

  const ws          = useRef(null);
  const endRef      = useRef(null);
  const typingRef   = useRef(false);
  const typingTimer = useRef(null);
  const clientId    = useRef(crypto.randomUUID().slice(0, 8));
  const activeConvRef = useRef(activeConv);

  useEffect(() => { activeConvRef.current = activeConv; }, [activeConv]);

  const scrollDown = useCallback(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), []);
  useEffect(() => { scrollDown(); }, [messages, typers, activeConv]);

  // Add message to the right conversation bucket
  const addMessage = useCallback((msg) => {
    const conv = msg.conversation || 'global';
    setMessages(prev => ({ ...prev, [conv]: [...(prev[conv] || []), msg] }));
    // Increment unread if not the active conversation
    if (conv !== activeConvRef.current) {
      setUnread(prev => ({ ...prev, [conv]: (prev[conv] || 0) + 1 }));
    }
  }, []);

  useEffect(() => {
    if (!username) return;
    const url = `ws://localhost:8000/ws/${clientId.current}?username=${encodeURIComponent(username)}`;
    ws.current = new WebSocket(url);
    ws.current.onopen  = () => setWsReady(true);
    ws.current.onclose = () => setWsReady(false);
    ws.current.onmessage = ({ data }) => {
      const msg = JSON.parse(data);

      if (msg.type === 'users_update') { setUsers(msg.users); return; }

      if (msg.type === 'typing') {
        const conv = msg.to ? (msg.to === username ? `dm_${msg.username}` : null) : 'global';
        if (!conv) return;
        setTypers(prev => {
          const filtered = prev.filter(t => !(t.name === msg.username && t.conv === conv));
          return msg.typing ? [...filtered, { name: msg.username, conv }] : filtered;
        });
        return;
      }

      if (msg.type === 'dm_history') {
        const withUser = msg.with_username;
        const dmKey = `dm_${withUser}`;
        setMessages(prev => ({ ...prev, [dmKey]: msg.messages || [] }));
        setDmLoaded(prev => ({ ...prev, [dmKey]: true }));
        return;
      }

      addMessage(msg);
    };
    return () => ws.current?.close();
  }, [username, addMessage]);

  // When switching to a DM conversation, request history if not yet loaded
  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    setUnread(prev => ({ ...prev, [conv]: 0 }));
    if (conv.startsWith('dm_')) {
      const withUser = conv.slice(3);
      if (!dmLoaded[conv] && ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'dm_history_request', with_username: withUser }));
      }
    }
  };

  const sendTyping = (on) => {
    if (ws.current?.readyState !== WebSocket.OPEN) return;
    const to = activeConv.startsWith('dm_') ? activeConv.slice(3) : undefined;
    ws.current.send(JSON.stringify({ type: 'typing', typing: on, to }));
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    if (!typingRef.current) { typingRef.current = true; sendTyping(true); }
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => { typingRef.current = false; sendTyping(false); }, 2000);
  };

  const sendMessage = () => {
    const c = input.trim();
    if (!c || ws.current?.readyState !== WebSocket.OPEN) return;
    const to = activeConv.startsWith('dm_') ? activeConv.slice(3) : undefined;
    ws.current.send(JSON.stringify({ type: 'text', content: c, to }));
    setInput('');
    clearTimeout(typingTimer.current);
    typingRef.current = false;
    sendTyping(false);
  };

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const to = activeConv.startsWith('dm_') ? activeConv.slice(3) : undefined;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('client_id', clientId.current);
    fd.append('username', username);
    if (to) fd.append('to_user', to);
    try { await fetch('http://localhost:8000/upload/', { method: 'POST', body: fd }); }
    catch (err) { console.error(err); }
  };

  // Who is typing in current conversation?
  const currentTypers = typers.filter(t => t.conv === activeConv && t.name !== username).map(t => t.name);
  const currentMessages = messages[activeConv] || [];

  // Header title based on active conversation
  const isDM       = activeConv.startsWith('dm_');
  const dmTarget   = isDM ? activeConv.slice(3) : null;
  const headerTitle = isDM ? dmTarget : 'Global Chat Room';
  const headerSub   = isDM ? `Private conversation` : `${users.length} Online`;

  if (!username) return <LoginScreen onJoin={setUsername} />;

  return (
    <div className="bg-surface text-on-surface flex h-screen overflow-hidden premium-bg">
      <Sidebar
        users={users} me={username} activeConv={activeConv}
        onSelectConv={handleSelectConv} unread={unread}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* ── Header ── */}
        <header className="flex justify-between items-center w-full px-6 py-4 glass-panel border-b border-outline-variant/10 sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-on-surface p-1" onClick={() => setSidebarOpen(o => !o)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="relative">
              {isDM
                ? <Avatar name={dmTarget} size={42} />
                : (
                  <div className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dim text-on-primary">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span>
                  </div>
                )
              }
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ${wsReady ? 'bg-tertiary' : 'bg-outline-variant'}`} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight text-on-surface">{headerTitle}</h2>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isDM ? 'bg-tertiary' : (wsReady ? 'bg-tertiary' : 'bg-outline-variant')}`} />
                <p className="text-[10px] uppercase font-black tracking-widest text-tertiary">{headerSub}</p>
              </div>
            </div>
          </div>
          {isDM && (
            <button onClick={() => handleSelectConv('global')}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-all">
              <span className="material-symbols-outlined text-sm">arrow_back</span> Global
            </button>
          )}
        </header>

        {/* ── DM Banner ── */}
        {isDM && (
          <div className="px-6 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm text-primary">lock</span>
            <span className="text-xs text-primary font-semibold">Private conversation with <strong>{dmTarget}</strong></span>
          </div>
        )}

        {/* ── Messages ── */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-5 hide-scrollbar">
          <div className="flex justify-center my-4">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant/50 bg-white/40 backdrop-blur-sm border border-white/40 px-5 py-1.5 rounded-full shadow-sm">
              {isDM ? `💬 DM with ${dmTarget}` : 'Welcome to Chitchat ✨'}
            </span>
          </div>

          {currentMessages.map((m, i) => (
            <Bubble key={i} msg={m} isMe={m.username === username} />
          ))}

          <TypingIndicator typers={currentTypers} />
          <div ref={endRef} />
        </div>

        {/* ── Composer ── */}
        <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2 relative">
          {showEmoji && (
            <div className="absolute bottom-full left-6 mb-2 z-50">
              <EmojiPicker onSelect={e => { setInput(p => p + e); setShowEmoji(false); }} onClose={() => setShowEmoji(false)} />
            </div>
          )}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2.5 pl-5 shadow-2xl shadow-on-surface/10 flex items-center gap-2 border border-white ring-1 ring-black/[0.03] focus-within:ring-primary/20 transition-all">
              <button onClick={() => setShowEmoji(s => !s)} className="p-1.5 text-outline hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-2xl">mood</span>
              </button>
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface text-base py-3 font-medium outline-none min-w-0 placeholder:text-outline/40"
                placeholder={isDM ? `Message ${dmTarget}…` : 'Type your message…'}
                value={input}
                onChange={handleInput}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              />
              <div className="flex items-center gap-1 pr-1">
                <label className="p-2 text-outline hover:text-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined text-2xl">attach_file</span>
                  <input type="file" className="hidden" onChange={uploadFile} />
                </label>
                <button onClick={sendMessage} disabled={!input.trim() || !wsReady}
                  className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary-dim">
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center mt-3 text-on-surface-variant/40 font-bold uppercase tracking-widest">
              {isDM ? '🔒 Private message — only visible to you and ' + dmTarget : 'End-to-end encrypted'}
            </p>
          </div>
        </div>

        {/* ── Mobile Bottom Nav ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-panel border-t border-outline-variant/5 flex justify-around py-3 px-6 z-30">
          <button className={`flex flex-col items-center gap-1 ${activeConv === 'global' ? 'text-primary' : 'text-on-surface-variant/60'}`}
            onClick={() => handleSelectConv('global')}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeConv === 'global' ? "'FILL' 1" : "'FILL' 0" }}>chat</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Chats</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-on-surface-variant/60" onClick={() => setSidebarOpen(true)}>
            <span className="material-symbols-outlined">groups</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Members</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-on-surface-variant/60">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-black uppercase tracking-widest">Profile</span>
          </button>
        </nav>
      </main>
    </div>
  );
}