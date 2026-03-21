import React, { useState, useRef, useEffect } from 'react';

const API = 'http://localhost:8000';

export default function Dashboard({ user, messages, activeChatsCount, onClose, onUpdateUser }) {
  const [profilePic, setProfilePic] = useState(user.profile_pic_url);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('username', user.display_name);
    fd.append('is_profile_pic', 'true');
    try {
      const res = await fetch(`${API}/upload/`, { method: 'POST', body: fd });
      const data = await res.json();
      if (res.ok) {
        setProfilePic(data.profile_pic_url);
        // update local user object
        const local = JSON.parse(localStorage.getItem('chitchat_user') || '{}');
        local.profile_pic_url = data.profile_pic_url;
        localStorage.setItem('chitchat_user', JSON.stringify(local));
        if (onUpdateUser) onUpdateUser(local);
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
  };

  const totalSent = Object.values(messages).flat().filter(m => m.username === user.display_name).length;

  return (
    <div className="flex-1 flex flex-col relative overflow-y-auto bg-surface-bright pb-12">
      {/* TopNavBar */}
      <header className="sticky top-0 right-0 h-16 z-40 bg-white/80 backdrop-blur-xl flex justify-between items-center px-8 w-full border-b border-outline-variant/10">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="hover:bg-slate-100 p-2 rounded-full transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">arrow_back</span>
            <span className="text-sm font-semibold text-on-surface-variant">Back to Chat</span>
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="h-8 w-[1px] bg-outline-variant/20"></div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-500">Dashboard</span>
            {profilePic ? (
              <img src={`${API}${profilePic}`} className="w-8 h-8 rounded-full object-cover shadow-sm" alt="Me" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs">{user.display_name[0].toUpperCase()}</div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-8 px-10 max-w-7xl mx-auto space-y-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Welcome Banner */}
        <section className="relative overflow-hidden rounded-[2rem] bg-surface-container-lowest p-10 shadow-[0_8px_32px_0_rgba(0,88,187,0.04)]">
          <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-primary-container/20 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-64 h-64 bg-tertiary-container/10 rounded-full blur-[60px]"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">Welcome back, {user.display_name.split(' ')[0]}</h2>
              <p className="text-lg text-on-surface-variant flex items-center gap-2">
                Manage your account and view your statistics.
              </p>
            </div>
            {/* Avatar Upload area */}
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10">
               <div className="relative w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-surface-container">
                  {profilePic ? (
                    <img src={`${API}${profilePic}`} alt="Profile" className="w-full h-full object-cover"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-3xl font-bold uppercase">{user.display_name[0]}</div>
                  )}
                  {uploading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                       <span className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin"/>
                    </div>
                  )}
               </div>
               <div>
                  <h3 className="font-bold text-on-surface mb-1">Profile Photo</h3>
                  <button onClick={() => fileRef.current?.click()} className="text-xs py-1.5 px-3 bg-primary/10 text-primary hover:bg-primary/20 transition-colors rounded-lg font-semibold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">cloud_upload</span> Upload new
                  </button>
                  <input type="file" className="hidden" ref={fileRef} accept="image/*" onChange={handleUpload}/>
               </div>
            </div>
          </div>
        </section>

        {/* Statistics Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_0_rgba(0,88,187,0.04)] border border-transparent hover:border-primary-container/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="p-2 bg-primary-container/20 rounded-lg text-primary material-symbols-outlined">forum</span>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Active Chats</p>
            <h3 className="text-3xl font-extrabold text-on-surface">{activeChatsCount}</h3>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_0_rgba(0,88,187,0.04)] border border-transparent hover:border-primary-container/20 transition-all">
            <div className="mb-4">
              <span className="p-2 bg-secondary-container/20 rounded-lg text-secondary material-symbols-outlined">send</span>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Total Sent</p>
            <h3 className="text-3xl font-extrabold text-on-surface">{totalSent}</h3>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_0_rgba(0,88,187,0.04)] border border-transparent hover:border-primary-container/20 transition-all">
            <div className="mb-4">
              <span className="p-2 bg-on-surface-variant/10 rounded-lg text-on-surface-variant material-symbols-outlined">cloud</span>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Cloud Storage</p>
            <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mb-2">
              <div className="bg-primary h-full rounded-full" style={{ width: '5%' }}></div>
            </div>
            <p className="text-xs font-medium text-on-surface-variant">0.5 GB / 10 GB</p>
          </div>
          
          <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-[0_8px_32px_0_rgba(0,88,187,0.04)] border border-transparent hover:border-primary-container/20 transition-all">
            <div className="mb-4">
              <span className="p-2 bg-tertiary-container/20 rounded-lg text-tertiary material-symbols-outlined">security</span>
            </div>
            <p className="text-[11px] uppercase tracking-widest text-on-surface-variant font-bold mb-2">Account Status</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary/10 text-tertiary text-xs font-bold border border-tertiary/20">
               <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" /> Protected
            </div>
          </div>
        </section>

        {/* Pro Promo Card */}
        <div className="glass-panel p-6 rounded-3xl relative overflow-hidden ring-1 ring-primary/20 shadow-xl bg-gradient-to-br from-white/60 to-white/30 backdrop-blur-md">
          <div className="absolute -top-4 -right-4 w-32 h-32 bg-primary-container/30 rounded-full blur-2xl"></div>
          <h4 className="text-lg font-bold text-on-surface mb-2">Chitchat Premium</h4>
          <p className="text-sm text-on-surface-variant leading-relaxed mb-4 max-w-md">Unlock unlimited cloud storage, high definition file uploads, AI-powered summaries, and exclusive profile badges.</p>
          <button className="px-6 py-2.5 rounded-xl bg-on-surface text-surface-container-lowest text-xs font-bold hover:opacity-90 transition-opacity">Upgrade Now</button>
        </div>

      </div>
    </div>
  );
}
