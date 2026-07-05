import React from 'react';
import { TabType } from '../types';
import { Store, User, Shield, ShoppingCart, HelpCircle, Phone, Truck, RotateCcw, BadgeCheck } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../lib/authContext';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  cartCount: number;
  onCartOpen: () => void;
  contactPhone?: string;
}

export default function Navbar({ activeTab, setActiveTab, cartCount, onCartOpen, contactPhone }: NavbarProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.email === 'kazicom03@gmail.com';

  return (
    <div className="sticky top-0 z-50 flex flex-col w-full">
      {/* Main navigation menu */}
      <nav className="bg-[#111827]/95 border-b border-slate-800/80 text-white shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-1.5 xs:px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-1">
            {/* Logo with high-definition styling */}
            <div 
              id="nav-logo"
              onClick={() => setActiveTab('shop')} 
              className="cursor-pointer shrink-0 transition-transform active:scale-95 duration-200"
            >
              <Logo size="md" variant="dark" className="hidden sm:flex animate-fade-in" />
              <Logo size="sm" variant="dark" showText={true} className="flex sm:hidden animate-fade-in" />
            </div>
            
            {/* Tabs with clean professional lines and blue highlights */}
            <div className="flex items-center gap-1 sm:gap-2.5 text-xs sm:text-sm font-semibold font-display">
              <button 
                id="tab-shop"
                onClick={() => setActiveTab('shop')} 
                className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-305 cursor-pointer ${
                  activeTab === 'shop' 
                    ? 'text-white bg-slate-800/90 border border-slate-700 shadow-[0_4px_14px_rgba(245,114,36,0.18)] ring-1 ring-[#f57224]/30' 
                    : 'text-slate-350 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <Store className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${activeTab === 'shop' ? 'text-[#f57224] scale-110' : 'text-slate-500'}`} />
                <span className="tracking-tight text-[11px] sm:text-sm">শপ</span>
              </button>
              
              <button 
                id="tab-profile"
                onClick={() => setActiveTab('profile')} 
                className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-305 cursor-pointer ${
                  activeTab === 'profile' 
                    ? 'text-white bg-slate-800/90 border border-slate-700 shadow-[0_4px_14px_rgba(245,114,36,0.18)] ring-1 ring-[#f57224]/30' 
                    : 'text-slate-350 hover:text-white hover:bg-slate-800/50 border border-transparent'
                }`}
              >
                <User className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${activeTab === 'profile' ? 'text-[#f57224] scale-110' : 'text-slate-500'}`} />
                <span className="tracking-tight text-[11px] sm:text-sm">প্রোফাইল</span>
              </button>
              
              {/* Elegant Cart Quick Nav indicator tag */}
              <button 
                id="nav-cart-btn"
                onClick={onCartOpen} 
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl bg-slate-800 border border-slate-700/80 hover:bg-slate-700 text-white relative cursor-pointer group transition-all duration-300 hover:border-[#ff6e26]/60 shadow-3xs"
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#ff6e26] group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden leading-none sm:inline mt-0.5 tracking-wide text-xs sm:text-sm">কার্ট</span>
                {cartCount > 0 ? (
                  <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 bg-[#f57224] text-white text-[8px] sm:text-[9px] font-black w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center border border-[#0f172a] font-mono shadow-md animate-pulse">
                    {cartCount}
                  </span>
                ) : null}
              </button>
 
              {isAdmin && (
                <button 
                  id="tab-admin"
                  onClick={() => setActiveTab('admin')} 
                  className={`flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2.5 rounded-lg sm:rounded-xl transition-all duration-305 cursor-pointer ${
                    activeTab === 'admin' 
                      ? 'text-white bg-rose-950/45 border border-rose-800/60 shadow-[0_4px_14px_rgba(244,63,94,0.18)] ring-1 ring-rose-500/20 font-bold' 
                      : 'text-rose-300 hover:text-white hover:bg-rose-950/20 border border-transparent'
                  }`}
                >
                  <Shield className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 ${activeTab === 'admin' ? 'text-rose-400 scale-110' : 'text-rose-300'}`} />
                  <span className="tracking-tight text-[11px] sm:text-sm">অ্যাডমিন</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ========================================== */}
      {/* PICKABOO-STYLE PRE-HEADER TRUST RIBBON */}
      {/* ========================================== */}
      <div className="w-full bg-[#0b0f19] border-b border-slate-800/60 py-1 sm:py-2 text-[9px] sm:text-xs text-slate-300 font-medium select-none">
        <div className="max-w-7xl mx-auto px-1.5 sm:px-6 lg:px-8 flex flex-row items-center justify-between gap-1 sm:gap-4">
          
          {/* Slogans on the left */}
          <div className="flex items-center gap-1.5 sm:gap-5">
            <span className="flex items-center gap-0.5 sm:gap-1 text-slate-200 whitespace-nowrap">
              <BadgeCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#f57224] shrink-0" />
              <span>১০০% আসল পণ্য</span>
            </span>
            <span className="hidden sm:flex items-center gap-1 text-slate-300 whitespace-nowrap">
              <Truck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>এক্সপ্রেস হোম ডেলিভারি</span>
            </span>
          </div>

          {/* Quick contact and support options on the right */}
          <div className="flex items-center gap-2 sm:gap-4 text-slate-200 font-semibold shrink-0">
            <a href={`tel:${contactPhone || "01625467988"}`} className="flex items-center gap-0.5 sm:gap-1 hover:text-[#f57224] transition-colors leading-none whitespace-nowrap">
              <Phone className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#f57224] shrink-0" />
              <span>কল: <strong className="font-mono text-[9px] sm:text-xs text-[#f57224] sm:text-slate-200">{contactPhone || "01625467988"}</strong></span>
            </a>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-slate-400 cursor-pointer hover:text-white transition-colors">
              <HelpCircle className="w-3 h-3 text-slate-500 shrink-0" />
              <span>24/7 সাপোর্ট</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
