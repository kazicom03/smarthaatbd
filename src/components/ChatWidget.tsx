import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, doc, setDoc, updateDoc, addDoc, onSnapshot, query, orderBy, getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/authContext';
import { ChatSession, ChatMessage } from '../types';
import { 
  MessageCircle, X, Send, User, Loader2, Phone, PhoneCall, 
  HelpCircle, Sparkles, Clock, Headphones, ChevronRight, MessageSquare 
} from 'lucide-react';

export default function ChatWidget() {
  const { profile } = useAuth();
  
  // Track Guest info from LocalStorage
  const [guestId, setGuestId] = useState('');
  const [guestName, setGuestName] = useState('');

  // UI state
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load or generate Guest details on mount
  useEffect(() => {
    let gid = localStorage.getItem('smarthaat_guest_id');
    let gname = localStorage.getItem('smarthaat_guest_name');
    if (!gid) {
      gid = `guest_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('smarthaat_guest_id', gid);
    }
    if (!gname) {
      gname = `Guest #${Math.floor(1000 + Math.random() * 9000)}`;
      localStorage.setItem('smarthaat_guest_name', gname);
    }
    setGuestId(gid);
    setGuestName(gname);
  }, []);

  // Compute active user credentials dynamically
  const activeUserId = profile?.uid || guestId;
  const activeUserName = profile?.name || guestName || 'Customer';
  const activeUserPhone = profile?.phone || '';
  const isGuestMode = !profile;

  // 1. Live listener for the chat session and its sub-collection of messages
  useEffect(() => {
    if (!activeUserId) return;

    const sessionRef = doc(db, 'chat_sessions', activeUserId);
    
    // Listen to session state (to catch unread updates)
    const unsubSession = onSnapshot(sessionRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data() as ChatSession;
        setSession(data);
        
        // If the window is open and user has unread messages, immediately mark them as read
        if (isOpen && data.unreadByCustomer) {
          updateDoc(sessionRef, { unreadByCustomer: false }).catch((err) => {
            console.error('Failed to mark read:', err);
          });
        }
      } else {
        setSession(null);
      }
    }, (error) => {
      // Gracefully catch and log permission errors without crashing the app
      console.warn('Session query error or permission restriction:', error);
    });

    // Listen to individual messages
    const messagesQuery = query(
      collection(db, 'chat_sessions', activeUserId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    setIsListening(true);
    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((snapDoc) => {
        list.push({ id: snapDoc.id, ...snapDoc.data() } as ChatMessage);
      });
      setMessages(list);
      setIsListening(false);
    }, (error) => {
      setIsListening(false);
      try {
        handleFirestoreError(error, OperationType.LIST, `chat_sessions/${activeUserId}/messages`);
      } catch (err) {
        console.warn('Silent caught chat list error:', err);
      }
    });

    return () => {
      unsubSession();
      unsubMessages();
    };
  }, [activeUserId, isOpen]);

  // Handle auto-scroll to latest message on message stack change
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen]);

  // Handle Send Message Action
  const handleSendMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textMsg = customMsg ? customMsg.trim() : inputText.trim();
    if (!textMsg || !activeUserId || isSending) return;

    setIsSending(true);
    if (!customMsg) setInputText('');

    const sessionRef = doc(db, 'chat_sessions', activeUserId);
    const timestamp = Date.now();

    try {
      // Determine guest weekly expiration
      let expireAt: Date | null = null;
      if (isGuestMode) {
        //expireAt is set to Current Time + 7 days
        expireAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      // 1. Ensure the parent session document exists
      const sessionData: Partial<ChatSession> = {
        customerId: activeUserId,
        customerName: activeUserName,
        customerPhone: activeUserPhone,
        lastMessage: textMsg,
        lastActive: timestamp,
        unreadByAdmin: true,
        unreadByCustomer: false,
        isGuest: isGuestMode
      };

      if (expireAt) {
        sessionData.expireAt = expireAt;
      }

      await setDoc(sessionRef, sessionData, { merge: true });

      // 2. Add message to messages sub-collection
      const msgId = `msg_${Date.now()}_Customer`;
      const msgRef = doc(db, 'chat_sessions', activeUserId, 'messages', msgId);
      
      const newMsg: ChatMessage = {
        id: msgId,
        senderId: activeUserId,
        text: textMsg,
        timestamp: timestamp
      };

      await setDoc(msgRef, newMsg);

    } catch (error) {
      console.error('Failed to send text:', error);
      try {
        handleFirestoreError(error, OperationType.WRITE, `chat_sessions/${activeUserId}`);
      } catch (err) {
        alert('মেসেজটি পাঠানো সম্ভব হয়নি। অনুগ্রহ করে ইন্টারনেট কানেকশন চেক করুন।');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {/* 1. Floating Action Toggle Button */}
      <button
        id="chat-widget-toggle"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 w-16 h-16 bg-slate-900 hover:bg-slate-800 text-white rounded-full flex items-center justify-center cursor-pointer shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 ring-4 ring-slate-900/15"
        title="সাপোর্ট এজেন্টের সাথে সরাসরি চ্যাট করুন"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-slate-100" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <MessageCircle className="w-7 h-7 text-slate-100 animate-[pulse_2s_infinite]" />
              
              {/* Highlight red indicator if some unread admin messages exist */}
              {session?.unreadByCustomer && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-bounce shadow-md" />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* 2. Premium Support Hub / Help Desk Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="chat-window-container"
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 z-40 w-[350px] sm:w-[390px] h-[520px] sm:h-[580px] bg-white rounded-3xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden font-sans select-none"
          >
            {/* 2.1 Premium Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-5 flex flex-col gap-4 border-b border-slate-800/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Glowing representative image avatar */}
                  <div className="relative">
                    <div className="w-11 h-11 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-md ring-2 ring-slate-800">
                      <Headphones className="w-5 h-5 text-white animate-pulse" />
                    </div>
                    {/* Live green dot badge */}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black tracking-tight flex items-center gap-1">
                      <span>তানজিলা আক্তার</span>
                      <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
                    </h3>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">কাস্টমার সাকসেস টিম</p>
                  </div>
                </div>

                {/* Close Button */}
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Status information banner & direct phone shortcut */}
              <div className="flex items-center justify-between gap-1 text-[11px] bg-slate-800/50 rounded-2xl p-3 border border-slate-700/20">
                <div className="flex items-center gap-1.5 text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>উত্তর দেবে: <strong>৫ মিনিটে</strong></span>
                </div>
                
                {/* Direct quick call anchor */}
                <a 
                  href="tel:+8801700000000"
                  className="flex items-center gap-1 text-blue-400 font-bold hover:text-blue-300 transition-colors uppercase tracking-wider text-[10px]"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>সরাসরি কল দিন</span>
                </a>
              </div>
            </div>

            {/* 2.2 Chat Scroll Area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-slate-50/50">
              
              {/* Session information indicator */}
              <div className="text-center py-2.5 bg-white border border-slate-100 rounded-2xl p-3 shadow-3xs">
                <span className="text-[9px] bg-slate-900 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-widest">
                  {isGuestMode ? 'সরাসরি লাইভ চ্যাট' : 'সদস্য লাইভ সাপোর্ট'}
                </span>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  {isGuestMode 
                    ? `ভিজিটর কোড: ${activeUserName} (১ সপ্তাহ চ্যাট হিস্ট্রি স্টোর থাকবে)`
                    : `সদস্য নাম: ${activeUserName}`
                  }
                </p>
              </div>

              {/* Official Welcome Message */}
              <div className="flex items-start gap-2.5 max-w-[90%]">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-slate-850">
                  সাপোর্ট
                </div>
                <div className="bg-white border border-slate-200/60 text-slate-800 text-xs py-3 px-4 rounded-3xl rounded-tl-none shadow-3xs leading-relaxed">
                  <p className="font-extrabold text-slate-900 mb-1">আসসালামু আলাইকুম! 👋</p>
                  Smarthaatbd সাপোর্ট সেন্টারে আপনাকে স্বাগতম। পেমেন্ট প্রসেসিং, কাস্টম আর্ডার, বুকিং স্ট্যাটাস অথবা যেকোনো জিজ্ঞাসা থাকলে নিচে জানান। আমাদের টিম দ্রুত রিপ্লাই দেবে বা সরাসরি কল করবে।
                </div>
              </div>

              {/* Custom message bubble renderer */}
              {messages.map((msg) => {
                const isAdminMsg = msg.senderId === 'admin';
                return (
                  <div 
                    key={msg.id}
                    className={`flex items-start gap-2 max-w-[90%] ${isAdminMsg ? '' : 'ml-auto flex-row-reverse'}`}
                  >
                    <div className={`h-8 px-2.5 rounded-xl flex items-center justify-center font-bold text-[10px] sm:text-xs shrink-0 shadow-2xs whitespace-nowrap ${
                      isAdminMsg 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' 
                        : 'bg-slate-900 border border-slate-850 text-slate-100'
                    }`}>
                      {isAdminMsg ? 'সাপোর্ট' : activeUserName.split(' ')[0]}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <div className={`text-xs py-3 px-4 rounded-3xl shadow-3xs leading-relaxed ${
                        isAdminMsg 
                          ? 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none' 
                          : 'bg-slate-900 border border-slate-850 text-white rounded-tr-none'
                      }`}>
                        {msg.text}
                      </div>
                      <span className={`block text-[9px] text-slate-400 px-1.5 font-mono ${isAdminMsg ? 'text-left' : 'text-right'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              <div ref={messagesEndRef} />
            </div>

            {/* 2.3 Interactive Quick FAQ Chips Section */}
            <div className="px-4 py-2 bg-slate-50/75 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>হেল্প ডেক্স ইনস্ট্যান্ট প্রশ্নসমূহ:</span>
              </span>
              <div className="flex flex-wrap gap-1.5 pb-1">
                {[
                  { emoji: "📦", text: "আমার অর্ডারটি এখন কোথায় আছে?" },
                  { emoji: "💳", text: "ডেলিভারি চার্জ ও ঢাকার বাইরের নিয়ম কী?" },
                  { emoji: "🚀", text: "নগদ বা বিকাশে কীভাবে পেমেন্ট করব?" },
                  { emoji: "📞", text: "হেল্পলাইনে কথা বলতে চাই" }
                ].map((chip) => (
                  <button
                    key={chip.text}
                    type="button"
                    onClick={() => handleSendMessage(undefined, `${chip.emoji} ${chip.text}`)}
                    className="bg-white hover:bg-slate-100 active:scale-97 border border-slate-200 text-slate-700 text-[10px] md:text-[11px] font-bold py-1.5 px-3 rounded-full cursor-pointer shadow-3xs transition-all duration-150 flex items-center gap-1.5 hover:text-blue-600 hover:border-blue-400"
                  >
                    <span>{chip.emoji}</span>
                    <span>{chip.text}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* 2.4 Message input footer form */}
            <form 
              onSubmit={(e) => handleSendMessage(e)}
              className="p-3.5 border-t border-slate-100 bg-white flex items-center gap-2"
            >
              <input 
                id="chat-message-input"
                type="text"
                required
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="মেসেজ বা অভিযোগ লিখুন..."
                disabled={isSending}
                className="flex-grow border border-slate-200 rounded-2xl px-4 py-3 text-xs outline-none focus:border-slate-800 bg-slate-50 focus:bg-white transition-all focus:ring-4 focus:ring-slate-900/5 placeholder-slate-450 leading-normal"
              />
              <button 
                id="chat-send-btn"
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="p-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-2xl transition-all flex items-center justify-center cursor-pointer shrink-0 active:scale-95 shadow-md hover:shadow-lg"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
