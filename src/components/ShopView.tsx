import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CATEGORIES, CATEGORY_MAP } from '../types';
import ProductCard from './ProductCard';
import { 
  Search, 
  PackageCheck, 
  Filter, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Tags, 
  ShieldCheck, 
  Truck, 
  RefreshCw, 
  Zap, 
  Sparkles, 
  Clock, 
  Flame, 
  Percent 
} from 'lucide-react';

interface ShopViewProps {
  products: Product[];
  isLoading: boolean;
  onBuy: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

// Banners list with high-fidelity Unsplash imagery and stylish dark gradients
const PROMO_BANNERS = [
  {
    id: 1,
    title: "স্মার্ট ডিজিটাল ওয়াচ উৎসব!",
    sub: "Ultimate Smartwatches & Fitness Trackers",
    badge: "সীমিত সময়ের অফার — ১৫% পর্যন্ত ছাড়",
    para: "আপনার স্মার্ট লাইফস্টাইলে যোগ করুন আকর্ষণীয় প্রিমিয়াম লুক। ব্লুটুথ কলিং, ফুল টাচ উজ্জ্বল ডিসপ্লে এবং হার্ট রেট ট্র্যাকিং সমৃদ্ধ ওয়ান-ট্যাপ কানেক্টিভিটি গ্যাজেটসমূহ এখন আরও অবিশ্বাস্য মূল্যে।",
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=650",
    bg: "from-slate-950 via-slate-900 to-[#1e1b4b]",
    accentColor: "text-blue-400 border-blue-500/30",
    badgeBg: "bg-blue-500/10 text-blue-300",
    cta: "ক্যাটালগ দেখুন —",
    category: "Electronic Accessories"
  },
  {
    id: 2,
    title: "প্রিমিয়াম টাচ ইয়ারবাডস কালেকশন",
    sub: "True Wireless Stereo & Super Cinematic Bass",
    badge: "সেরা ডিল — ফ্রি কুপন এবং ডিসকাউন্ট",
    para: "ট্রিপল-ডি স্টুডিও সাউন্ড, জল ও ঘাম নিরোধক টাচ কন্ট্রোল এবং ডিজিটাল চার্জ কেস। কাস্টম ২০০০mAh এমারজেন্সি ব্যাকআপ পাওয়ার ইন্ডিকেটর প্যাক নিয়ে অর্ডার করুন সর্বকালের সেরা দামে।",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=650",
    bg: "from-slate-950 via-slate-900 to-[#311042]",
    accentColor: "text-purple-400 border-purple-500/30",
    badgeBg: "bg-purple-500/10 text-purple-300",
    cta: "কিনুন এখনই —",
    category: "Electronic Accessories"
  },
  {
    id: 3,
    title: "অ্যাডভান্সড মিটার ও আইপিএস টুলস",
    sub: "Professional DC Testing Voltmeters & Accessories",
    badge: "নতুন কালেকশন — শতভাগ বিশ্বস্ত জেনুইন পার্টস",
    para: "৮ থেকে ১০০ ভোল্ট সীমা কভার করার মতো ক্রিস্টাল ব্যাকলিট ডিসপ্লে মিটার। সোলার ব্যাকআপ, ব্যাটারি চার্জ লেভেল ও ভোল্টেজ মনিটরিং টেস্ট করতে Savar-এর অফিসিয়াল সোর্সিং কিনুন আজই।",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=650",
    bg: "from-slate-950 via-slate-900 to-[#0c4a6e]",
    accentColor: "text-orange-400 border-orange-500/30",
    badgeBg: "bg-orange-500/10 text-orange-300",
    cta: "ডিটেইলস দেখুন —",
    category: "Electronic Accessories"
  }
];

// Colors, highlights, and icons for dynamic product themes in the auto ads banner carousel
const DYNAMIC_THEMES = [
  {
    bg: "from-slate-950 via-slate-900 to-[#1e1b4b]",
    accentColor: "text-blue-400 border-blue-500/35",
    badgeBg: "bg-blue-500/10 text-blue-300",
  },
  {
    bg: "from-slate-950 via-slate-900 to-[#311042]",
    accentColor: "text-purple-400 border-purple-500/35",
    badgeBg: "bg-purple-500/10 text-purple-300",
  },
  {
    bg: "from-slate-950 via-[#111827] to-[#0c4a6e]",
    accentColor: "text-sky-400 border-sky-500/35",
    badgeBg: "bg-sky-500/10 text-sky-300",
  },
  {
    bg: "from-slate-950 via-slate-900 to-[#064e3b]",
    accentColor: "text-emerald-400 border-emerald-500/35",
    badgeBg: "bg-emerald-500/10 text-[#6ee7b7]",
  },
  {
    bg: "from-slate-950 via-slate-900 to-[#4c0519]",
    accentColor: "text-rose-400 border-rose-500/35",
    badgeBg: "bg-rose-500/10 text-[#fca5a5]",
  }
];

// Circular interactive categories for user flow
const VISUAL_CATEGORIES = [
  {
    id: 'gadgets',
    name: "Electronic Accessories",
    label: "গ্যাজেটস",
    desc: "স্মার্ট ওয়াচ, বাডস",
    icon: "⚡"
  },
  {
    id: 'men',
    name: "Men’s & Boys’ Fashion",
    label: "ছেলেদের ফ্যাশন",
    desc: "পোলো, শার্ট, ওয়াচ",
    icon: "👕"
  },
  {
    id: 'women',
    name: "Women’s & Girls’ Fashion",
    label: "মেয়েদের ফ্যাশন",
    desc: "শাড়ি, কুর্তি, লেডিস ব্যাগ",
    icon: "👗"
  },
  {
    id: 'tools',
    name: "Tools & Hardware",
    label: "টুলস ও মিটারস",
    desc: "ভোল্টেজ মিটার, স্ক্রু",
    icon: "🛠️"
  },
  {
    id: 'lifestyle',
    name: "Home & Lifestyle",
    label: "হোম লাইফস্টাইল",
    desc: "এলইডি ডেকোরেশন",
    icon: "🏠"
  }
];

export default function ShopView({ products, isLoading, onBuy, onSelectProduct }: ShopViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  
  // Dynamically generated ad-banners directly driven by user additions or fallbacks
  const dynamicBanners = React.useMemo(() => {
    if (!products || products.length === 0) {
      return PROMO_BANNERS;
    }

    // Filter to show only products that have a discount (originalPrice > price)
    const discountedProducts = products.filter(p => p.originalPrice && p.originalPrice > p.price);
    
    // Showcase up to 5 discounted products as custom ads banners. 
    // Fall back to PROMO_BANNERS if no items have discounts to keep the carousel active with actual discounted ads.
    const targetProducts = discountedProducts;
    if (targetProducts.length === 0) {
      return PROMO_BANNERS;
    }
    const promoLimit = targetProducts.slice(0, 5);
    return promoLimit.map((p, idx) => {
      const theme = DYNAMIC_THEMES[idx % DYNAMIC_THEMES.length];
      
      // Use real discount if configured, fallback to standard catchy text
      const hasDiscount = !!(p.originalPrice && p.originalPrice > p.price);
      const discountPercent = hasDiscount 
        ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
        : 0;
      
      const discountText = hasDiscount
        ? `ধামাকা স্পেশাল অফার — ${discountPercent}% স্পেশাল ছাড়!`
        : "সীমিত সময়ের বিশেষ আকর্ষণীয় অফার!";

      return {
        id: p.id,
        title: p.name,
        sub: p.category || "দেশসেরা এক্সক্লুসিভ পণ্য কালেকশন",
        badge: discountText,
        para: p.description
          ? (p.description.length > 140 ? p.description.substring(0, 140) + "..." : p.description)
          : "পছন্দের হাই-কোয়ালিটি ও ট্রেন্ডি প্রোডাক্ট এখনই অর্ডার করুন সরাসরি ক্যাশ অন ডেলিভারিতে। দেশব্যাপী দ্রুত হোম ডেলিভারি নিশ্চয়তা!",
        image: p.image || "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=650",
        bg: theme.bg,
        accentColor: theme.accentColor,
        badgeBg: theme.badgeBg,
        cta: p.price ? `৳${p.price} মূল্যে কিনুন —` : "কিনুন এখনই —",
        category: p.category || "all",
        productObj: p
      };
    });
  }, [products]);

  // Carousel states
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Auto slide interval for the interactive promo carousel
  useEffect(() => {
    const totalBanners = dynamicBanners.length;
    if (totalBanners <= 1) return;
    const timer = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % totalBanners);
    }, 6000);
    return () => clearInterval(timer);
  }, [dynamicBanners.length]);

  const handleNextBanner = () => {
    setActiveBannerIndex((prev) => (prev + 1) % dynamicBanners.length);
  };

  const handlePrevBanner = () => {
    setActiveBannerIndex((prev) => (prev - 1 + dynamicBanners.length) % dynamicBanners.length);
  };

  // Client-side search and filtering for amazing responsive UX
  const filteredProducts = products.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(q) || 
      (p.description && p.description.toLowerCase().includes(q));
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'all' || p.subcategory === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const getActiveFilterLabel = () => {
    if (selectedCategory === 'all') return 'সকল ক্যাটাগরি (All)';
    if (selectedSubcategory === 'all') return selectedCategory;
    return `${selectedCategory} > ${selectedSubcategory}`;
  };

  return (
    <div className="space-y-8">
      {/* ========================================== */}
      {/* 1. INTERACTIVE HERO CAROUSEL MODULE (PICKABOO-STYLE LAYOUT) */}
      {/* ========================================== */}
      <div id="shop-hero-carousel" className="relative w-full rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-950">
        <div className="min-h-[300px] sm:min-h-[350px] md:min-h-[380px] relative flex transition-all duration-700">
          <AnimatePresence mode="wait">
            {dynamicBanners.map((banner, index) => {
              if (index !== activeBannerIndex) return null;
              return (
                <motion.div
                  key={banner.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.55, ease: "easeInOut" }}
                  className="absolute inset-0 text-white p-4 sm:p-10 md:p-12 flex flex-row items-center justify-between gap-4 sm:gap-6 overflow-hidden"
                >
                  {/* Visual Advertisement Background with Interactive Blurred Zoom & Dark Vignettes */}
                  <div className="absolute inset-0 overflow-hidden select-none pointer-events-none z-0">
                    <motion.img 
                      src={banner.image}
                      alt=""
                      initial={{ scale: 1.25, rotate: -1 }}
                      animate={{ scale: 1.05, rotate: 0 }}
                      transition={{ duration: 5.5, ease: "easeOut" }}
                      className="w-full h-full object-cover md:filter md:blur-2xl scale-125 opacity-20 md:opacity-40 brightness-75 saturate-125"
                    />
                    {/* Atmospheric solid-gradient mapping */}
                    <div className={`absolute inset-0 bg-gradient-to-r ${banner.bg} opacity-85 mix-blend-multiply`} />
                    {/* Bottom fade shadow */}
                    <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-950 to-transparent opacity-90" />
                    {/* Left text-protection vignette mask */}
                    <div className="absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent hidden md:block" />
                    {/* Overall soft ambient dark skin */}
                    <div className="absolute inset-0 bg-slate-950/45" />
                    {/* Vector overlay grid overlay */}
                    <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
                  </div>

                  {/* Text Columns */}
                  <div className="w-[58%] sm:w-3/5 space-y-2 sm:space-y-4 text-left z-10 relative">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[8px] xs:text-[9px] sm:text-[10px] md:text-xs font-bold tracking-wide border border-transparent uppercase ${banner.badgeBg} ${banner.accentColor}`}>
                      <Sparkles className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
                      <span className="truncate">{banner.badge}</span>
                    </span>

                    <div className="space-y-1 sm:space-y-2">
                      <span className="text-[9px] sm:text-xs uppercase tracking-widest text-[#f57224] font-black block font-mono">
                        {banner.sub}
                      </span>
                      <h1 className="text-xs xs:text-sm sm:text-2xl md:text-3xl lg:text-4xl font-display font-black tracking-tight text-white leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] line-clamp-3 sm:line-clamp-none">
                        {banner.title}
                      </h1>
                    </div>

                    <p className="hidden sm:block text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
                      {banner.para}
                    </p>

                    <div className="pt-1.5 sm:pt-2 flex items-center gap-2 sm:gap-3.5 flex-wrap sm:flex-nowrap">
                      <button
                        onClick={() => {
                          if (banner.productObj) {
                            onSelectProduct(banner.productObj);
                          } else {
                            setSelectedCategory(banner.category);
                            setSelectedSubcategory('all');
                            const target = document.getElementById('products-grid-section');
                            if (target) target.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                        className="bg-gradient-to-r from-[#f57224] to-[#e04f05] hover:from-[#e04f05] hover:to-[#b83d00] text-white text-[9px] xs:text-[10px] sm:text-xs font-extrabold uppercase px-3 py-2 sm:px-6 sm:py-3.5 rounded-lg sm:rounded-xl shadow-[0_4px_15px_rgba(245,114,36,0.35)] transition-all cursor-pointer transform scale-100 active:scale-95 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 whitespace-nowrap"
                      >
                        <span className="flex items-center gap-1.5 sm:gap-2">
                          <span>{banner.cta}</span>
                          <span className="font-mono text-white text-xs">→</span>
                        </span>
                      </button>

                      <div className="hidden xs:flex items-center gap-1 shrink-0">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-orange-500 animate-ping shrink-0" />
                        <span className="text-[8px] sm:text-[10px] font-bold text-slate-300 uppercase tracking-wider">স্টক লিমিটেড</span>
                      </div>
                    </div>
                  </div>

                  {/* Visual Product Mock Image */}
                  <div className="w-[38%] sm:w-2/5 flex items-center justify-center relative shrink-0 z-10 md:pl-6">
                    {/* Circle atmospheric backing glow */}
                    <div className="absolute w-24 h-24 sm:w-56 sm:h-56 rounded-full bg-[#f57224]/20 blur-md md:blur-3xl pointer-events-none" />
                    
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                      className="relative border border-white/10 sm:border-4 bg-slate-900/40 p-1 sm:p-2.5 rounded-lg sm:rounded-3xl shadow-2xl overflow-hidden w-20 h-20 xs:w-24 xs:h-24 sm:w-52 sm:h-52 md:w-60 md:h-60 backdrop-blur-xs group cursor-pointer"
                      onClick={() => {
                        if (banner.productObj) {
                          onSelectProduct(banner.productObj);
                        }
                      }}
                    >
                      <img
                        src={banner.image}
                        alt="Promo Product Item"
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover rounded-md sm:rounded-xl transition-transform duration-500 group-hover:scale-105"
                      />
                    </motion.div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Action Arrows */}
        <button
          onClick={handlePrevBanner}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0f172a]/45 hover:bg-[#0f172a]/75 text-white/80 border border-slate-700/30 backdrop-blur-xs flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:scale-105 z-25"
          title="পূর্ববর্তী স্লাইড"
        >
          <ChevronLeft className="w-5 h-5 -ml-[1px]" />
        </button>
        <button
          onClick={handleNextBanner}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#0f172a]/45 hover:bg-[#0f172a]/75 text-white/80 border border-slate-705 shadow-md backdrop-blur-xs flex items-center justify-center cursor-pointer transition-all active:scale-90 hover:scale-105 z-25"
          title="পরবর্তী স্লাইড"
        >
          <ChevronRight className="w-5 h-5 -mr-[1px]" />
        </button>

        {/* Carousel Slide Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-25">
          {dynamicBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveBannerIndex(index)}
              className={`h-2 rounded-full cursor-pointer transition-all duration-300 ${
                index === activeBannerIndex ? 'w-5 sm:w-6 bg-[#f57224]' : 'w-2 bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. SCROLLABLE CIRCULAR VISUAL CATEGORIES SEGMENT */}
      {/* ========================================== */}
      <div id="shop-visual-categories" className="space-y-3 text-left">
        <h3 className="text-xs font-black uppercase tracking-widest text-[#f57224] flex items-center gap-1.5 pl-1.5">
          <Tags className="w-3.5 h-3.5" />
          <span>পপুলার ক্যাটাগরি প্যানেল (Popular Categories)</span>
        </h3>
        
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x -mx-4 px-4 sm:mx-0 sm:px-0">
          {/* Circular "All" item */}
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubcategory('all');
            }}
            className="flex-col items-center gap-2 flex min-w-[76px] snap-center shrink-0 cursor-pointer group"
          >
            <div className={`w-14 h-14 sm:w-15 sm:h-15 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
              selectedCategory === 'all'
                ? 'border-[#f57224] bg-orange-50/80 shadow-md scale-102 font-bold ring-4 ring-[#f57224]/10'
                : 'border-slate-200 hover:border-slate-300 bg-white shadow-3xs'
            }`}>
              <span className="text-lg filter drop-shadow-xs">🎁</span>
            </div>
            <div className="space-y-0.5 text-center">
              <span className={`text-[11px] font-extrabold tracking-tight block ${selectedCategory === 'all' ? 'text-[#f57224] font-black' : 'text-slate-650'}`}>
                সব প্রোডাক্টস
              </span>
              <span className="text-[9px] text-slate-400 font-bold block">All Stores</span>
            </div>
          </button>

          {/* Core Categories with Visual Badging */}
          {VISUAL_CATEGORIES.map((vis) => {
            const isCatSelected = selectedCategory === vis.name;
            return (
              <button
                key={vis.id}
                onClick={() => {
                  setSelectedCategory(vis.name);
                  setSelectedSubcategory('all');
                }}
                className="flex-col items-center gap-2 flex min-w-[84px] snap-center shrink-0 cursor-pointer group"
              >
                <div className={`w-14 h-14 sm:w-15 sm:h-15 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                  isCatSelected
                    ? 'border-[#f57224] bg-orange-50/80 shadow-md scale-102 font-bold ring-4 ring-[#f57224]/10'
                    : 'border-slate-200 hover:border-slate-300 bg-white shadow-3xs group-hover:scale-102'
                }`}>
                  <span className="text-xl filter drop-shadow-xs transition-transform duration-300 group-hover:scale-110">{vis.icon}</span>
                </div>
                <div className="space-y-0.5 text-center max-w-[96px]">
                  <span className={`text-[11px] font-extrabold tracking-tight block truncate ${isCatSelected ? 'text-[#f57224] font-black' : 'text-slate-650'}`}>
                    {vis.label}
                  </span>
                  <span className="text-[9px] text-slate-400 font-medium block truncate">
                    {vis.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>


      {/* ========================================== */}
      {/* 5. MAIN PRODUCTS GRID SECTION */}
      {/* ========================================== */}
      <div className="w-full relative pb-10">
        
        <main id="products-grid-section" className="w-full space-y-6 pt-1">
          
          {/* Top filtering controls */}
          <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between pb-3 border-b border-slate-100">
            {/* Title & Mobile dropdown filter button */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 select-none">
              <h2 className="text-xl font-display font-black text-slate-800 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-[#f57224] to-[#e04f05] rounded-full shadow-[0_2px_8px_rgba(245,114,36,0.35)] animate-pulse" />
                <span>আমাদের পণ্যসমূহ</span>
              </h2>

              {/* Mobile and desktop dynamic Category Selector Dropdown (Accordion view on overlay) */}
              <div className="relative">
                <button
                  id="category-toggle-button"
                  onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
                  className="flex items-center gap-2 px-3.5 py-2.5 md:py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 cursor-pointer shadow-3xs transition-all duration-200 active:scale-97 hover:shadow-2xs"
                >
                  <Filter className="w-3.5 h-3.5 text-[#f57224]" />
                  <span className="max-w-[200px] truncate">{getActiveFilterLabel()}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryMenuOpen && (
                  <>
                    {/* Backdrop overlay to close when clicking outside */}
                    <div className="fixed inset-0 z-40" onClick={() => setIsCategoryMenuOpen(false)} />
                    <div className="absolute left-0 mt-2.5 w-72 max-h-[380px] overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-1.5 duration-200">
                      
                      {/* Standard 'All' option */}
                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setSelectedSubcategory('all');
                          setIsCategoryMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-3 md:py-2.5 text-xs font-black rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                          selectedCategory === 'all' 
                            ? 'bg-orange-50 text-[#f57224]' 
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>সকল ক্যাটাগরি (All Products)</span>
                        {selectedCategory === 'all' && <span className="w-1.5 h-1.5 bg-[#f57224] rounded-full shrink-0" />}
                      </button>
                      
                      <div className="h-px bg-slate-100 my-1.5" />
                      
                      {/* Category hierarchy option with expandables/accordions */}
                      <div className="space-y-1">
                        {CATEGORIES.map((cat) => {
                          const isCatSelected = selectedCategory === cat;
                          const hasSub = CATEGORY_MAP[cat] && CATEGORY_MAP[cat].length > 0;
                          return (
                            <div key={cat} className="space-y-1">
                              <button
                                onClick={() => {
                                  if (selectedCategory === cat) {
                                    // Collapse / select main with no nested sub selected
                                    setSelectedCategory('all');
                                    setSelectedSubcategory('all');
                                  } else {
                                    setSelectedCategory(cat);
                                    setSelectedSubcategory('all');
                                  }
                                }}
                                className={`w-full text-left px-3 py-2.5 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-between ${
                                  isCatSelected 
                                    ? 'bg-orange-50/70 text-[#f57224] font-black' 
                                    : 'text-slate-650 hover:bg-slate-50'
                                }`}
                              >
                                <span className="truncate pr-2">{cat}</span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  {isCatSelected && <span className="w-1.5 h-1.5 bg-[#f57224] rounded-full shrink-0" />}
                                  {hasSub && (
                                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-250 ${isCatSelected ? 'rotate-180' : ''}`} />
                                  )}
                                </div>
                              </button>
                              
                              {/* Inside collapsible container */}
                              {isCatSelected && hasSub && (
                                <div className="pl-4 border-l-2 border-orange-100 ml-3 py-1 space-y-1 animate-in slide-in-from-top-1 duration-200">
                                  <button
                                    onClick={() => {
                                      setSelectedSubcategory('all');
                                      setIsCategoryMenuOpen(false);
                                    }}
                                    className={`w-full text-left px-2.5 py-2 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                                      selectedSubcategory === 'all' 
                                        ? 'text-[#f57224] bg-orange-50/30' 
                                        : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                                  >
                                    <span>সব ({cat})</span>
                                  </button>
                                  {CATEGORY_MAP[cat].map((sub) => {
                                    const isSubSelected = selectedSubcategory === sub;
                                    return (
                                      <button
                                        key={sub}
                                        onClick={() => {
                                          setSelectedSubcategory(sub);
                                          setIsCategoryMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-2.5 py-2 text-[11px] font-bold rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                                          isSubSelected 
                                            ? 'text-[#f57224] bg-orange-50/30 font-extrabold' 
                                            : 'text-slate-500 hover:bg-slate-50 hover:text-[#f57224]'
                                        }`}
                                      >
                                        <span>{sub}</span>
                                        {isSubSelected && <span className="w-1.5 h-1.5 bg-[#f57224] rounded-full shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:max-w-xs group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f57224] w-4 h-4 transition-colors duration-200" />
              <input 
                id="product-search-input"
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="পছন্দের প্রোডাক্ট খুঁজুন..."
                className="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium outline-none focus:border-[#0f172a] focus:ring-4 focus:ring-[#f57224]/5 transition-all shadow-3xs hover:shadow-2xs placeholder:text-slate-400 text-slate-700"
              />
            </div>
          </div>

          {/* Active selection breadcrumbs/pill feedback if customized */}
          {(selectedCategory !== 'all' || selectedSubcategory !== 'all') && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-450 font-bold">ফিল্টারঃ</span>
              
              {selectedCategory !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-white border border-slate-100 rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#f57224] shadow-3xs animate-in zoom-in-95 duration-150">
                  <span>{selectedCategory}</span>
                  {selectedSubcategory === 'all' && (
                    <button 
                      onClick={() => {
                        setSelectedCategory('all');
                        setSelectedSubcategory('all');
                      }} 
                      className="ml-1 text-slate-400 hover:text-[#f57224] cursor-pointer hover:bg-slate-50 rounded-full w-4 h-4 flex items-center justify-center font-bold text-[8px]"
                    >
                      ✕
                    </button>
                  )}
                </span>
              )}

              {selectedSubcategory !== 'all' && (
                <span className="inline-flex items-center gap-1 bg-orange-50/70 border border-orange-100 rounded-xl px-3 py-1.5 text-[11px] font-bold text-[#f57224] shadow-3xs animate-in zoom-in-95 duration-150">
                  <span className="text-slate-450 font-normal">সাব-ক্যাটাগরি:</span>
                  <span>{selectedSubcategory}</span>
                  <button 
                    onClick={() => setSelectedSubcategory('all')} 
                    className="ml-1 text-slate-400 hover:text-[#f57224] cursor-pointer hover:bg-slate-50 rounded-full w-4 h-4 flex items-center justify-center font-bold text-[8px]"
                  >
                    ✕
                  </button>
                </span>
              )}

              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                  setSearchQuery('');
                }}
                className="text-[11px] font-extrabold text-[#f57224] hover:text-[#e04f05] cursor-pointer hover:underline pl-1"
              >
                রিসেট অল
              </button>
            </div>
          )}

          {/* Standard grid load skeleton */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div 
                  key={idx} 
                  className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-3xs flex flex-col animate-pulse"
                >
                  <div className="bg-slate-100 h-44 sm:h-48 w-full relative" />
                  <div className="p-4 flex flex-col flex-grow space-y-3">
                    <div className="h-5 bg-slate-100 rounded-lg w-5/6" />
                    <div className="h-4 bg-slate-100 rounded-lg w-1/2" />
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100/80 mt-auto">
                      <div className="h-6 bg-slate-100 rounded-md w-1/3" />
                      <div className="h-9 bg-slate-100 rounded-xl w-1/3" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_rgba(15,23,42,0.02)] max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
                <PackageCheck className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-800 text-base">কোনো পণ্য পাওয়া যায়নি!</h3>
                <p className="text-slate-500 text-xs max-w-xs mx-auto">আমরা শীঘ্রই নতুন পণ্য যুক্ত করতে যাচ্ছি অথবা আপনার অনুসন্ধান পরিবর্তন করুন।</p>
              </div>
              {(searchQuery || selectedCategory !== 'all' || selectedSubcategory !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedSubcategory('all');
                  }}
                  className="text-[#f57224] hover:text-[#e04f05] font-bold text-xs underline cursor-pointer"
                >
                  ফিল্টার রিসেট করুন
                </button>
              )}
            </div>
          ) : (
            /* Products list inside desktop grid */
            <motion.div 
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05
                  }
                }
              }}
              className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6"
            >
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  onBuy={onBuy} 
                  onSelectProduct={onSelectProduct}
                />
              ))}
            </motion.div>
          )}

        </main>
      </div>
    </div>
  );
}
