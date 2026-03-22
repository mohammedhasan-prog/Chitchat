import { useState, useRef } from 'react';

const API = 'http://localhost:8000';

function colorFor(n=''){let h=0;for(let i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h);const colors=['#0058bb','#3853b7','#006a26','#8b5cf6','#ec4899','#f59e0b','#ef4444','#06b6d4'];return colors[Math.abs(h)%colors.length]}
function ini(n=''){return n.trim().split(/\s+/).map(w=>w[0]).join('').slice(0,2).toUpperCase()||'??'}

function UserAvatar({ name, pic, size = 40 }) {
  if (pic) return <img src={`${API}${pic}`} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt={name} />;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: colorFor(name), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.36, fontWeight: 700, flexShrink: 0, userSelect: 'none' }}>
      {ini(name)}
    </div>
  );
}

export default function Dashboard({ user, messages, friends, groups, totalUnread, onClose, onStartChat, onCreateGroup, onUpdateUser }) {
  const [activeNav, setActiveNav] = useState('overview');
  const [uploadingPic, setUploadingPic] = useState(false);
  const [profilePic, setProfilePic] = useState(user?.profile_pic_url);
  const fileRef = useRef(null);

  // ─── Stats ───────────────────────────────────────────────────────
  const allMsgs = Object.values(messages).flat();
  const totalSent = allMsgs.filter(m => m.username === user?.display_name && m.type === 'text').length;
  const activeChatCount = Object.keys(messages).filter(k => (messages[k]||[]).length > 0).length;

  // ─── Recent Activity  ────────────────────────────────────────────
  // Build activity feed from latest messages across all convos
  const recentActivity = allMsgs
    .filter(m => m.type !== 'system' && m.username !== user?.display_name)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  function timeAgo(ts) {
    if (!ts) return '';
    const diff = Math.floor((Date.now() - new Date(ts)) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  }

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingPic(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('username', user.display_name);
    fd.append('is_profile_pic', 'true');
    try {
      const res = await fetch(`${API}/upload/`, { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setProfilePic(data.profile_pic_url);
        const local = JSON.parse(localStorage.getItem('chitchat_user') || '{}');
        local.profile_pic_url = data.profile_pic_url;
        localStorage.setItem('chitchat_user', JSON.stringify(local));
        if (onUpdateUser) onUpdateUser(local);
      }
    } catch (err) { console.error(err); }
    setUploadingPic(false);
  };

  const navItems = [
    { id: 'overview', icon: 'dashboard', label: 'Overview' },
    { id: 'messages', icon: 'chat', label: 'Messages' },
    { id: 'contacts', icon: 'contacts', label: 'Contacts' },
    { id: 'profile', icon: 'person', label: 'Profile' },
    { id: 'settings', icon: 'settings', label: 'Settings' },
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-[#f6f6fb]" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ─── Side Nav ─────────────────────────────────────────────── */}
      <aside className="h-full w-64 flex-shrink-0 border-r border-slate-100 bg-slate-50 flex flex-col p-4 z-10">
        {/* Logo */}
        <div className="mb-10 px-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>bubble_chart</span>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none">Chitchat</h1>
            <p className="text-[10px] text-on-surface-variant font-medium">Premium Chat</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${activeNav === item.id ? 'text-primary font-semibold bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: activeNav === item.id ? "'FILL' 1" : "'FILL' 0" }}>{item.icon}</span>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User card at bottom */}
        <div className="mt-auto p-3 bg-surface-container rounded-xl flex items-center gap-3">
          <div className="relative cursor-pointer" onClick={() => fileRef.current?.click()}>
            {uploadingPic ? (
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <UserAvatar name={user?.display_name} pic={profilePic} size={40} />
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-[9px] text-primary">photo_camera</span>
                </div>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate text-slate-900">{user?.display_name}</p>
            <p className="text-xs text-on-surface-variant truncate">Premium Member</p>
          </div>
          <button onClick={onClose} title="Back to Chat" className="p-1 text-slate-400 hover:text-primary transition-colors rounded-lg hover:bg-white">
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </aside>

      {/* ─── Main ─────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top Nav Bar */}
        <header className="h-16 flex-shrink-0 bg-white/80 backdrop-blur-xl flex justify-between items-center px-8 border-b border-slate-100 z-10">
          <div className="flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 w-80">
            <span className="material-symbols-outlined text-outline text-sm">search</span>
            <input className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-outline outline-none" placeholder="Search conversations..." type="text" />
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <button className="hover:bg-slate-100 transition-all rounded-full p-2 relative">
                <span className="material-symbols-outlined text-slate-500">notifications</span>
                {totalUnread > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              <button className="hover:bg-slate-100 transition-all rounded-full p-2">
                <span className="material-symbols-outlined text-slate-500">history</span>
              </button>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500">Dashboard</span>
              <UserAvatar name={user?.display_name} pic={profilePic} size={32} />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="pt-8 pb-12 px-10 max-w-7xl mx-auto space-y-10">

            {/* ── Welcome Banner ─────────────────────────────────── */}
            <section className="relative overflow-hidden rounded-[2rem] bg-white p-10" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.06)' }}>
              <div className="absolute top-[-20%] right-[-10%] w-96 h-96 rounded-full blur-[80px]" style={{ background: 'rgba(108,159,255,0.15)' }} />
              <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 rounded-full blur-[60px]" style={{ background: 'rgba(111,251,133,0.08)' }} />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
                    Welcome back, <span style={{ background:'linear-gradient(135deg,#0058bb,#6c9fff)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{user?.display_name?.split(' ')[0]}</span>
                  </h2>
                  <p className="text-lg text-on-surface-variant">
                    {totalUnread > 0
                      ? <>You have <span className="text-primary font-bold">{totalUnread} unread message{totalUnread!==1?'s':''}</span> across your conversations.</>
                      : "You're all caught up! No unread messages."}
                  </p>
                </div>
                <button onClick={onClose} className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-semibold text-sm shadow-lg shadow-primary/25 hover:opacity-90 transition-all active:scale-95">
                  <span className="material-symbols-outlined text-lg">chat</span>
                  Go to Chat
                </button>
              </div>
            </section>

            {/* ── Stats Grid ─────────────────────────────────────── */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Active Chats */}
              <div className="bg-white p-6 rounded-2xl border border-transparent hover:border-primary/10 transition-all" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.05)' }}>
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 rounded-lg text-primary material-symbols-outlined" style={{ background: 'rgba(108,159,255,0.15)' }}>forum</span>
                  <span className="text-[#006a26] text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(111,251,133,0.2)' }}>
                    <span className="material-symbols-outlined text-xs">trending_up</span>+{activeChatCount}
                  </span>
                </div>
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Active Chats</p>
                <h3 className="text-3xl font-extrabold text-on-surface">{activeChatCount}</h3>
              </div>

              {/* Total Sent */}
              <div className="bg-white p-6 rounded-2xl border border-transparent hover:border-primary/10 transition-all" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.05)' }}>
                <div className="mb-4">
                  <span className="p-2 rounded-lg text-secondary material-symbols-outlined" style={{ background: 'rgba(198,207,255,0.3)' }}>send</span>
                </div>
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Total Sent</p>
                <h3 className="text-3xl font-extrabold text-on-surface">{totalSent.toLocaleString()}</h3>
              </div>

              {/* Friends / Favorites */}
              <div className="bg-white p-6 rounded-2xl border border-transparent hover:border-primary/10 transition-all" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.05)' }}>
                <div className="mb-4">
                  <span className="p-2 rounded-lg text-[#006a26] material-symbols-outlined" style={{ background: 'rgba(111,251,133,0.2)' }}>star</span>
                </div>
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Friends</p>
                {friends.length > 0 ? (
                  <div className="flex -space-x-3">
                    {friends.slice(0, 3).map(f => (
                      <div key={f.display_name} className="ring-2 ring-white rounded-full">
                        <UserAvatar name={f.display_name} pic={f.profile_pic_url} size={38} />
                      </div>
                    ))}
                    {friends.length > 3 && (
                      <div className="w-[38px] h-[38px] rounded-full ring-2 ring-white bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">+{friends.length - 3}</div>
                    )}
                  </div>
                ) : (
                  <p className="text-2xl font-extrabold text-on-surface">0</p>
                )}
              </div>

              {/* Cloud Storage */}
              <div className="bg-white p-6 rounded-2xl border border-transparent hover:border-primary/10 transition-all" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.05)' }}>
                <div className="flex justify-between items-start mb-4">
                  <span className="p-2 rounded-lg text-on-surface-variant material-symbols-outlined" style={{ background: 'rgba(90,91,96,0.08)' }}>cloud</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">5% USED</span>
                </div>
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Cloud Storage</p>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-2">
                  <div className="bg-primary h-full rounded-full transition-all" style={{ width: '5%' }} />
                </div>
                <p className="text-xs font-medium text-on-surface-variant">0.5 GB / 10 GB</p>
              </div>
            </section>

            {/* ── Main Workspace ─────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

              {/* Recent Activity */}
              <section className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xl font-bold text-on-surface">Recent Activity</h3>
                  <button onClick={onClose} className="text-primary text-sm font-semibold hover:underline">View All</button>
                </div>
                <div className="space-y-4">
                  {recentActivity.length === 0 && (
                    <div className="bg-white p-8 rounded-2xl text-center" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.05)' }}>
                      <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">inbox</span>
                      <p className="text-sm text-on-surface-variant">No recent activity. Start chatting!</p>
                    </div>
                  )}
                  {recentActivity.map((msg, i) => (
                    <div key={i} className="bg-white p-5 rounded-2xl flex gap-4 items-center group hover:bg-slate-50 transition-colors cursor-pointer" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.04)' }}
                      onClick={onClose}>
                      <div className="relative flex-shrink-0">
                        <UserAvatar name={msg.username || '?'} size={48} />
                        <div className="absolute -bottom-1 -right-1 bg-white p-0.5 rounded-full shadow-sm">
                          <span className="material-symbols-outlined text-[11px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {msg.type === 'image' ? 'image' : msg.type === 'file' ? 'attach_file' : 'chat_bubble'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface">
                          {msg.username} <span className="font-normal text-on-surface-variant">
                            {msg.type === 'image' ? 'sent a photo' : msg.type === 'file' ? 'sent a file' : 'sent a message'}
                          </span>
                        </p>
                        {msg.type === 'text' && <p className="text-xs text-on-surface-variant truncate mt-0.5">{msg.content}</p>}
                        <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-1">{timeAgo(msg.timestamp)}</p>
                      </div>
                      <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Quick Actions + Promo */}
              <section className="space-y-6">
                <h3 className="text-xl font-bold text-on-surface px-1">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={()=>{ onClose?.(); onStartChat?.(); }}
                    className="bg-primary text-white p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 hover:opacity-90" style={{ boxShadow: '0 8px 24px rgba(0,88,187,0.25)' }}>
                    <span className="material-symbols-outlined text-3xl">add_comment</span>
                    <span className="text-xs font-bold text-center leading-tight">Start New Chat</span>
                  </button>

                  <button onClick={()=>{ onClose?.(); onCreateGroup?.(); }}
                    className="bg-white text-on-surface p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 border border-transparent hover:border-primary/20" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.05)' }}>
                    <span className="material-symbols-outlined text-3xl text-primary">groups</span>
                    <span className="text-xs font-bold text-center leading-tight">Create Group</span>
                  </button>

                  <button className="bg-white text-on-surface p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 border border-transparent hover:border-primary/20" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.05)' }}>
                    <span className="material-symbols-outlined text-3xl text-secondary">archive</span>
                    <span className="text-xs font-bold text-center leading-tight">View Archives</span>
                  </button>

                  <button onClick={() => setActiveNav('profile')}
                    className="bg-white text-on-surface p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all active:scale-95 border border-transparent hover:border-primary/20" style={{ boxShadow: '0 8px 32px 0 rgba(0,88,187,0.05)' }}>
                    <span className="material-symbols-outlined text-3xl text-[#006a26]">manage_accounts</span>
                    <span className="text-xs font-bold text-center leading-tight">Profile Settings</span>
                  </button>
                </div>

                {/* Promo Card */}
                <div className="p-6 rounded-3xl relative overflow-hidden border border-white/60" style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', boxShadow: '0 12px 40px rgba(0,88,187,0.10)' }}>
                  <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-xl" style={{ background: 'rgba(108,159,255,0.3)' }} />
                  <h4 className="text-lg font-bold text-on-surface mb-2">Go Professional</h4>
                  <p className="text-xs text-on-surface-variant leading-relaxed mb-4">Unlock unlimited cloud storage and AI-powered message summaries.</p>
                  <button className="w-full py-2.5 rounded-xl bg-on-surface text-white text-xs font-bold hover:opacity-90 transition-opacity">Upgrade Now</button>
                </div>
              </section>
            </div>

          </div>
        </div>
      </main>

      {/* Floating Compose Button */}
      <button onClick={()=>{ onClose?.(); onStartChat?.(); }}
        className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center transition-all active:scale-90 hover:scale-105 hover:opacity-90 z-50" style={{ boxShadow: '0 8px 32px rgba(0,88,187,0.35)' }}>
        <span className="material-symbols-outlined text-2xl">edit</span>
      </button>
    </div>
  );
}
