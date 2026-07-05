import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, addDoc, setDoc } from 'firebase/firestore';
import { db } from './lib/firebase';
import { Product, PaymentSettings, TabType, CartItem } from './types';
import Navbar from './components/Navbar';
import ShopView from './components/ShopView';
import ProfileView from './components/ProfileView';
import OrderModal from './components/OrderModal';
import ProductDetailView from './components/ProductDetailView';
import AdminView from './components/AdminView';
import CartDrawer from './components/CartDrawer';
import { useAuth } from './lib/authContext';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, ShoppingBag, X, MapPin, Mail, MessageCircle, Sparkles, Copy, Check, Gift, Flame, Ticket, Coins, Facebook, Clock } from 'lucide-react';
import Logo from './components/Logo';
import ChatWidget from './components/ChatWidget';

// Helper to choose a highly premium, differentiated design for each unique coupon code
export function getCouponDesign(code: string, isCopied: boolean) {
  // Simple deterministic hash of the coupon code to ensure consistent styling
  let hash = 0;
  const uppercaseCode = (code || '').toUpperCase();
  for (let i = 0; i < uppercaseCode.length; i++) {
    hash = uppercaseCode.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % 6;

  // 6 distinct elite dark-glass configurations with glowing neon highlights
  const configs = [
    {
      // 1. Classic Ruby / Sunset Crimson (E.g. EID, festive, premium codes)
      bannerBg: "from-[#090b11] via-[#111625] to-[#090b11]",
      bannerBorder: "border-rose-500/15",
      liveBg: "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_0_12px_rgba(244,63,94,0.3)]",
      ticketBg: isCopied ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300" : "bg-slate-950/60 border-rose-500/25 shadow-[0_8px_20px_rgba(244,63,94,0.06)]",
      ticketHover: "hover:bg-slate-900/90 hover:border-rose-500/60 hover:shadow-[0_0_15px_rgba(244,63,94,0.2)]",
      codeText: isCopied ? "text-emerald-400 font-extrabold" : "text-rose-400 font-extrabold",
      discountText: "text-amber-400 font-black",
      themeColor: "#f43f5e",
      notchBg: "bg-[#111625]", // Seamlessly blends with the banner's dark background middle
      badgeBg: "bg-rose-950/40 text-rose-300 border border-rose-800/30",
      icon: "🔥"
    },
    {
      // 2. Majestic Indigo Violet (Premium, electronic, high value tech)
      bannerBg: "from-[#090b11] via-[#111625] to-[#090b11]",
      bannerBorder: "border-indigo-500/15",
      liveBg: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-[0_0_12px_rgba(99,102,241,0.3)]",
      ticketBg: isCopied ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300" : "bg-slate-950/60 border-indigo-500/25 shadow-[0_8px_20px_rgba(99,102,241,0.06)]",
      ticketHover: "hover:bg-slate-900/90 hover:border-indigo-500/60 hover:shadow-[0_0_15px_rgba(99,102,241,0.2)]",
      codeText: isCopied ? "text-emerald-400 font-extrabold" : "text-indigo-400 font-extrabold",
      discountText: "text-rose-400 font-black",
      themeColor: "#6366f1",
      notchBg: "bg-[#111625]",
      badgeBg: "bg-indigo-950/40 text-indigo-300 border border-indigo-800/30",
      icon: "⚡"
    },
    {
      // 3. Tangerine Sunset / Warm Amber
      bannerBg: "from-[#090b11] via-[#111625] to-[#090b11]",
      bannerBorder: "border-[#f57224]/20",
      liveBg: "bg-gradient-to-r from-[#f57224] to-orange-600 text-white shadow-[0_0_12px_rgba(245,114,36,0.35)]",
      ticketBg: isCopied ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300" : "bg-slate-950/60 border-orange-550/25 shadow-[0_8px_20px_rgba(245,114,36,0.06)]",
      ticketHover: "hover:bg-slate-900/90 hover:border-[#f57224]/60 hover:shadow-[0_0_15px_rgba(245,114,36,0.22)]",
      codeText: isCopied ? "text-emerald-400 font-extrabold" : "text-orange-400 font-extrabold",
      discountText: "text-amber-300 font-black",
      themeColor: "#f57224",
      notchBg: "bg-[#111625]",
      badgeBg: "bg-orange-950/40 text-orange-350 border border-orange-900/40",
      icon: "🎉"
    },
    {
      // 4. Cool Mint emerald (Eco, cashback, select categories)
      bannerBg: "from-[#090b11] via-[#111625] to-[#090b11]",
      bannerBorder: "border-emerald-500/15",
      liveBg: "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.3)]",
      ticketBg: isCopied ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300" : "bg-slate-950/60 border-emerald-500/25 shadow-[0_8px_20px_rgba(16,185,129,0.06)]",
      ticketHover: "hover:bg-slate-900/90 hover:border-emerald-500/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]",
      codeText: isCopied ? "text-cyan-400 font-extrabold" : "text-emerald-400 font-extrabold",
      discountText: "text-indigo-400 font-black",
      themeColor: "#10b981",
      notchBg: "bg-[#111625]",
      badgeBg: "bg-emerald-950/40 text-emerald-300 border border-emerald-800/30",
      icon: "🎁"
    },
    {
      // 5. Cyan Ocean Sparklestar
      bannerBg: "from-[#090b11] via-[#111625] to-[#090b11]",
      bannerBorder: "border-cyan-500/15",
      liveBg: "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-[0_0_12px_rgba(6,182,212,0.3)]",
      ticketBg: isCopied ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300" : "bg-slate-950/60 border-cyan-500/25 shadow-[0_8px_20px_rgba(6,182,212,0.06)]",
      ticketHover: "hover:bg-slate-900/90 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]",
      codeText: isCopied ? "text-emerald-400 font-extrabold" : "text-cyan-400 font-extrabold",
      discountText: "text-pink-400 font-black",
      themeColor: "#06b6d4",
      notchBg: "bg-[#111625]",
      badgeBg: "bg-cyan-950/40 text-cyan-300 border border-cyan-800/30",
      icon: "✨"
    },
    {
      // 6. Rich Gold Honey Amber
      bannerBg: "from-[#090b11] via-[#111625] to-[#090b11]",
      bannerBorder: "border-amber-500/15",
      liveBg: "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]",
      ticketBg: isCopied ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300" : "bg-slate-950/60 border-amber-500/25 shadow-[0_8px_20px_rgba(245,158,11,0.06)]",
      ticketHover: "hover:bg-slate-900/90 hover:border-amber-500/60 hover:shadow-[0_0_15px_rgba(245,158,11,0.2)]",
      codeText: isCopied ? "text-emerald-400 font-extrabold" : "text-amber-400 font-extrabold",
      discountText: "text-yellow-400 font-black",
      themeColor: "#f59e0b",
      notchBg: "bg-[#111625]",
      badgeBg: "bg-amber-950/40 text-amber-350 border border-amber-800/30",
      icon: "⭐"
    }
  ];

  return configs[index];
}

export default function App() {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin' || profile?.email === 'kazicom03@gmail.com';

  const [activeTab, setActiveTab ] = useState<TabType>('shop');

  // Bounce unauthorized user out of the admin tab
  useEffect(() => {
    if (activeTab === 'admin' && !isAdmin) {
      setActiveTab('shop');
    }
  }, [activeTab, isAdmin]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState(1);
  const [checkoutColor, setCheckoutColor] = useState('Black');
  const [checkoutSize, setCheckoutSize] = useState('');
  const [successPhone, setSuccessPhone] = useState('');
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [activePromos, setActivePromos] = useState<any[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activePolicy, setActivePolicy] = useState<'terms' | 'return' | 'privacy' | 'guide' | null>(null);

  // Real-time promo codes stream to highlight active offers dynamically to clients
  useEffect(() => {
    const unsubPromos = onSnapshot(collection(db, 'promo_codes'), (snapshot) => {
      const list: any[] = [];
      const today = new Date().setHours(0, 0, 0, 0);
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const expiryTime = new Date(data.expiryDate).getTime();
        // Sift out expired or inactive coupons
        if (data.active === true && expiryTime >= today) {
          list.push({ id: docSnap.id, ...data });
        }
      });
      setActivePromos(list);
    }, (error) => {
      console.error("Failed to stream promo codes for ticker:", error);
    });
    return () => unsubPromos();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Shopping Cart Engine persistent states
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('smarthaat_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [selectedCartItemsForCheckout, setSelectedCartItemsForCheckout] = useState<CartItem[] | null>(null);
  const [appliedCartCoupon, setAppliedCartCoupon] = useState<string | undefined>(undefined);

  useEffect(() => {
    localStorage.setItem('smarthaat_cart', JSON.stringify(cart));
  }, [cart]);

  function handleAddToCart(product: Product, quantity: number, color: string, selectedSize?: string) {
    const itemID = selectedSize ? `${product.id}-${color}-${selectedSize}` : `${product.id}-${color}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === itemID);
      if (existing) {
        return prev.map((item) =>
          item.id === itemID ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, { id: itemID, product, quantity, color, selectedSize }];
    });
    setIsCartDrawerOpen(true);
    setSelectedProductForDetail(null);
  }

  function handleUpdateCartQuantity(id: string, qty: number) {
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.max(1, qty) } : item))
    );
  }

  function handleRemoveFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function handleClearCart() {
    setCart([]);
  }

  function handleCartCheckout(couponCode?: string) {
    setAppliedCartCoupon(couponCode);
    setSelectedCartItemsForCheckout([...cart]);
    setIsCartDrawerOpen(false);
  }

  function handleBuyProduct(product: Product) {
    setSelectedProductForDetail(product);
  }

  function handleCheckout(product: Product, quantity: number, selectedColor: string, selectedSize?: string) {
    setSelectedProduct(product);
    setCheckoutQuantity(quantity);
    setCheckoutColor(selectedColor);
    setCheckoutSize(selectedSize || '');
    setSelectedProductForDetail(null);
  }

  function handleOrderSuccess(phone: string) {
    setSuccessPhone(phone);
    setShowSuccessToast(true);
    setActiveTab('profile');
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 6000);
  }

  // Load live Firestore collections
  useEffect(() => {
    // 1. Live product collection stream
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const items: Product[] = [];
      snapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Product);
      });
      // Sort by time/id if available, but keep raw streaming list order
      setProducts(items);
      setIsLoading(false);

      // Auto-seed if library is completely empty
      if (snapshot.empty) {
        console.log("Database contains 0 products. Auto-seeding default items...");
        const seedDefaultProducts = async () => {
          const demoProducts = [
            {
              name: "T900 Ultra Smart Watch with Bluetooth Calling",
              price: 1549,
              description: "আপনার স্মার্ট ব্যক্তিত্বে যোগ করুন প্রিমিয়াম লুক। ব্লুটুথ কলিং, উজ্জ্বল ডিসপ্লে, রিয়েল-টাইম হার্ট রেট ট্র্যাকিং এবং দীর্ঘস্থায়ী শক্তিশালী ব্যাটারি লাইফ সমৃদ্ধ আল্ট্রা স্মার্ট ওয়াচ। স্পোর্টস ট্র্যাকিং এবং ওয়াটারপ্রুফ ডিজাইন নিয়ে এটি বর্তমানের অন্যতম ট্রেন্ডিং লাইফস্টাইল ক্যাজেট।",
              image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=400",
              isNew: true
            },
            {
              name: "DC 8-100V LCD Digital Battery Capacity Voltage Meter",
              price: 1055,
              description: "যেকোনো ব্যাটারির ভোল্টেজ এবং চার্জ ক্যাপাসিটি পরিমাপের ডিজিটাল সহজ সমাধান। ৮ থেকে ১০০ ভোল্ট পর্যন্ত রেঞ্জ কভার করে। লিকুইড ক্রিস্টাল এলসিডি ব্যাকলিট ডিসপ্লে থাকায় রাতেও সহজে রিডিং দেখা যায়। সোলার সিস্টেম, ব্যাকআপ আইপিএস এবং কার ও বাইক ব্যাটারির জন্য অত্যন্ত কার্যকরী মিটার।",
              image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=400",
              isNew: false
            },
            {
              name: "Remax Bullet Series 10000mAh Mini Power Bank",
              price: 1290,
              description: "পকেটে বয়ে বেড়ানোর মত ছোট্ট ফার্স্ট চার্জিং পাওয়ার ব্যাংক। ১০,০০০ এমএএইচ ক্যাপাসিটি যা দিয়ে যেকোনো স্মার্টফোন ৩ থেকে ৪ বার চার্জ করা সম্ভব। ওভারচার্জ প্রটেকশন সার্কিট এবং আকর্ষণীয় বিল্ড কোয়ালিটি নিয়ে এটি আপনার ট্র্যাভেলের সেরা সঙ্গী।",
              image: "https://images.unsplash.com/photo-1609592424089-986427387cc2?auto=format&fit=crop&q=80&w=400",
              isNew: true
            },
            {
              name: "M10 Premium TWS Wireless Bluetooth Earbuds",
              price: 649,
              description: "ডিপ বেস ও ট্রু থ্রিডি সিনেমাটিক অডিও সাউন্ড সমৃদ্ধ আধুনিক ইয়ারবাডস। চার্জিং কেসে রয়েছে প্রিমিয়াম ডিজিটাল পাওয়ার ইন্ডিকেটর এবং ইমার্জেন্সি রিচার্জের জন্য ২ হাজার এমএএইচ পাওয়ার প্যাক। জল ও ঘাম নিরোধক টাচ কন্ট্রোল বাটনের মাধ্যমে কল ও গান পরিচালনা করা অত্যন্ত সহজ।",
              image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&q=80&w=400",
              isNew: true
            }
          ];

          for (const item of demoProducts) {
            try {
              await addDoc(collection(db, 'products'), item);
            } catch (err) {
              console.error("Failed to seed product:", item.name, err);
            }
          }

          try {
            await setDoc(doc(db, 'settings', 'payment'), {
              bkash: "01625467988 (Personal)",
              nagad: "01625467988 (Personal)",
              bank: "হিসাব নম্বর: 258963147\nটাকা পাঠিয়ে নিচে রেফারেন্স নম্বরের ট্রানজেকশন আইডি দিন।"
            });
          } catch (err) {
            console.error("Failed to seed payment details:", err);
          }
        };
        seedDefaultProducts();
      }
    });
    return () => unsubProducts();
  }, []);

  // Real-time payment settings stream
  useEffect(() => {
    const unsubPayment = onSnapshot(doc(db, 'settings', 'payment'), (docSnap) => {
      if (docSnap.exists()) {
        setPaymentSettings(docSnap.data() as PaymentSettings);
      }
    });
    return () => unsubPayment();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans select-none antialiased text-slate-800">
      {/* Top Navbar */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        cartCount={cart.reduce((total, item) => total + item.quantity, 0)}
        onCartOpen={() => setIsCartDrawerOpen(true)}
        contactPhone={paymentSettings.footerWhatsapp}
      />

      {/* Live Active Promotional Announcement Ticker (Now placed directly under the Top Bar Navbar) */}
            {activePromos.length > 0 && (() => {
        // Dynamic banner background scales based on the first active coupon item
        const primaryConfig = getCouponDesign(activePromos[0]?.code || '', false);
        return (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-gradient-to-r ${primaryConfig.bannerBg} border-b ${primaryConfig.bannerBorder} text-slate-100 text-xs sm:text-sm py-4 px-4 shadow-[0_10px_35px_rgba(0,0,0,0.25)] relative overflow-hidden flex items-center justify-center font-display tracking-wide transition-all duration-700`}
          >
            {/* Subtle premium animated light sweep background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/8 to-transparent w-[50%] -skew-x-12 pointer-events-none"
              animate={{
                left: ['-50%', '150%']
              }}
              transition={{
                repeat: Infinity,
                duration: 4,
                ease: "linear",
                repeatDelay: 2
              }}
            />

            <div className="flex items-center gap-3.5 flex-wrap text-center justify-center relative z-10 max-w-7xl mx-auto">
              {/* Dynamic Live Indicator badge */}
              <motion.span 
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${primaryConfig.liveBg} border border-white/5 shadow-[0_4px_12px_rgba(0,0,0,0.2)] shrink-0 transition-colors duration-500`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>লাইভ অফার ⚡</span>
              </motion.span>

              <span className="font-extrabold text-white flex items-center gap-1.5 font-sans tracking-wide">
                <span>বিশেষ ছাড় চলছে! কুপন কোডটি কপি করতে ক্লিক করুন:</span>
              </span>

              <div className="flex items-center gap-3 flex-wrap justify-center font-sans">
                {activePromos.map((promo) => {
                  const discountText = promo.type === 'flat' ? `৳${promo.value}` : `${promo.value}%`;
                  const isCopied = copiedCode === promo.code;
                  // Retrieve the dedicated design configuration for this specific code
                  const config = getCouponDesign(promo.code, isCopied);
                  
                  return (
                    <motion.button
                      key={promo.id}
                      onClick={() => handleCopyCode(promo.code)}
                      animate={isCopied ? {
                        scale: [1, 1.08, 1],
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(6, 78, 59, 0.45)'
                      } : {
                        scale: [1, 1.025, 1],
                        borderColor: config.themeColor + '40',
                        boxShadow: [
                          "0px 4px 6px rgba(0, 0, 0, 0.15)",
                          "0px 8px 24px rgba(0, 0, 0, 0.2)",
                          "0px 4px 6px rgba(0, 0, 0, 0.15)"
                        ]
                      }}
                      transition={isCopied ? {
                        duration: 0.3
                      } : {
                        repeat: Infinity,
                        duration: 3,
                        ease: "easeInOut"
                      }}
                      className={`h-9.5 inline-flex items-center gap-2.5 ${config.ticketBg} ${config.ticketHover} text-xs font-bold font-mono uppercase px-4 py-1.5 rounded-xl border relative shadow-md transition-all select-none active:scale-95 shrink-0 cursor-pointer overflow-hidden ${
                        isCopied ? 'text-emerald-300 border-emerald-500/50' : 'text-slate-100'
                      }`}
                      title="ক্লিক করে কোড কপি করুন"
                    >
                      {/* Ticket Circular Notches: dynamically colored to seamlessly blend into container background */}
                      <span className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${config.notchBg} border-r border-slate-800/10`} />
                      <span className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${config.notchBg} border-l border-slate-800/10`} />

                      <div className="flex items-center gap-1.5 pl-1 relative z-10">
                        <span className="text-[13px] filter drop-shadow-md">{config.icon}</span>
                        <span className={`tracking-wider font-extrabold ${config.codeText}`}>
                          {promo.code}
                        </span>
                      </div>

                      {/* Dashed divider */}
                      <span className="h-4 border-l border-dashed border-slate-700/60 shrink-0 relative z-10" />

                      <div className="flex items-center gap-2 pr-1 relative z-10">
                        <span className={`font-black ${config.discountText}`}>
                          {discountText} ছাড়
                        </span>
                        {isCopied ? (
                          <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md flex items-center gap-1 animate-bounce border border-emerald-800/40">
                            <Check className="w-3 h-3 text-emerald-400 font-extrabold" />
                            <span>কপিড</span>
                          </span>
                        ) : (
                          <motion.div
                            animate={{ y: [0, -1, 0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="bg-slate-800 p-0.5 rounded text-slate-400"
                          >
                            <Copy className="w-3 h-3 text-slate-350 hover:text-white" />
                          </motion.div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              
              <span className="relative inline-flex items-center gap-1.5 font-semibold text-slate-300 font-sans">
                <span>এবং চেকআউটে অফারটি উপভোগ করুন!</span>
                <motion.span
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 6, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 2.5, repeatDelay: 1 }}
                >
                  🎉
                </motion.span>
              </span>
            </div>
          </motion.div>
        );
      })()}

      {/* Infinite Slider Shopping Bag Drawer */}
      <CartDrawer 
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleCartCheckout}
      />

      {/* Main Content Pane */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'shop' && (
              <ShopView 
                products={products} 
                isLoading={isLoading} 
                onBuy={handleBuyProduct} 
                onSelectProduct={setSelectedProductForDetail}
              />
            )}
            {activeTab === 'profile' && (
              <ProfileView 
                initialSubView={successPhone ? 'orders' : 'account'} 
                initialPhone={successPhone} 
              />
            )}
            {activeTab === 'admin' && isAdmin && (
              <AdminView />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Elegant, Non-blocking Order Modal for single-product quick-buy */}
      {selectedProduct && (
        <OrderModal 
          product={selectedProduct}
          paymentSettings={paymentSettings}
          initialQuantity={checkoutQuantity}
          initialColor={checkoutColor}
          initialSize={checkoutSize}
          onClose={() => setSelectedProduct(null)}
          onSuccess={handleOrderSuccess}
        />
      )}

      {/* Elegant, Non-blocking Order Modal for multi-item checkout */}
      {selectedCartItemsForCheckout && (
        <OrderModal 
          product={null}
          cartItems={selectedCartItemsForCheckout}
          paymentSettings={paymentSettings}
          initialCouponCode={appliedCartCoupon}
          onClose={() => {
            setSelectedCartItemsForCheckout(null);
            setAppliedCartCoupon(undefined);
          }}
          onSuccess={handleOrderSuccess}
          onClearCart={handleClearCart}
        />
      )}

      {/* High Fidelity Daraz-Style Product Details Drawer/Modal */}
      <AnimatePresence>
        {selectedProductForDetail && (
          <ProductDetailView 
            product={selectedProductForDetail}
            onClose={() => setSelectedProductForDetail(null)}
            onCheckout={handleCheckout}
            onAddToCart={handleAddToCart}
            allProducts={products}
            onSelectProduct={setSelectedProductForDetail}
          />
        )}
      </AnimatePresence>

      {/* Custom Exquisite Toast (Avoids standard window.alert during frame execution) */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-start gap-3.5"
          >
            <div className="w-9 h-9 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="flex-grow space-y-1">
              <h4 className="font-bold text-sm text-slate-100">অর্ডার সফল হয়েছে! 🎉</h4>
              <p className="text-xs text-slate-300 leading-relaxed">আপনার অসাধারণ পছন্দ! অর্ডারটি সফলভাবে সিস্টেমের আওতাভুক্ত হয়েছে ও প্রসেস চলছে।</p>
            </div>
            <button 
              id="close-toast-btn"
              onClick={() => setShowSuccessToast(false)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-300 hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer copyright and contact */}
      <footer id="main-footer" className="bg-[#05070e] border-t border-slate-900 text-slate-300 pt-16 pb-12 mt-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700/40 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 items-start">
            {/* Column 1: Brand Info */}
            <div className="space-y-4">
              <div className="flex items-center">
                <Logo size="sm" variant="dark" />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed text-justify">
                স্মার্টহাটবিডি - আপনার দৈনন্দিন জীবনের আধুনিক ও জেনুইন গ্যাজেট এবং লাইফস্টাইল পণ্য কেনাকাটার নির্ভরযোগ্য ই-কমার্স প্ল্যাটফর্ম। আমরা সাশ্রয়ী মূল্যে সেরা মান নিশ্চিত করি।
              </p>
              <div className="space-y-2 pt-2 text-xs text-slate-400">
                <a 
                  id="office-address" 
                  href="https://www.google.com/maps/search/?api=1&query=23%C2%B050%2706.5%22N+90%C2%B015%2735.5%22E"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2.5 leading-relaxed hover:text-[#f57224] transition-colors group"
                >
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                  <span>
                    <strong className="text-slate-300 block mb-0.5 group-hover:text-white transition-colors">প্রধান কার্যালয়:</strong>
                    <span className="underline decoration-slate-850/60 decoration-dashed underline-offset-4 group-hover:decoration-[#f57224]/40 transition-colors">
                      {paymentSettings.footerOfficeAddress || "B-2/2, Anandapur, Genda, Savar, Dhaka"}
                    </span>
                  </span>
                </a>
              </div>
            </div>

            {/* Column 2: Customer Support */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-blue-500 rounded-sm"></span>
                গ্রাহক সেবা ও সহায়তা
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li className="flex items-center gap-2 bg-slate-800/30 border border-slate-800/50 px-2.5 py-1.5 rounded-lg w-fit">
                  <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-slate-300 font-medium text-[11px] sm:text-xs">হেল্পলাইন: সকাল ০৯:০০ - রাত ১০:০০</span>
                </li>
                <li className="pt-1">
                  <a 
                    id="whatsapp-link" 
                    href={`https://wa.me/88${paymentSettings.footerWhatsapp || "01625467988"}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2.5 hover:text-green-400 transition-colors py-0.5"
                  >
                    <MessageCircle className="w-4 h-4 text-green-500 shrink-0" />
                    <span>WhatsApp: <strong className="text-slate-300 font-mono font-medium">{paymentSettings.footerWhatsapp || "01625467988"}</strong></span>
                  </a>
                </li>
                <li>
                  <a 
                    id="email-link" 
                    href={`mailto:${paymentSettings.footerEmail || "kazicom03@gmail.com"}`} 
                    className="flex items-center gap-2.5 hover:text-blue-400 transition-colors py-0.5"
                  >
                    <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Email: <strong className="text-slate-300 font-mono font-medium">{paymentSettings.footerEmail || "kazicom03@gmail.com"}</strong></span>
                  </a>
                </li>
                <li>
                  <a 
                    id="facebook-link" 
                    href={paymentSettings.footerFacebook || "https://www.facebook.com/md.sagor.795247"} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-2.5 hover:text-blue-500 transition-colors py-0.5"
                  >
                    <Facebook className="w-4 h-4 text-blue-500 shrink-0" />
                    <span>Facebook: <strong className="text-slate-300 font-mono font-medium">স্মার্টহাটবিডি পেজ</strong></span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Quick Links & Policies */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#f57224] rounded-sm"></span>
                জরুরী নীতিমালা
              </h4>
              <ul className="space-y-2.5 text-xs text-slate-400">
                <li>
                  <button 
                    onClick={() => setActivePolicy('guide')}
                    className="hover:text-blue-400 hover:underline text-left transition-all flex items-center gap-1.5 group"
                  >
                    <span className="text-slate-600 group-hover:text-[#f57224] transition-colors">➔</span>
                    <span>পণ্য অর্ডার করার নিয়ম</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActivePolicy('return')}
                    className="hover:text-blue-400 hover:underline text-left transition-all flex items-center gap-1.5 group"
                  >
                    <span className="text-slate-600 group-hover:text-[#f57224] transition-colors">➔</span>
                    <span>রিটার্ন ও রিফান্ড পলিসি</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActivePolicy('terms')}
                    className="hover:text-blue-400 hover:underline text-left transition-all flex items-center gap-1.5 group"
                  >
                    <span className="text-slate-600 group-hover:text-[#f57224] transition-colors">➔</span>
                    <span>শর্তাবলী ও নীতিমালা</span>
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setActivePolicy('privacy')}
                    className="hover:text-blue-400 hover:underline text-left transition-all flex items-center gap-1.5 group"
                  >
                    <span className="text-slate-600 group-hover:text-[#f57224] transition-colors">➔</span>
                    <span>গোপনীয়তা নীতিমালা</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 4: Secure Payments & Developer */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-amber-500 rounded-sm"></span>
                নিরাপদ পেমেন্ট মেথড
              </h4>
              <div className="flex flex-wrap gap-2 pt-1">
                <div className="flex items-center gap-1.5 bg-[#0e1322] px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300">
                  <span className="w-2 h-2 bg-[#d8226e] rounded-full shrink-0"></span>
                  বিকাশ (bKash)
                </div>
                <div className="flex items-center gap-1.5 bg-[#0e1322] px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300">
                  <span className="w-2 h-2 bg-[#f46a25] rounded-full shrink-0"></span>
                  নগদ (Nagad)
                </div>
                <div className="flex items-center gap-1.5 bg-[#0e1322] px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] sm:text-xs font-semibold text-slate-300">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0"></span>
                  ক্যাশ অন ডেলিভারি
                </div>
              </div>

              <div className="pt-4 border-t border-slate-905 mt-4">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">Crafted and Built by</span>
                <a 
                  href="https://www.facebook.com/md.sagor.795247"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-300 font-bold hover:text-[#f57224] transition-colors inline-block mt-1"
                >
                  {paymentSettings.footerDeveloperName || "MD KAZI SAGOR"}
                </a>
              </div>
            </div>
          </div>

          <div id="footer-bottom-bar" className="border-t border-slate-800/80 mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500 font-mono">
            <p>&copy; {new Date().getFullYear()} SmarthaatBD. All Rights Reserved.</p>
            <p className="hover:text-slate-400 transition-colors">
              {paymentSettings.footerTagline || "Digital Lifestyle Companion"}
            </p>
          </div>
        </div>
      </footer>

      {/* Real-time Customer Support Live Chat Stream */}
      <ChatWidget />

      {/* Animated Policy Modal */}
      <AnimatePresence>
        {activePolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePolicy(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
            />
            {/* Modal Body */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 z-10"
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-[#f57224] rounded-full"></span>
                  <h3 className="font-bold text-base text-slate-900">
                    {activePolicy === 'guide' && "🛒 পণ্য অর্ডার করার নিয়মাবলি"}
                    {activePolicy === 'return' && "🔄 রিটার্ন ও রিফান্ড পলিসি"}
                    {activePolicy === 'terms' && "📜 গ্রাহক শর্তাবলী ও নীতিমালা"}
                    {activePolicy === 'privacy' && "🔒 গোপনীয়তা নীতিমালা"}
                  </h3>
                </div>
                <button 
                  onClick={() => setActivePolicy(null)}
                  className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
                {activePolicy === 'guide' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      স্মার্টহাটবিডি থেকে যেকোনো প্রডাক্ট খুব সহজেই অনলাইনে অর্ডার করতে পারবেন। নিচে ধাপগুলো বিস্তারিত দেওয়া হলো:
                    </p>
                    <div className="space-y-3">
                      {[
                        "পছন্দের পণ্যের নিচে থাকা 'অর্ডার করুন' অথবা 'Buy Now' বাটনে ক্লিক করুন।",
                        "এতে একটি উইন্ডো বা অর্ডার ফর্ম ওপেন হবে যেখানে আপনার নাম এবং সচল মোবাইল নম্বর দিতে হবে।",
                        "আপনার জেলা নির্বাচন করুন (যেমন: Inside Dhaka অথবা Outside Dhaka)। চার্জ ও আনুমানিক ডেলিভারি দিন স্বয়ংক্রিয়ভাবে আপডেট হবে।",
                        "আপনার সম্পূর্ণ ঠিকানা পরিষ্কারভাবে লিখুন (যেমন: বাড়ি নম্বর, রোড, ইউনিয়ন, থানা ও জেলা)।",
                        "পেমেন্টের ধরন সিলেক্ট করুন। ক্যাশ অন ডেলিভারি (হাতে পেয়ে মূল্য পরিশোধ) অথবা বিকাশ/নগদ পেমেন্ট করতে পারবেন।",
                        "সব তথ্য ঠিক থাকলে 'অর্ডার কনফার্ম করুন' বাটনে ক্লিক করে কাজ সম্পন্ন করুন। আমাদের কাস্টমার প্রতিনিধি আপনার নম্বরে কল করে অর্ডার নিশ্চিত করবেন।"
                      ].map((step, idx) => (
                        <div key={idx} className="flex gap-3 text-xs leading-relaxed text-slate-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-50 text-[#f57224] flex items-center justify-center font-bold text-[11px] font-mono">
                            {idx + 1}
                          </span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePolicy === 'return' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      গ্রাহকদের সর্বোচ্চ সন্তুষ্টি নিশ্চিত করাই আমাদের মূল লক্ষ্য। পণ্য প্রাপ্তির পর কোনো সমস্যা হলে আমাদের সহজ রিটার্ন সুবিধা গ্রহণ করুন:
                    </p>
                    <div className="space-y-3">
                      {[
                        "ডেলিভারি ম্যানের সামনে পণ্য খুলে চেক করে বুঝে নিন। পণ্য ক্ষতিগ্রস্ত হলে সাথে সাথেই ফেরত দেন অথবা আমাদের কল দিন।",
                        "পণ্য নেওয়ার পর যদি কোনো টেকনিক্যাল বা মেকানিক্যাল ত্রুটি পাওয়া যায়, সেক্ষেত্রে পণ্য গ্রহণের দিন থেকে পরবর্তী ৭ দিনের মধ্যে বিনামূল্যে রিপ্লেসমেন্ট ক্লেইম করতে পারবেন।",
                        "রিটার্নের সময় পণ্য অবশ্যই সম্পূর্ণ মূল বক্স, অ্যাক্সেসরিজ এবং ক্যাশ মেমো সহ অক্ষত অবস্থায় ফেরত দিতে হবে।",
                        "প্রোডাক্টের রং, সাইজ পরিবর্তন করতে চাইলে ডেলিভারি নেওয়ার ২৪ ঘণ্টার মধ্যে আমাদের সাপোর্ট নম্বরে যোগাযোগ করুন। নতুন ডেলিভারি চার্জ প্রযোজ্য হতে পারে।"
                      ].map((step, idx) => (
                        <div key={idx} className="flex gap-3 text-xs leading-relaxed text-slate-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-[11px] font-mono">
                            {idx + 1}
                          </span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePolicy === 'terms' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      স্মার্টহাটবিডি সেবাগুলো ব্যবহার করার ক্ষেত্রে নিম্নলিখিত সাধারণ নিয়মাবলি প্রযোজ্য হবে:
                    </p>
                    <div className="space-y-3">
                      {[
                        "আমাদের সাইটে প্রদর্শিত সকল পণ্যের স্টক ও মূল্য যেকোনো সময় বাজার অনুযায়ী পরিবর্তনশীল হতে পারে।",
                        "আমরা কোনো ফেক বা কপি প্রডাক্ট সরবরাহ করি না। সকল প্রডাক্টের ডেসক্রিপশন রিয়েল ও শতভাগ কার্যকর।",
                        "অর্ডার কনফার্ম করার জন্য আমাদের কাস্টমার কেয়ার টিম থেকে কল করা হবে। ৩ বার কল করার পরও উত্তর না মিললে অর্ডারটি বাতিল বলে গণ্য হতে পারে।",
                        " must be 4-5 days inside Dhaka and 6-7 days outside Dhaka."
                      ].map((step, idx) => (
                        <div key={idx} className="flex gap-3 text-xs leading-relaxed text-slate-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[11px] font-mono">
                            {idx + 1}
                          </span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activePolicy === 'privacy' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 leading-relaxed">
                      আপনার ব্যক্তিগত তথ্যের নিরাপত্তা প্রদান আমাদের সর্বোচ্চ অগ্রাধিকার। আপনার গোপনীয়তা বজায় রাখতে আমরা বদ্ধপরিকর:
                    </p>
                    <div className="space-y-3">
                      {[
                        "আপনার দেওয়া নাম, মোবাইল নম্বর এবং ঠিকানা শুধুমাত্র পার্সেল কুরিয়ার বুকিং করার কাজে ব্যবহার করা হয়।",
                        "আপনার কোনো পেমেন্ট বা ব্যক্তিগত ডাটা অননুমোদিত কারোর সাথে শেয়ার করা হয় না।",
                        "আপনার ইউজার প্রোফাইল ও ক্রয়কৃত পণ্যের হিস্ট্রি আমাদের এনক্রিপ্টেড ডাটাবেজে সম্পূর্ণ সুরক্ষিত থাকে।"
                      ].map((step, idx) => (
                        <div key={idx} className="flex gap-3 text-xs leading-relaxed text-slate-700">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-[11px] font-mono">
                            {idx + 1}
                          </span>
                          <p>{step}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer close button */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setActivePolicy(null)}
                  className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
                >
                  বন্ধ করুন
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
