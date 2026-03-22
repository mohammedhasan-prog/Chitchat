import { useState, useEffect, useRef, useCallback } from 'react';
import EmojiPickerLib from 'emoji-picker-react';
import Dashboard from './Dashboard';

const COLORS = ['#0058bb', '#3853b7', '#006a26', '#8b5cf6', '#ec4899', '#f59e0b', '#ef4444', '#06b6d4', '#10b981', '#f97316'];
function colorFor(n = '') { let h = 0; for (let i = 0; i < n.length; i++)h = n.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length] }
function ini(n = '') { return n.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??' }
function fmt(ts) { if (!ts) return ''; try { return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

const API = 'http://localhost:8000';

function Avatar({ name, size = 40, icon, pic }) {
  if (pic) return (<img src={`${API}${pic}`} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} alt={name} />);
  if (icon) return (<div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#0058bb,#6c9fff)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span className="material-symbols-outlined" style={{ fontSize: size * 0.5, fontVariationSettings: "'FILL' 1" }}>{icon}</span></div>);
  return (<div style={{ width: size, height: size, borderRadius: '50%', background: colorFor(name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, userSelect: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>{ini(name)}</div>);
}

// ─── Auth Screen ──────────────────────────────────────────────────────────────
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  const emailRef = useRef(); useEffect(() => { emailRef.current?.focus(); setError('') }, [mode]);
  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const url = mode === 'signup' ? `${API}/auth/signup` : `${API}/auth/login`;
      const body = mode === 'signup' ? { email, display_name: displayName, password } : { email, password };
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { setError(data.detail || 'Something went wrong'); setLoading(false); return }
      localStorage.setItem('chitchat_user', JSON.stringify(data)); onAuth(data);
    } catch { setError('Cannot connect to server') }
    setLoading(false);
  };
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
          <h2 className="text-2xl font-bold text-on-surface mb-2">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="text-sm text-on-surface-variant">{mode === 'login' ? 'Continue your conversations' : 'Join Chitchat today'}</p>
        </header>
        <form className="space-y-5" onSubmit={submit}>
          {mode === 'signup' && <div className="space-y-2"><label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Display Name</label><input className="w-full px-4 py-3.5 bg-white/50 border border-white/20 rounded-xl text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="Alex Rivera" value={displayName} onChange={e => setDisplayName(e.target.value)} maxLength={30} /></div>}
          <div className="space-y-2"><label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Email</label><input ref={emailRef} className="w-full px-4 py-3.5 bg-white/50 border border-white/20 rounded-xl text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="name@example.com" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><div className="flex justify-between items-center"><label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Password</label>{mode === 'login' && <span className="text-[11px] font-bold text-primary uppercase tracking-wider cursor-pointer hover:opacity-70">Forgot?</span>}</div><input className="w-full px-4 py-3.5 bg-white/50 border border-white/20 rounded-xl text-on-surface placeholder:text-outline/60 focus:ring-2 focus:ring-primary/20 transition-all outline-none" placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} /></div>
          {error && <div className="flex items-center gap-2 bg-red-50 border border-red-200/50 rounded-xl px-4 py-3 text-red-600 text-sm font-medium"><span className="material-symbols-outlined text-lg">error</span>{error}</div>}
          <button type="submit" disabled={loading || !email || !password || (mode === 'signup' && displayName.length < 2)} className="w-full glass-cta text-white font-semibold py-4 rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all mt-2 disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{mode === 'login' ? 'Logging in…' : 'Creating…'}</span> : (mode === 'login' ? 'Log In' : 'Sign Up')}
          </button>
        </form>
      </div>
      <footer className="mt-8 text-center relative z-10"><p className="text-sm text-on-surface-variant">{mode === 'login' ? "Don't have an account? " : "Already have an account? "}<button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }} className="text-primary font-semibold hover:underline decoration-2 underline-offset-4">{mode === 'login' ? 'Sign up' : 'Log in'}</button></p></footer>
    </div>
  );
}

// ─── Search Bar ───────────────────────────────────────────────────────────────
function SearchBar({ me, friends, onAddFriend, onSelectDM }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [adding, setAdding] = useState(false);
  const ref = useRef();
  const timer = useRef();

  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const search = async (q) => {
    if (q.length < 1) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${API}/users/search?q=${encodeURIComponent(q)}&username=${encodeURIComponent(me)}`);
      const data = await res.json();
      setResults(data.users || []);
    } catch { setResults([]); }
    setSearching(false);
  };

  const handleChange = (e) => {
    const v = e.target.value;
    setQuery(v); setOpen(true); setMsg('');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => search(v), 300);
  };

  const handleAdd = async (u) => {
    if (adding) return;
    setAdding(true);
    try {
      const res = await fetch(`${API}/friends/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: me, friend_email: u.email }),
      });
      const data = await res.json();
      if (res.ok) { setMsg(`✅ Added ${u.display_name}!`); onAddFriend(u); }
      else setMsg(data.detail || 'Error');
    } catch { setMsg('Network error'); }
    finally { setAdding(false); }
  };

  const friendNames = friends.map(f => f.display_name);

  return (
    <div className="px-2 mb-3 relative" ref={ref}>
      <div className="relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
        </div>
        <input
          className="w-full bg-surface-container/40 border border-outline-variant/10 rounded-xl py-2.5 pl-10 pr-4 text-sm placeholder:text-outline/60 outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          placeholder="Search by name or email…"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (query) setOpen(true); }}
        />
        {query && (
          <button className="absolute inset-y-0 right-2 flex items-center text-outline hover:text-on-surface transition-colors"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); setMsg(''); }}>
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        )}
      </div>

      {open && query && (
        <div className="absolute top-full left-2 right-2 mt-1 z-50 glass-card rounded-xl shadow-2xl border border-white/50 max-h-72 overflow-y-auto">
          {msg && (<div className="px-4 py-3 text-sm font-medium text-primary border-b border-outline-variant/10">{msg}</div>)}
          {searching && (<div className="px-4 py-4 text-sm text-on-surface-variant flex items-center gap-2"><span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />Searching…</div>)}
          {!searching && results.length === 0 && (<div className="px-4 py-4 text-sm text-on-surface-variant/60">No users found</div>)}
          {results.map(u => {
            const isFriend = friendNames.includes(u.display_name);
            return (
              <div key={u.id} className="px-3 py-2.5 flex items-center gap-3 hover:bg-white/40 transition-all">
                <Avatar name={u.display_name} size={34} pic={u.profile_pic_url} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{u.display_name}</p>
                  <p className="text-[10px] text-on-surface-variant truncate">{u.email}</p>
                </div>
                {isFriend ? (
                  <button onClick={() => { onSelectDM(u.display_name); setOpen(false); setQuery(''); }}
                    className="text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">chat</span>Message
                  </button>
                ) : (
                  <button onClick={() => handleAdd(u)} disabled={adding}
                    className="text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 shadow-sm disabled:opacity-50 hover:bg-primary-dim">
                    <span className="material-symbols-outlined text-sm">person_add</span>{adding ? 'Adding...' : 'Add'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Create Group Modal ───────────────────────────────────────────────────────
function CreateGroupModal({ users, friends, me, onClose, onCreate }) {
  const [name, setName] = useState(''); const [selected, setSelected] = useState([]);
  const toggle = u => setSelected(p => p.includes(u) ? p.filter(x => x !== u) : [...p, u]);
  const allPeople = [...new Set([...users.filter(u => u.username !== me).map(u => u.username), ...friends.map(f => f.display_name)])];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="glass-card rounded-3xl p-8 w-full max-w-md relative z-10 weightless-shadow">
        <h3 className="text-xl font-black text-on-surface mb-1">Create Group</h3>
        <p className="text-sm text-on-surface-variant mb-6">Name your group and select members</p>
        <div className="space-y-4">
          <div><label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Group Name</label><input className="w-full px-4 py-3 bg-white/50 border border-white/20 rounded-xl text-on-surface outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. Project Team" value={name} onChange={e => setName(e.target.value)} maxLength={40} autoFocus /></div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-2">Select Members ({selected.length})</label>
            <div className="max-h-48 overflow-y-auto space-y-1 hide-scrollbar">
              {allPeople.length === 0 && <p className="text-sm text-on-surface-variant/50 py-2">No contacts available</p>}
              {allPeople.map(u => (
                <button key={u} onClick={() => toggle(u)} className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${selected.includes(u) ? 'bg-primary/10 ring-1 ring-primary/30' : 'hover:bg-white/40'}`}>
                  <Avatar name={u} size={32} /><span className="text-sm font-semibold text-on-surface">{u}</span>
                  {selected.includes(u) && <span className="ml-auto material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-outline-variant/20 text-on-surface-variant font-semibold hover:bg-white/40 transition-all">Cancel</button>
          <button onClick={() => { if (name.trim().length >= 2 && selected.length > 0) { onCreate(name.trim(), selected); onClose() } }} disabled={name.trim().length < 2 || selected.length === 0}
            className="flex-1 py-3 rounded-xl glass-cta text-white font-semibold shadow-lg shadow-primary/20 disabled:opacity-40 hover:opacity-90 transition-all">Create</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ users, user, friends, groups, activeConv, onSelectConv, unread, isOpen, onClose, onCreateGroup, onLogout, onAddFriend, onlineNames, onOpenDashboard }) {
  const me = user?.display_name;
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 md:hidden" onClick={onClose} />}
      <aside className={`h-full flex-col border-r-0 p-4 gap-y-2 glass-panel z-30 hidden md:flex w-[28%] max-w-[340px] ${isOpen ? '!flex fixed top-0 left-0 h-full w-[80vw] max-w-[320px]' : ''}`}>
        <div className="flex items-center justify-between px-4 mb-4">
          <h1 className="text-lg font-black tracking-tight text-on-surface">Conversations</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Active</span>
            <div className="w-2 h-2 rounded-full bg-tertiary shadow-[0_0_8px_rgba(0,106,38,0.4)]" />
          </div>
        </div>

        <SearchBar me={me} friends={friends} onAddFriend={onAddFriend}
          onSelectDM={(name) => { onSelectConv(`dm_${name}`); onClose?.(); }} />

        <nav className="flex flex-col gap-y-1 flex-1 overflow-y-auto hide-scrollbar">
          {/* Global Chat */}
          <button onClick={() => { onSelectConv('global'); onClose?.() }} className={`px-4 py-3 flex items-center gap-3 rounded-xl transition-all w-full text-left ${activeConv === 'global' ? 'bg-white/80 text-primary shadow-sm ring-1 ring-black/[0.03]' : 'text-on-surface-variant hover:bg-white/40'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeConv === 'global' ? "'FILL' 1" : "'FILL' 0" }}>chat</span>
            <span className="font-semibold text-sm">Global Chat</span>
            {(unread['global'] || 0) > 0 && <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread['global']}</span>}
          </button>

          {/* Groups */}
          {groups.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 px-4 mb-2">Groups</p>
              {groups.map(g => (
                <button key={g.id} onClick={() => { onSelectConv(`group_${g.id}`); onClose?.() }} className={`px-4 py-3 flex items-center gap-3 rounded-xl transition-all w-full text-left ${activeConv === `group_${g.id}` ? 'bg-white/80 text-primary shadow-sm ring-1 ring-black/[0.03]' : 'text-on-surface-variant hover:bg-white/40'}`}>
                  <Avatar name={g.name} size={32} icon="group" />
                  <div className="flex-1 min-w-0"><p className="font-semibold text-sm truncate">{g.name}</p><p className="text-[10px] text-on-surface-variant">{g.members.length} members</p></div>
                  {(unread[`group_${g.id}`] || 0) > 0 && <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread[`group_${g.id}`]}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Create group */}
          <button onClick={onCreateGroup} className="mt-2 px-4 py-2.5 flex items-center gap-3 rounded-xl transition-all w-full text-left text-on-surface-variant hover:bg-white/40 border border-dashed border-outline-variant/20">
            <span className="material-symbols-outlined text-lg">group_add</span>
            <span className="font-semibold text-sm">New Group</span>
          </button>

          {/* Friends */}
          {friends.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 px-4 mb-2">Friends</p>
              {friends.map(f => (
                <button key={f.display_name} onClick={() => { onSelectConv(`dm_${f.display_name}`); onClose?.() }} className={`px-4 py-3 flex items-center gap-3 rounded-xl transition-all w-full text-left ${activeConv === `dm_${f.display_name}` ? 'bg-white/80 text-primary shadow-sm ring-1 ring-black/[0.03]' : 'text-on-surface-variant hover:bg-white/40'}`}>
                  <div className="relative">
                    <Avatar name={f.display_name} size={32} pic={f.profile_pic_url} />
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${onlineNames.includes(f.display_name) ? 'bg-tertiary' : 'bg-gray-400'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{f.display_name}</p>
                    <p className={`text-[10px] font-bold ${onlineNames.includes(f.display_name) ? 'text-tertiary' : 'text-on-surface-variant/50'}`}>{onlineNames.includes(f.display_name) ? 'Online' : 'Offline'}</p>
                  </div>
                  {(unread[`dm_${f.display_name}`] || 0) > 0 && <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread[`dm_${f.display_name}`]}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Online Now */}
          {users.filter(u => u.username !== me && !friends.find(f => f.display_name === u.username)).length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant/50 px-4 mb-2">Online Now</p>
              {users.filter(u => u.username !== me && !friends.find(f => f.display_name === u.username)).map(u => (
                <button key={u.id} onClick={() => { onSelectConv(`dm_${u.username}`); onClose?.() }} className={`px-4 py-3 flex items-center gap-3 rounded-xl transition-all w-full text-left ${activeConv === `dm_${u.username}` ? 'bg-white/80 text-primary shadow-sm ring-1 ring-black/[0.03]' : 'text-on-surface-variant hover:bg-white/40'}`}>
                  <div className="relative">
                    <Avatar name={u.username} size={32} pic={u.profile_pic_url} />
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{u.username}</p>
                    <p className="text-[10px] font-bold text-tertiary">Online</p>
                  </div>
                  {(unread[`dm_${u.username}`] || 0) > 0 && <span className="ml-auto bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{unread[`dm_${u.username}`]}</span>}
                </button>
              ))}
            </div>
          )}
        </nav>

        {me && (
          <div className="mt-auto pt-4 border-t border-outline-variant/10">
            <div className="flex items-center gap-3 px-2 py-3 bg-surface-container/30 rounded-2xl border border-outline-variant/5">
              <Avatar name={me} size={34} pic={user?.profile_pic_url} />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold text-on-surface block truncate">{me}</span>
                <button onClick={onOpenDashboard} className="text-[10px] text-primary hover:underline font-bold uppercase tracking-wider">Dashboard</button>
              </div>
              <button onClick={onLogout} className="p-1.5 text-on-surface-variant hover:text-red-500 transition-colors rounded-lg hover:bg-red-50" title="Log out">
                <span className="material-symbols-outlined text-lg">logout</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

// ─── TypingIndicator ──────────────────────────────────────────────────────────
function TypingIndicator({ typers, profilePics = {} }) {
  if (!typers.length) return null;
  return (<div className="flex gap-4 max-w-[75%]"><div className="flex-shrink-0 mt-auto"><Avatar name={typers[0]} size={36} pic={profilePics[typers[0]]} /></div><div className="space-y-1"><div className="bg-white/60 backdrop-blur-sm border border-white/40 px-5 py-4 rounded-2xl rounded-bl-sm shadow-sm flex items-center gap-1.5">{[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}</div><span className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 ml-2">{typers[0]} is typing…</span></div></div>);
}

// ─── Bubble ───────────────────────────────────────────────────────────────────
function Bubble({ msg, isMe, pic, onDelete }) {
  if (msg.type === 'system') return (<div className="flex justify-center my-2"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/50 bg-white/40 backdrop-blur-sm border border-white/40 px-5 py-1.5 rounded-full shadow-sm">{msg.content}</span></div>);
  const body = <>{msg.type === 'text' && <p>{msg.content}</p>}{msg.type === 'image' && <div className="flex flex-col gap-2"><img src={`${API}${msg.file_url}`} alt="img" className="max-w-[200px] rounded-xl" /><span className="text-xs opacity-70">{msg.content}</span></div>}{msg.type === 'file' && <a href={`${API}${msg.file_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 underline">📄 {msg.content}</a>}</>;
  if (isMe) return (
    <div className="flex flex-col items-end gap-1.5 ml-auto max-w-[85%] md:max-w-[72%] group relative">
      <div className="bg-gradient-to-br from-primary to-primary-dim text-on-primary p-5 rounded-2xl rounded-br-sm shadow-xl shadow-primary/20 leading-relaxed font-medium relative flex items-center">
        <button onClick={() => onDelete(msg.id)} className="absolute -left-10 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
        {body}
      </div>
      <div className="flex items-center gap-1.5 mr-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50">{fmt(msg.timestamp)}</span>
        <span className="material-symbols-outlined text-[12px] text-primary">done_all</span>
      </div>
    </div>
  );
  return (<div className="flex gap-4 max-w-[85%] md:max-w-[72%]"><div className="flex-shrink-0 mt-auto"><Avatar name={msg.username || '?'} size={36} pic={pic} /></div><div className="space-y-1.5"><div className="bg-white text-on-surface p-5 rounded-2xl rounded-bl-sm shadow-xl shadow-on-surface/5 border border-white/50 leading-relaxed">{body}</div><span className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/50 ml-2">{msg.username || 'Unknown'} · {fmt(msg.timestamp)}</span></div></div>);
}

// ─── EmojiPicker ──────────────────────────────────────────────────────────────
function EmojiPicker({ onSelect, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const fn = e => { if (!ref.current?.contains(e.target)) onClose() };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [onClose]);
  return (
    <div ref={ref} className="shadow-2xl rounded-2xl overflow-hidden">
      <EmojiPickerLib
        onEmojiClick={(emojiData) => onSelect(emojiData.emoji)}
        theme="light"
        height={400}
        width={320}
        searchDisabled={false}
        previewConfig={{ showPreview: false }}
        lazyLoadEmojis={true}
      />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('chitchat_user')) } catch { return null } });
  const [messages, setMessages] = useState({}); const [input, setInput] = useState('');
  const [users, setUsers] = useState([]); const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [typers, setTypers] = useState([]); const [activeConv, setActiveConv] = useState('global');
  const [wsReady, setWsReady] = useState(false); const [showEmoji, setShowEmoji] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false); const [unread, setUnread] = useState({});
  const [dmLoaded, setDmLoaded] = useState({}); const [groupLoaded, setGroupLoaded] = useState({});
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [view, setView] = useState('chat');

  const username = user?.display_name;
  const ws = useRef(null), endRef = useRef(null), typingRef = useRef(false), typingTimer = useRef(null);
  const clientId = useRef(crypto.randomUUID().slice(0, 8));
  const activeConvRef = useRef(activeConv);
  useEffect(() => { activeConvRef.current = activeConv }, [activeConv]);

  const scrollDown = useCallback(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), []);
  useEffect(() => { scrollDown() }, [messages, typers, activeConv]);

  // Load friends on login
  useEffect(() => {
    if (!username) return;
    fetch(`${API}/friends/list?username=${encodeURIComponent(username)}`).then(r => r.json()).then(d => setFriends(d.friends || [])).catch(() => { });
  }, [username]);

  const addMessage = useCallback(msg => {
    const conv = msg.conversation || 'global';
    setMessages(p => ({ ...p, [conv]: [...(p[conv] || []), msg] }));
    if (conv !== activeConvRef.current) setUnread(p => ({ ...p, [conv]: (p[conv] || 0) + 1 }));
  }, []);

  const deleteMessage = useCallback(id => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: 'delete_message', message_id: id }));
    }
  }, []);

  useEffect(() => {
    if (!username) return;
    const url = `ws://localhost:8000/ws/${clientId.current}?username=${encodeURIComponent(username)}`;
    const sock = new WebSocket(url);
    ws.current = sock;
    sock.onopen = () => setWsReady(true);
    sock.onclose = () => setWsReady(false);
    sock.onmessage = e => {
      const d = JSON.parse(e.data);
      if (d.type === 'users_update') { setUsers(d.users || []); return }
      if (d.type === 'groups_list') { setGroups(d.groups || []); return }
      if (d.type === 'group_created') { setGroups(p => [...p.filter(g => g.id !== d.group.id), d.group]); return }
      if (d.type === 'typing') {
        const conv = d.group_id ? `group_${d.group_id}` : d.to ? `dm_${d.username}` : 'global';
        if (d.typing) setTypers(p => [...p.filter(t => t.name !== d.username), { name: d.username, conv }]);
        else setTypers(p => p.filter(t => t.name !== d.username));
        return;
      }
      if (d.type === 'message_deleted') {
        setMessages(p => ({
          ...p,
          [d.conversation]: (p[d.conversation] || []).filter(m => m.id !== d.message_id)
        }));
        return;
      }
      if (d.type === 'dm_history') {
        const conv = `dm_${d.with_username}`;
        setMessages(p => {
          const existing = p[conv] || [];
          const histIds = new Set((d.messages || []).map(m => m.id).filter(Boolean));
          // Keep any real-time messages not yet in history, then append
          const realOnly = existing.filter(m => m.id == null || !histIds.has(m.id));
          return { ...p, [conv]: [...(d.messages || []), ...realOnly] };
        });
        setDmLoaded(p => ({ ...p, [d.with_username]: true }));
        return;
      }
      if (d.type === 'group_history') {
        const conv = `group_${d.group_id}`;
        setMessages(p => {
          const existing = p[conv] || [];
          const histIds = new Set((d.messages || []).map(m => m.id).filter(Boolean));
          const realOnly = existing.filter(m => m.id == null || !histIds.has(m.id));
          return { ...p, [conv]: [...(d.messages || []), ...realOnly] };
        });
        setGroupLoaded(p => ({ ...p, [d.group_id]: true }));
        return;
      }
      addMessage(d);
    };
    return () => sock.close();
  }, [username, addMessage]);

  const handleSelectConv = useCallback(conv => {
    setActiveConv(conv);
    setUnread(p => ({ ...p, [conv]: 0 }));
    setTypers(p => p.filter(t => t.conv !== conv));
    if (conv.startsWith('dm_') && ws.current?.readyState === WebSocket.OPEN) {
      const with_username = conv.slice(3);
      if (!dmLoaded[with_username]) {
        ws.current.send(JSON.stringify({ type: 'dm_history_request', with_username }));
      }
    }
    if (conv.startsWith('group_') && ws.current?.readyState === WebSocket.OPEN) {
      const gid = parseInt(conv.slice(6));
      if (!groupLoaded[gid]) {
        ws.current.send(JSON.stringify({ type: 'group_history_request', group_id: gid }));
      }
    }
  }, [dmLoaded, groupLoaded]);

  const sendTyping = on => { if (ws.current?.readyState !== WebSocket.OPEN) return; const p = { type: 'typing', typing: on }; if (activeConv.startsWith('dm_')) p.to = activeConv.slice(3); else if (activeConv.startsWith('group_')) p.group_id = parseInt(activeConv.slice(6)); ws.current.send(JSON.stringify(p)) };
  const handleInput = e => { setInput(e.target.value); if (!typingRef.current) { typingRef.current = true; sendTyping(true) } clearTimeout(typingTimer.current); typingTimer.current = setTimeout(() => { typingRef.current = false; sendTyping(false) }, 2000) };
  const sendMessage = () => { const c = input.trim(); if (!c || ws.current?.readyState !== WebSocket.OPEN) return; const p = { type: 'text', content: c }; if (activeConv.startsWith('dm_')) p.to = activeConv.slice(3); else if (activeConv.startsWith('group_')) p.group_id = parseInt(activeConv.slice(6)); ws.current.send(JSON.stringify(p)); setInput(''); clearTimeout(typingTimer.current); typingRef.current = false; sendTyping(false) };
  const uploadFile = async e => { const file = e.target.files[0]; if (!file) return; e.target.value = ''; const fd = new FormData(); fd.append('file', file); fd.append('client_id', clientId.current); fd.append('username', username); if (activeConv.startsWith('dm_')) fd.append('to_user', activeConv.slice(3)); if (activeConv.startsWith('group_')) fd.append('group_id', activeConv.slice(6)); try { await fetch(`${API}/upload/`, { method: 'POST', body: fd }) } catch (err) { console.error(err) } };
  const createGroup = (name, members) => { if (ws.current?.readyState === WebSocket.OPEN) ws.current.send(JSON.stringify({ type: 'create_group', name, members })) };

  const handleAddFriend = (u) => {
    setFriends(p => p.find(f => f.display_name === u.display_name) ? p : [...p, u]);
  };

  const handleLogout = () => { localStorage.removeItem('chitchat_user'); ws.current?.close(); setUser(null); setMessages({}); setUsers([]); setGroups([]); setFriends([]); setTypers([]); setActiveConv('global'); setUnread({}); setDmLoaded({}); setGroupLoaded({}); setView('chat') };

  const totalUnread = Object.values(unread).reduce((s, v) => s + (v || 0), 0);

  const currentTypers = typers.filter(t => t.conv === activeConv && t.name !== username).map(t => t.name);
  const currentMessages = messages[activeConv] || [];
  const isDM = activeConv.startsWith('dm_'), isGroup = activeConv.startsWith('group_');
  const dmTarget = isDM ? activeConv.slice(3) : null;
  const activeGroup = isGroup ? groups.find(g => g.id === parseInt(activeConv.slice(6))) : null;
  const onlineNames = users.map(u => u.username);
  let headerTitle = 'Global Chat Room', headerSub = `${users.length} Online`;
  if (isDM) { headerTitle = dmTarget; headerSub = onlineNames.includes(dmTarget) ? 'Online' : 'Offline' }
  if (isGroup && activeGroup) { headerTitle = activeGroup.name; headerSub = `${activeGroup.members.length} members` }
  let placeholder = 'Type your message…';
  if (isDM) placeholder = `Message ${dmTarget}…`;
  if (isGroup && activeGroup) placeholder = `Message ${activeGroup.name}…`;

  const profilePics = {};
  users.forEach(u => { if (u.profile_pic_url) profilePics[u.username] = u.profile_pic_url; });
  friends.forEach(f => { if (f.profile_pic_url) profilePics[f.display_name] = f.profile_pic_url; });

  if (!user) return <AuthScreen onAuth={setUser} />;

  return (
    <div className="bg-surface text-on-surface flex h-screen overflow-hidden premium-bg">
      {showCreateGroup && <CreateGroupModal users={users} friends={friends} me={username} onClose={() => setShowCreateGroup(false)} onCreate={createGroup} />}
      <Sidebar users={users} user={user} friends={friends} groups={groups} activeConv={activeConv} onSelectConv={handleSelectConv} unread={unread}
        isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onCreateGroup={() => setShowCreateGroup(true)} onLogout={handleLogout}
        onAddFriend={handleAddFriend} onlineNames={onlineNames} onOpenDashboard={() => { setView('dashboard'); setSidebarOpen(false) }} />

      {view === 'dashboard' ? (
        <Dashboard
          user={user}
          messages={messages}
          friends={friends}
          groups={groups}
          totalUnread={totalUnread}
          onClose={() => setView('chat')}
          onStartChat={() => setView('chat')}
          onCreateGroup={() => { setView('chat'); setShowCreateGroup(true) }}
          onUpdateUser={setUser}
        />
      ) : (

        <main className="flex-1 flex flex-col relative overflow-hidden">
          <header className="flex justify-between items-center w-full px-6 py-4 glass-panel border-b border-outline-variant/10 sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <button className="md:hidden text-on-surface p-1" onClick={() => setSidebarOpen(o => !o)}><span className="material-symbols-outlined">menu</span></button>
              <div className="relative">
                {isDM ? <Avatar name={dmTarget} size={42} pic={profilePics[dmTarget]} /> : isGroup ? <Avatar name={activeGroup?.name || ''} size={42} icon="group" /> : <div className="w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-br from-primary to-primary-dim text-on-primary"><span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>groups</span></div>}
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white shadow-sm ${isDM ? (onlineNames.includes(dmTarget) ? 'bg-tertiary' : 'bg-gray-400') : (wsReady ? 'bg-tertiary' : 'bg-outline-variant')}`} />
              </div>
              <div><h2 className="text-xl font-black tracking-tight text-on-surface">{headerTitle}</h2><div className="flex items-center gap-1.5"><span className={`w-1.5 h-1.5 rounded-full ${isDM ? (onlineNames.includes(dmTarget) ? 'bg-tertiary' : 'bg-gray-400') : 'bg-tertiary'}`} /><p className={`text-[10px] uppercase font-black tracking-widest ${isDM ? (onlineNames.includes(dmTarget) ? 'text-tertiary' : 'text-on-surface-variant/50') : 'text-tertiary'}`}>{headerSub}</p></div></div>
            </div>
            {(isDM || isGroup) && <button onClick={() => handleSelectConv('global')} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-all"><span className="material-symbols-outlined text-sm">arrow_back</span> Global</button>}
          </header>

          {isDM && <div className="px-6 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2"><span className="material-symbols-outlined text-sm text-primary">lock</span><span className="text-xs text-primary font-semibold">Private conversation with <strong>{dmTarget}</strong></span></div>}
          {isGroup && activeGroup && <div className="px-6 py-2 bg-primary/5 border-b border-primary/10 flex items-center gap-2"><span className="material-symbols-outlined text-sm text-primary">group</span><span className="text-xs text-primary font-semibold"><strong>{activeGroup.name}</strong> — {activeGroup.members.join(', ')}</span></div>}

          <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-5 hide-scrollbar">
            <div className="flex justify-center my-4"><span className="text-[10px] font-black uppercase tracking-[0.25em] text-on-surface-variant/50 bg-white/40 backdrop-blur-sm border border-white/40 px-5 py-1.5 rounded-full shadow-sm">{isDM ? `💬 DM with ${dmTarget}` : isGroup ? `👥 ${activeGroup?.name || 'Group'}` : 'Welcome to Chitchat ✨'}</span></div>
            {currentMessages.map((m, i) => <Bubble key={i} msg={m} isMe={m.username === username} pic={profilePics[m.username]} onDelete={deleteMessage} />)}
            <TypingIndicator typers={currentTypers} profilePics={profilePics} />
            <div ref={endRef} />
          </div>

          <div className="px-6 md:px-8 pb-6 md:pb-8 pt-2 relative">
            {showEmoji && <div className="absolute bottom-full left-6 mb-2 z-50"><EmojiPicker onSelect={e => { setInput(p => p + e); setShowEmoji(false) }} onClose={() => setShowEmoji(false)} /></div>}
            <div className="max-w-4xl mx-auto">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2.5 pl-5 shadow-2xl shadow-on-surface/10 flex items-center gap-2 border border-white ring-1 ring-black/[0.03] focus-within:ring-primary/20 transition-all">
                <button onClick={() => setShowEmoji(s => !s)} className="p-1.5 text-outline hover:text-primary transition-colors"><span className="material-symbols-outlined text-2xl">mood</span></button>
                <input className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface text-base py-3 font-medium outline-none min-w-0 placeholder:text-outline/40" placeholder={placeholder} value={input} onChange={handleInput} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()} />
                <div className="flex items-center gap-1 pr-1">
                  <label className="p-2 text-outline hover:text-primary transition-colors cursor-pointer"><span className="material-symbols-outlined text-2xl">attach_file</span><input type="file" className="hidden" onChange={uploadFile} /></label>
                  <button onClick={sendMessage} disabled={!input.trim() || !wsReady} className="w-11 h-11 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-all disabled:opacity-40 hover:bg-primary-dim"><span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span></button>
                </div>
              </div>
              <p className="text-[10px] text-center mt-3 text-on-surface-variant/40 font-bold uppercase tracking-widest">{isDM ? `🔒 Private — only visible to you and ${dmTarget}` : isGroup ? `👥 Group — ${activeGroup?.members?.length || 0} members` : 'End-to-end encrypted'}</p>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
