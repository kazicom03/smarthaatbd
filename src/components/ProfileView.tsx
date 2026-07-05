import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../lib/authContext';
import { 
  User, ShieldCheck, MapPin, Truck, Award, Edit3, Save, 
  CheckCircle2, LogIn, LogOut, Mail, Phone, Lock, UserPlus, Loader2, Eye, EyeOff, ClipboardList, Camera 
} from 'lucide-react';
import MyOrdersView from './MyOrdersView';

interface ProfileViewProps {
  initialSubView?: 'account' | 'orders';
  initialPhone?: string;
}

export default function ProfileView({ initialSubView = 'account', initialPhone = '' }: ProfileViewProps) {
  const { profile, loading, signUp, signIn, logOut, updateProfileData } = useAuth();
  
  // profile menu routing state: 'account' or 'orders'
  const [activeSubView, setActiveSubView] = useState<'account' | 'orders'>(initialSubView);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isEditing, setIsEditing] = useState(false);
  
  // Profile settings input fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('অনুগ্রহ করে শুধুমাত্র ছবি (JPG, PNG, WebP) আপলোড করুন!');
      return;
    }

    const maxSize = 1 * 1024 * 1024; // 1MB limit
    if (file.size > maxSize) {
      setUploadError('ফাইলের সাইজ অনেক বড়! অনুগ্রহ করে ১ মেগাবাইট বা তার চেয়ে ছোট ছবি নির্বাচন করুন।');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoURL(reader.result);
      }
    };
    reader.onerror = () => {
      setUploadError('ছবি আপলোড করতে সমস্যা হয়েছে, দয়া করে আবার চেষ্টা করুন।');
    };
    reader.readAsDataURL(file);
  };

  // Login form inputs
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration form inputs
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');

  // Password visibility triggers
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Loading indicator for auth actions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  // Track redirects or updates
  useEffect(() => {
    if (initialSubView) {
      setActiveSubView(initialSubView);
    }
  }, [initialSubView]);

  // Sync editing fields with loaded profile
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setPhotoURL(profile.photoURL || '');
    }
  }, [profile]);

  // Handle Login Submit
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    const identifier = loginIdentifier.trim();
    const password = loginPassword.trim();

    if (!identifier || !password) {
      setAuthError('দয়া করে আইডি এবং পাসওয়ার্ড সম্পূর্ণ লিখুন।');
      setIsSubmitting(false);
      return;
    }

    try {
      await signIn(identifier, password);
      setLoginIdentifier('');
      setLoginPassword('');
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
      setActiveSubView('account'); // Auto switch to account view on login success
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('auth/invalid-credential') || err.message?.includes('auth/user-not-found') || err.message?.includes('auth/wrong-password')) {
        setAuthError('মোবাইল/জিমেইল অথবা পাসওয়ার্ড ভুল হয়েছে। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।');
      } else {
        setAuthError(err.message || 'লগইন প্রসেস করার সময় কোনো ভুল হয়েছে।');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSubmitting(true);

    const formattedName = regName.trim();
    const formattedPhone = regPhone.trim();
    const formattedEmail = regEmail.trim().toLowerCase();
    const formattedAddress = regAddress.trim();
    const formattedPassword = regPassword.trim();

    if (!formattedName || !formattedPhone || !formattedEmail || !formattedPassword) {
      setAuthError('স্টার চিহ্নিত সবগুলো ঘর অবশ্যই পূরণ করতে হবে।');
      setIsSubmitting(false);
      return;
    }

    // Clean and validate Bangladesh phone number
    let cleanedPhone = formattedPhone.replace(/[\s\-\+]/g, '');
    if (cleanedPhone.startsWith('8801')) {
      cleanedPhone = cleanedPhone.substring(2);
    }
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanedPhone)) {
      setAuthError('দয়া করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      setIsSubmitting(false);
      return;
    }

    if (!formattedEmail.includes('@') || !formattedEmail.endsWith('@gmail.com')) {
      setAuthError('দয়া করে একটি সঠিক জিমেইল আইডি দিন (যেমন: example@gmail.com)');
      setIsSubmitting(false);
      return;
    }

    // Optional address length check if provided during register
    if (formattedAddress && formattedAddress.length < 10) {
      setAuthError('ঠিকানাটি অনেক সংক্ষিপ্ত। অনুগ্রহ করে বিস্তারিত ডেলিভারী ঠিকানা লিখুন।');
      setIsSubmitting(false);
      return;
    }

    if (formattedPassword.length < 6) {
      setAuthError('নিরাপত্তার স্বার্থে পাসওয়ার্ডটি কমপক্ষে ৬ অক্ষরের হতে হবে।');
      setIsSubmitting(false);
      return;
    }

    try {
      await signUp(formattedName, formattedEmail, cleanedPhone, formattedAddress, formattedPassword);
      
      // Reset signup fields
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegAddress('');
      setRegPassword('');
      setAuthMode('login');

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('auth/email-already-in-use')) {
        setAuthError('এই জিমেইল আইডি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।');
      } else {
        setAuthError(err.message || 'নিবন্ধন করার সময় সমস্যা হয়েছে। দয়া করে সঠিক তথ্য দিন।');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Edit Profile Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSaving(true);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setAuthError('দয়া করে আপনার পূর্ণ নাম লিখুন।');
      setIsSaving(false);
      return;
    }

    // Clean and validate phone
    let cleanedPhone = phone.trim().replace(/[\s\-\+]/g, '');
    if (cleanedPhone.startsWith('8801')) {
      cleanedPhone = cleanedPhone.substring(2);
    }
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!cleanedPhone) {
      setAuthError('দয়া করে আপনার সচল মোবাইল নম্বর লিখুন।');
      setIsSaving(false);
      return;
    }
    if (!bdPhoneRegex.test(cleanedPhone)) {
      setAuthError('দয়া করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      setIsSaving(false);
      return;
    }

    // Validate empty or short address
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setAuthError('ডেলিভারি সম্পন্ন করার জন্য সম্পূর্ণ ঠিকানা অবশ্যই দিন।');
      setIsSaving(false);
      return;
    }
    if (trimmedAddress.length < 10) {
      setAuthError('ডেলিভারি ঠিকানা অনেক সংক্ষিপ্ত। অনুগ্রহ করে বিস্তারিত ও সঠিক ঠিকানা দিন।');
      setIsSaving(false);
      return;
    }

    try {
      await updateProfileData(trimmedName, cleanedPhone, trimmedAddress, photoURL);
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2500);
    } catch (err: any) {
      console.error('Error saving profile changes:', err);
      setAuthError('তথ্য হালনাগাদ করার সময় সমস্যা হয়েছে।');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logOut();
      setIsEditing(false);
      setActiveSubView('account'); // Reset back to account view upon logout
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 flex flex-col items-center justify-center gap-2">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-sm text-slate-500 font-medium">অ্যাকাউন্ট ভেরিফাই করা হচ্ছে...</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* 1. Sub navigation option panel inside Profile View as requested */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-2 shadow-xs flex flex-wrap gap-2 items-center justify-between font-display">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveSubView('account')}
            className={`py-2.5 px-5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'account'
                ? 'bg-[#0f172a] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{profile ? 'একাউন্ট ম্যানেজ' : 'লগইন / নিবন্ধন'}</span>
          </button>

          <button
            onClick={() => setActiveSubView('orders')}
            className={`py-2.5 px-5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubView === 'orders'
                ? 'bg-[#0f172a] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>মাই অর্ডার</span>
          </button>
        </div>

        {/* Third option: Logout (লগআউট) - only displayed when logged in */}
        {profile && (
          <button
            onClick={handleLogout}
            className="py-2.5 px-5 text-xs sm:text-sm font-bold rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-100 bg-white transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>লগআউট</span>
          </button>
        )}
      </div>

      {/* 2. Subview rendering */}
      {activeSubView === 'orders' ? (
        /* MY ORDERS SUB-VIEW CONTAINER (Renders the beautiful MyOrdersView) */
        <MyOrdersView initialPhone={initialPhone} />
      ) : (
        /* MANAGE ACCOUNT SUB-VIEW CONTAINER */
        <>
          {profile ? (
            /* Logged In Manage Account Screen */
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden transition-all">
              {/* Header premium design panel with subtle glows and grid */}
              <div className="h-44 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] relative overflow-hidden flex items-start justify-end p-5 sm:p-6">
                {/* Glowing abstract blur element */}
                <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute top-1/2 right-1/4 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                
                <div className="relative z-10 flex items-center gap-2 text-white/80 text-xs font-mono bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                  <span>Secure Profile Panel</span>
                </div>
              </div>

              <div className="p-6 sm:p-8 relative">
                {/* Elegant avatar design with dual gradient ring and initials */}
                <div className="relative mx-auto -mt-20 sm:-mt-24 z-10 flex flex-col items-center">
                  <div className="w-28 h-28 bg-gradient-to-tr from-[#f57224] via-orange-500 to-yellow-500 rounded-full p-[3px] shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center border-[3px] border-white overflow-hidden text-white font-extrabold text-2xl tracking-wide font-display">
                      {profile.photoURL ? (
                        <img 
                          src={profile.photoURL} 
                          alt={profile.name || "User Avatar"} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { 
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.name || 'user'}&backgroundColor=c9e4fb`; 
                          }} 
                        />
                      ) : (
                        profile.name ? profile.name.slice(0, 2).toUpperCase() : <User className="w-10 h-10 text-white" />
                      )}
                    </div>
                  </div>
                  
                  {/* Profile designation badge */}
                  <span className="mt-3 bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white text-[10px] font-extrabold px-3.5 py-1.5 rounded-full shadow-md uppercase tracking-wider flex items-center gap-1.5 border border-slate-700/30">
                    <Award className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    <span>গ্রাহক অ্যাকাউন্ট</span>
                  </span>
                </div>

                <div className="text-center mt-4">
                  <h2 className="text-xl sm:text-2xl font-display font-extrabold text-slate-900 tracking-tight">
                    {profile.name || 'সম্মানিত গ্রাহক'}
                  </h2>
                  <p className="text-slate-500 text-xs sm:text-sm mt-1.5 max-w-md mx-auto leading-relaxed font-display">
                    Smarthaatbd Shop এ আপনাকে আন্তরিক স্বাগত। আমরা সবসময় নির্ভরযোগ্য ও সেরা কোয়ালিটির গ্যাজেটস ডেলিভারি করি।
                  </p>
                </div>

                {/* Success flash */}
                {showSuccess && (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 p-3.5 bg-emerald-50 border border-emerald-100/80 text-emerald-800 text-xs rounded-2xl flex items-center gap-2 justify-center font-bold shadow-sm"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>আপনার প্রোফাইল তথ্য সফলভাবে সংরক্ষণ করা হয়েছে!</span>
                  </motion.div>
                )}

                {/* Editing / Viewing Block */}
                <div className="mt-8 pt-8 border-t border-slate-100 max-w-2xl mx-auto">
                  {!isEditing ? (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-1.5 h-4 bg-blue-600 rounded-full" />
                          <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest font-display">বেসিক প্রোফাইল তথ্য</h3>
                        </div>
                        <button 
                          onClick={() => setIsEditing(true)}
                          className="text-xs font-bold text-blue-600 hover:text-white hover:bg-blue-600 px-3.5 py-2 rounded-xl border border-blue-100 hover:border-blue-600 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>তথ্য আপডেট করুন</span>
                        </button>
                      </div>

                      {/* Upgraded grid system */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-display">
                        {/* Name block */}
                        <div className="bg-gradient-to-tr from-white to-slate-50/50 p-4 rounded-2xl border border-slate-200/50 hover:border-slate-300 shadow-xs hover:shadow-2xs transition-all flex items-start gap-3.5 group">
                          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">আপনার নাম</span>
                            <span className="text-slate-800 font-extrabold text-sm sm:text-base block">{profile.name || 'প্রদান করা হয়নি'}</span>
                          </div>
                        </div>

                        {/* Email block */}
                        <div className="bg-gradient-to-tr from-white to-slate-50/50 p-4 rounded-2xl border border-slate-200/50 hover:border-slate-300 shadow-xs hover:shadow-2xs transition-all flex items-start gap-3.5 group">
                          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl group-hover:bg-purple-600 group-hover:text-white transition-all duration-300 shrink-0">
                            <Mail className="w-4 h-4" />
                          </div>
                          <div className="overflow-hidden">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">জিমেইল এড্রেস</span>
                            <span className="text-slate-800 font-extrabold block font-mono text-xs sm:text-sm truncate" title={profile.email}>
                              {profile.email || 'প্রদান করা হয়নি'}
                            </span>
                          </div>
                        </div>

                        {/* Phone block */}
                        <div className="bg-gradient-to-tr from-white to-slate-50/50 p-4 rounded-2xl border border-slate-200/50 hover:border-slate-300 shadow-xs hover:shadow-2xs transition-all flex items-start gap-3.5 group">
                          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                            <Phone className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">মোবাইল নম্বর</span>
                            <span className="text-slate-800 font-extrabold block font-mono text-sm sm:text-base">
                              {profile.phone || 'প্রদান করা হয়নি'}
                            </span>
                          </div>
                        </div>

                        {/* Address block */}
                        <div className="bg-gradient-to-tr from-white to-slate-50/50 p-4 rounded-2xl border border-slate-200/50 hover:border-slate-300 shadow-xs hover:shadow-2xs transition-all flex items-start gap-3.5 sm:col-span-2 group">
                          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-all duration-300 shrink-0">
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block mb-0.5">ডেলিভারী ঠিকানা</span>
                            <span className="text-slate-700 font-bold block leading-relaxed text-xs sm:text-sm">
                              {profile.address || (
                                <span className="text-slate-400/80 italic font-medium">কোনো ঠিকানা প্রদান করা হয়নি। অনুগ্রহ করে তথ্যটি আপডেট করুন।</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSave} className="space-y-5 bg-slate-50/50 p-5 rounded-2xl border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 font-display">
                          <span className="w-1.5 h-3.5 bg-rose-500 rounded-full animate-pulse" />
                          <span>প্রোফাইল তথ্য আপডেট</span>
                        </h3>
                        <button 
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="text-xs text-rose-500 hover:text-rose-700 hover:underline font-bold px-2 py-1 cursor-pointer font-display"
                        >
                          বাতিল করুন
                        </button>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5 font-display">আপনার পূর্ণ নাম</label>
                        <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="যেমন: আসিফ রহমান"
                          className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-display"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-2 font-display">প্রোফাইল ছবি পরিবর্তন করুন (Avatar বা নিজস্ব ছবি)</label>
                        
                        {/* Avatar presets */}
                        <div className="grid grid-cols-6 gap-2.5 mb-4">
                          {[
                            'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophia&backgroundColor=f8d0cd',
                            'https://api.dicebear.com/7.x/avataaars/svg?seed=Jack&backgroundColor=c9e4fb',
                            'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver&backgroundColor=fadcc8',
                            'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara&backgroundColor=c2f0ec&top=hijab',
                            'https://api.dicebear.com/7.x/avataaars/svg?seed=Bella&backgroundColor=e2dcf8',
                            'https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=d0f8e2'
                          ].map((url, idx) => (
                            <button
                              type="button"
                              key={idx}
                              onClick={() => {
                                setPhotoURL(url);
                                setUploadError('');
                              }}
                              className={`w-11 h-11 rounded-full border-2 overflow-hidden cursor-pointer transition-all ${
                                photoURL === url ? 'border-[#f57224] scale-110 shadow-md ring-2 ring-orange-500/10' : 'border-slate-200 hover:border-slate-400'
                              }`}
                            >
                              <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>

                        {/* File upload input & dropzone */}
                        <div className="space-y-2">
                          <input 
                            type="file" 
                            id="avatar-upload"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                          />
                          <label 
                            htmlFor="avatar-upload"
                            className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-[#f57224] bg-white rounded-2xl p-4 cursor-pointer transition-all hover:bg-orange-50/10 group text-center"
                          >
                            <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-orange-100/30 flex items-center justify-center transition-all mb-2">
                              <Camera className="w-5 h-5 text-slate-400 group-hover:text-[#f57224] transition-all" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 font-display">
                              মোবাইল বা কম্পিউটার থেকে ছবি পছন্দ করুন
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 font-display">
                              JPEG, PNG বা WEBP (সর্বোচ্চ ১ মেগাবাইট)
                            </span>
                          </label>

                          {photoURL && !photoURL.startsWith('https://api.dicebear.com') && (
                            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                              <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0">
                                <img src={photoURL} alt="Uploaded preview" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-bold text-slate-700 truncate font-display">আপনার আপলোড করা ছবি</p>
                                <p className="text-[9px] text-emerald-600 font-bold font-display">সফলভাবে নির্বাচিত হয়েছে!</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPhotoURL('')}
                                className="text-xs font-bold text-rose-500 hover:text-rose-700 cursor-pointer px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 transition-all font-display"
                              >
                                মুছুন
                              </button>
                            </div>
                          )}

                          {uploadError && (
                            <p className="text-xs text-rose-500 font-bold mt-1 font-display">
                              ⚠️ {uploadError}
                            </p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5 font-display">জিমেইল এড্রেস</label>
                        <input 
                          type="email" 
                          value={profile.email}
                          disabled
                          className="w-full border border-slate-150 bg-slate-100 text-slate-400 rounded-xl px-3.5 py-2.5 text-sm outline-none cursor-not-allowed font-mono"
                        />
                        <span className="text-[10px] text-slate-400/80 mt-1 block">নিরাপত্তার স্বার্থে ইমেইল পরিবর্তনযোগ্য নয়।</span>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5 font-display">মোবাইল নম্বর <span className="text-rose-500">*</span></label>
                        <input 
                          type="tel" 
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="যেমন: 017XXXXXXXX"
                          className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-slate-500 mb-1.5 font-display">ডেলিভারী ঠিকানা <span className="text-rose-500">*</span></label>
                        <textarea 
                          rows={3}
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="যেমন: বাসা নং, রোড নং, এলাকা এবং জেলা শহর"
                          className="w-full border border-slate-200 bg-white rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all resize-none leading-relaxed font-display"
                        />
                      </div>

                      <button 
                        type="submit"
                        disabled={isSaving}
                        className="w-full bg-[#0f172a] hover:bg-[#1e293b] disabled:bg-slate-450 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md active:scale-[0.99]"
                      >
                        {isSaving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        <span>তথ্য সংরক্ষণ করুন</span>
                      </button>
                    </form>
                  )}
                </div>

                {/* Quick stats badges */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-100 text-center font-display">
                  <div className="bg-gradient-to-b from-white to-slate-50/50 p-4 rounded-2xl border border-slate-200/40 shadow-xs hover:border-blue-200 hover:shadow-xs transition-all flex flex-col items-center group">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl mb-2 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <Truck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">ডেলিভারি এরিয়া</span>
                    <p className="text-xs font-extrabold text-slate-700">সমগ্র বাংলাদেশ</p>
                  </div>

                  <div className="bg-gradient-to-b from-white to-slate-50/50 p-4 rounded-2xl border border-slate-200/40 shadow-xs hover:border-emerald-200 hover:shadow-xs transition-all flex flex-col items-center group">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl mb-2 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">নিরাপত্তা</span>
                    <p className="text-xs font-extrabold text-slate-700">নিরাপদ পেমেন্ট</p>
                  </div>

                  <div className="bg-gradient-to-b from-white to-slate-50/50 p-4 rounded-2xl border border-slate-200/40 shadow-xs hover:border-purple-200 hover:shadow-xs transition-all flex flex-col items-center group">
                    <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl mb-2 group-hover:scale-110 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">অর্ডার ট্র্যাক</span>
                    <p className="text-xs font-extrabold text-slate-700">সহজ মোবাইল সার্চ</p>
                  </div>

                  <div className="bg-gradient-to-b from-white to-slate-50/50 p-4 rounded-2xl border border-slate-200/40 shadow-xs hover:border-rose-200 hover:shadow-xs transition-all flex flex-col items-center group">
                    <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl mb-2 group-hover:scale-110 group-hover:bg-rose-600 group-hover:text-white transition-all duration-300">
                      <Award className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold mb-1">পণ্য মান</span>
                    <p className="text-xs font-extrabold text-slate-700">সেরা কোয়ালিটি</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Logged Out Login/Registration UI Screen */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md max-w-md mx-auto overflow-hidden">
              {/* Accent Header */}
              <div className="p-6 bg-slate-900 text-white text-center relative overflow-hidden font-display">
                <div className="absolute inset-0 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="w-12 h-12 bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-2xl mx-auto flex items-center justify-center mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-display font-extrabold">স্মার্টহাট অ্যাকাউন্ট</h2>
                <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                  {authMode === 'login' 
                    ? 'মোবাইল নম্বর অথবা জিমেইল ইমেইল দিয়ে সহজে লগইন করুন' 
                    : 'আপনার সঠিক তথ্যসমূহ দিয়ে নতুন অ্যাকাউন্ট তৈরি করুন'
                  }
                </p>
              </div>

              {/* Login/Signup Selector tabs internally */}
              <div className="flex border-b border-slate-100 font-display bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 text-center py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    authMode === 'login' 
                      ? 'border-blue-600 text-blue-600 bg-white' 
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  লগইন করুন
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className={`flex-1 text-center py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                    authMode === 'register' 
                      ? 'border-blue-600 text-blue-600 bg-white' 
                      : 'border-transparent text-slate-400 hover:text-slate-700'
                  }`}
                >
                  নতুন অ্যাকাউন্ট
                </button>
              </div>

              <div className="p-6 sm:p-8 space-y-4">
                {/* Feedback message */}
                {authError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-medium leading-relaxed font-display">
                    {authError}
                  </div>
                )}
                
                {showSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs rounded-xl font-medium text-center font-display">
                    সফলভাবে অ্যাকাউন্ট প্রসেস সম্পন্ন হয়েছে!
                  </div>
                )}

                {authMode === 'login' ? (
                  /* --- LOGIN MODE FORM --- */
                  <form onSubmit={handleLoginSubmit} className="space-y-4 font-display">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-500" />
                        <span>মোবাইল নম্বর অথবা জিমেইল</span>
                      </label>
                      <input 
                        type="text"
                        required
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="যেমন: 0162XXXXXXXX বা info@gmail.com"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-blue-500" />
                        <span>পাসওয়ার্ড</span>
                      </label>
                      <div className="relative">
                        <input 
                          type={showLoginPassword ? "text" : "password"}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="পাসওয়ার্ড লিখুন"
                          className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md active:scale-[0.99] mt-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      <span>লগইন করুন</span>
                    </button>
                  </form>
                ) : (
                  /* --- REGISTER MODE FORM --- */
                  <form onSubmit={handleRegisterSubmit} className="space-y-4 font-display">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <User className="w-3 h-3 text-blue-500" />
                        <span>আপনার নাম *</span>
                      </label>
                      <input 
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="যেমন: আসিফ রহমান"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-blue-500" />
                          <span>মোবাইল নম্বর *</span>
                        </label>
                        <input 
                          type="tel"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="যেমন: 017XXXXXXXX"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-blue-500" />
                          <span>জিমেইল ইমেইল *</span>
                        </label>
                        <input 
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="যেমন: username@gmail.com"
                          className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-blue-500" />
                        <span>ডেলিভারী ঠিকানা</span>
                      </label>
                      <textarea 
                        rows={2}
                        value={regAddress}
                        onChange={(e) => setRegAddress(e.target.value)}
                        placeholder="বাসা নং, রোড নং, থানা, জেলা শহর"
                        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-blue-500" />
                        <span>পাসওয়ার্ড *</span>
                      </label>
                      <div className="relative">
                        <input 
                          type={showRegPassword ? "text" : "password"}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="পাসওয়ার্ড নির্ধারণ করুন"
                          className="w-full border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPassword(!showRegPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md active:scale-[0.99] mt-2"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      <span>অ্যাকাউন্ট তৈরি করুন</span>
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
