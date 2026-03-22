import { useState, useEffect, useRef } from 'react';
import EmojiPicker from 'emoji-picker-react';

export default function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const ws = useRef(null);
  const messagesEndRef = useRef(null);
  
  const clientId = useRef(Math.floor(Math.random() * 10000).toString());

  useEffect(() => {
    ws.current = new WebSocket(`ws://localhost:8000/ws/${clientId.current}`);
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };

    return () => {
      if(ws.current) ws.current.close();
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (inputMessage.trim() && ws.current) {
      ws.current.send(inputMessage);
      setInputMessage("");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("client_id", clientId.current);

    try {
      await fetch("http://localhost:8000/upload/", {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      console.error("File upload failed:", error);
    }
  };

  return (
    <div className="bg-surface text-on-surface flex h-screen overflow-hidden selection:bg-primary-container selection:text-on-primary-container font-Inter">
      <aside className="hidden md:flex flex-col h-full border-r-0 p-4 gap-y-2 bg-[#f0f0f6] dark:bg-[#1a1c1e] w-[30%] max-w-[400px] rounded-r-none font-Inter text-base leading-relaxed">
        <div className="flex items-center justify-between px-4 mb-6">
          <h1 className="text-lg font-black text-[#2d2f33] dark:text-white">Conversations</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Active Now</span>
            <div className="w-2 h-2 rounded-full bg-tertiary"></div>
          </div>
        </div>

        <div className="px-4 mb-6">
          <div className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-outline text-sm">search</span>
            </div>
            <input
              className="w-full bg-surface-container border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
              placeholder="Search contacts..."
              type="text"
            />
          </div>
        </div>

        <nav className="flex flex-col gap-y-1 flex-1 overflow-y-auto hide-scrollbar">
          <a className="bg-white dark:bg-[#2d2f33] text-[#007AFF] dark:text-[#4b8eff] shadow-sm rounded-xl px-4 py-3 flex items-center gap-4 transition-transform active:translate-x-1" href="#">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>chat</span>
            <span className="font-medium">All Chats</span>
          </a>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col relative bg-surface">
        <header className="flex justify-between items-center w-full px-6 py-4 max-w-full bg-[#f6f6fb] dark:bg-[#0c0e12] font-Inter antialiased text-sm border-none z-10 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-primary text-white font-bold">
                GC
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-tertiary border-2 border-surface rounded-full"></div>
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-[#2d2f33] dark:text-slate-100">Global Chat Room</h2>
              <p className="text-[10px] uppercase font-extrabold tracking-widest text-tertiary">Online</p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 hide-scrollbar">
          <div className="flex justify-center my-10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/40 bg-surface-container-low px-4 py-1 rounded-full">Welcome to Chitchat</span>
          </div>

          {messages.map((msg, index) => {
            const isMe = msg.username === clientId.current;

            return (
              <div key={index} className={`flex ${isMe ? 'flex-col items-end gap-1 ml-auto' : 'gap-4'} max-w-[85%] md:max-w-[70%]`}>
                {!isMe && (
                  <div className="flex-shrink-0 mt-auto">
                    <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-xs font-bold uppercase">
                      {msg.username.slice(0, 2)}
                    </div>
                  </div>
                )}
                <div className={isMe ? '' : 'space-y-1'}>
                  <div className={`p-4 rounded-xl shadow-sm leading-relaxed ${isMe ? 'bg-gradient-to-br from-primary to-primary-dim text-on-primary rounded-br-sm shadow-md shadow-primary/10 font-medium' : 'bg-surface-container-highest text-on-surface rounded-bl-sm'}`}>
                    {msg.type === "text" && <p>{msg.content}</p>}
                    {msg.type === "image" && (
                      <div className="flex flex-col gap-2">
                        <img src={`http://localhost:8000${msg.file_url}`} alt="upload" className="max-w-[200px] rounded-lg" />
                        <span className="text-xs opacity-70">{msg.content}</span>
                      </div>
                    )}
                    {msg.type === "file" && (
                      <a href={`http://localhost:8000${msg.file_url}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-200">
                        📄 {msg.content}
                      </a>
                    )}
                  </div>
                  <span className={`block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 ${isMe ? 'mr-1' : 'ml-1'}`}>
                     User {msg.username} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 md:p-8 bg-gradient-to-t from-surface to-surface/0">
          <div className="max-w-4xl mx-auto">
            <div className="bg-surface-container-lowest rounded-full p-2 pl-6 shadow-xl shadow-on-surface/5 flex items-center gap-2 border border-outline-variant/10 focus-within:border-primary/30 transition-all">
              <div className="relative">
                <button 
                  className="text-outline hover:text-primary transition-colors flex items-center justify-center p-1"
                  onClick={() => setShowEmojiPicker(prev => !prev)}
                >
                  <span className="material-symbols-outlined">mood</span>
                </button>
                {showEmojiPicker && (
                  <div className="absolute bottom-full left-0 mb-4 z-50 shadow-2xl rounded-xl">
                    <EmojiPicker 
                      onEmojiClick={(emojiObject) => setInputMessage(prev => prev + emojiObject.emoji)}
                      theme="auto"
                    />
                  </div>
                )}
              </div>
              <input
                className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface text-sm py-3 font-medium placeholder:text-outline/60 outline-none"
                placeholder="Type a message..."
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <div className="flex items-center gap-1 pr-1">
                <label className="p-2 text-outline hover:text-primary transition-colors cursor-pointer">
                  <span className="material-symbols-outlined">attach_file</span>
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <button onClick={sendMessage} className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 active:scale-90 transition-all">
                  <span className="material-symbols-outlined text-sm" style={{fontVariationSettings: "'FILL' 1"}}>send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}