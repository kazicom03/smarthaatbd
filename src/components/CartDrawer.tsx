import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Tag, 
  Gift, 
  Check, 
  AlertCircle, 
  Percent, 
  Sparkles 
} from 'lucide-react';
import { CartItem } from '../types';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (couponCode?: string) => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}: CartDrawerProps) {
  const fallbackImage = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=400';

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Coupon Discount Engine
  const [couponInput, setCouponInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [showPromoCollapse, setShowPromoCollapse] = useState(true);

  // Stream active coupons in real-time
  useEffect(() => {
    if (!isOpen) return;
    const unsub = onSnapshot(collection(db, 'promo_codes'), (snapshot) => {
      const list: any[] = [];
      const today = new Date().setHours(0, 0, 0, 0);
      snapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const expiryTime = new Date(item.expiryDate).getTime();
        if (item.active === true && expiryTime >= today) {
          list.push({ id: docSnap.id, ...item });
        }
      });
      setAvailableCoupons(list);
    }, (err) => {
      console.error("Cart promo code streaming failed safely:", err);
    });
    return () => unsub();
  }, [isOpen]);

  // Recalculate or auto-validate promo on subtotal change
  useEffect(() => {
    if (appliedPromo) {
      if (subtotal < appliedPromo.minPurchase) {
        setCouponError(`কুপনটি ব্যবহারের জন্য ন্যূনতম ৳ ${appliedPromo.minPurchase} মূল্যের পণ্য প্রয়োজন।`);
        setAppliedPromo(null);
        setDiscountAmount(0);
        setCouponSuccessMsg(null);
        return;
      }
      const discount = appliedPromo.type === 'flat'
        ? Number(appliedPromo.value)
        : (subtotal * Number(appliedPromo.value)) / 100;
      setDiscountAmount(discount);
      setCouponSuccessMsg(`কুপন '${appliedPromo.code}' প্রযুক্ত হয়েছে! ৳ ${discount.toLocaleString('en-US')} সাশ্রয়।`);
      setCouponError(null);
    } else {
      setDiscountAmount(0);
    }
  }, [subtotal, appliedPromo]);

  // Validate typed/selected coupon
  async function handleApplyCoupon(codeToTest: string) {
    if (!codeToTest.trim()) {
      setCouponError('কোপন কোডটি লিখুন।');
      return;
    }
    setIsValidatingCoupon(true);
    setCouponError(null);
    setCouponSuccessMsg(null);

    try {
      const docRef = doc(db, 'promo_codes', codeToTest.trim().toLowerCase());
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setCouponError('ভুল কুপন কোড! দয়া করে সঠিক কোড দিন।');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      const promo = docSnap.data();
      if (promo.active !== true) {
        setCouponError('কুপনটি বর্তমানে সক্রিয় নেই।');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      const expiryTime = new Date(promo.expiryDate).getTime();
      const today = new Date().setHours(0, 0, 0, 0);
      if (expiryTime < today) {
        setCouponError('দুঃখিত, কুপনটির মেয়াদ শেষ হয়ে গেছে।');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      const minBuy = Number(promo.minPurchase || 0);
      if (subtotal < minBuy) {
        setCouponError(`কুপন ব্যবহারের জন্য ন্যূনতম ৳ ${minBuy} টাকার পণ্য অর্ডার করতে হবে।`);
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      // Success Setup
      const discount = promo.type === 'flat'
        ? Number(promo.value)
        : (subtotal * Number(promo.value)) / 100;

      setAppliedPromo({
        code: promo.code,
        type: promo.type,
        value: promo.value,
        minPurchase: minBuy,
        expiryDate: promo.expiryDate,
        active: promo.active
      });
      setDiscountAmount(discount);
      setCouponSuccessMsg(`কুপন '${promo.code}' সফলভাবে প্রযুক্ত হয়েছে! ৳ ${discount.toLocaleString('en-US')} ছাড়।`);
      setCouponInput(promo.code);
    } catch (err) {
      console.error('Drawer coupon validation error:', err);
      setCouponError('কোপন চেক করতে ব্যর্থ হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setCouponInput('');
    setCouponError(null);
    setCouponSuccessMsg(null);
  }

  const grandTotal = Math.max(0, subtotal - discountAmount);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs"
          />

          {/* Drawer Body Container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="w-screen max-w-md bg-slate-50 shadow-2xl flex flex-col h-full font-sans relative"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-white relative z-10 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative p-2.5 bg-orange-50 text-[#f57224] rounded-2xl border border-orange-100 shadow-3xs">
                    <ShoppingBag className="w-5 h-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[10px] w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 border-white font-mono shadow-xs animate-bounce">
                        {totalItems}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-900 tracking-tight font-display">আপনার শপিং ব্যাগ</h2>
                    <p className="text-xs text-slate-500">আপনার কার্টে থাকা সুবিধাজনক পণ্যসমূহ</p>
                  </div>
                </div>
                <button
                  id="close-cart-drawer"
                  onClick={onClose}
                  className="p-2 mr-0.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content - Items list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[150px]">
                {cartItems.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 text-slate-300 rounded-3xl flex items-center justify-center border border-slate-200/50 shadow-inner">
                      <ShoppingBag className="w-10 h-10" />
                    </div>
                    <div className="space-y-1.5 max-w-[260px]">
                      <h4 className="font-extrabold text-slate-800 text-base">শপিং কার্ট বর্তমানে খালি!</h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        আপনার পছন্দের ট্রেন্ডি এবং কার্যকরী পণ্যসমূহ কার্টে যুক্ত করুন এবং একসাথে চমৎকার ডিসকাউন্টে অর্ডার করুন।
                      </p>
                    </div>
                    <button
                      onClick={onClose}
                      className="bg-gradient-to-r from-[#f57224] via-[#ff6b2b] to-[#e04f05] hover:brightness-110 text-white font-bold text-xs px-6 py-3 rounded-2xl cursor-pointer shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center gap-2 border-0"
                    >
                      <span>এখনই কেনাকাটা করুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {cartItems.map((item) => (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.96, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -15 }}
                        transition={{ duration: 0.2 }}
                        className="flex gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-3xs hover:shadow-xs transition-all relative group"
                      >
                        {/* Product Thumbnail */}
                        <div className="w-20 h-20 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shrink-0 flex items-center justify-center group-hover:scale-102 transition-transform">
                          <img
                            src={item.product.image || fallbackImage}
                            alt={item.product.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain p-1"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackImage;
                            }}
                          />
                        </div>

                        {/* Info & Quantity controls */}
                        <div className="flex-grow space-y-1.5 text-left min-w-0 pr-6">
                          <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm line-clamp-2 leading-snug transition-colors group-hover:text-[#f57224]" title={item.product.name}>
                            {item.product.name}
                          </h4>
                          
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              Color: {item.color}
                            </span>
                            {item.selectedSize && (
                              <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md uppercase">
                                Size: {item.selectedSize}
                              </span>
                            )}
                            <span className="text-[#f57224] font-extrabold text-xs font-mono">
                              ৳ {item.product.price.toLocaleString('en-US')}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-slate-200/80 rounded-xl overflow-hidden bg-slate-50 shadow-3xs">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity > 1) {
                                    onUpdateQuantity(item.id, item.quantity - 1);
                                  }
                                }}
                                className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="font-extrabold text-xs text-slate-800 font-mono w-8 text-center bg-white self-stretch flex items-center justify-center border-x border-slate-150">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                className="w-11 h-11 md:w-8 md:h-8 flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-all cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Line item subtotal */}
                            <span className="text-slate-800 font-black font-mono text-xs">
                              ৳ {(item.product.price * item.quantity).toLocaleString('en-US')}
                            </span>
                          </div>
                        </div>

                        {/* Delete absolute button */}
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="absolute top-3 right-3 w-11 h-11 md:w-9 md:h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50/80 transition-all cursor-pointer"
                          title="কার্ট থেকে মুছুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Drawer Footer summary, Promo Code, & Checkout Action panel */}
              {cartItems.length > 0 && (
                <div className="border-t border-slate-200 bg-white relative z-10 shadow-[0_-4px_20px_rgba(15,23,42,0.06)] shrink-0 flex flex-col">
                  
                  {/* Dynamic Coupon Section */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <button 
                        onClick={() => setShowPromoCollapse(!showPromoCollapse)}
                        className="flex items-center gap-2 text-xs font-black text-slate-700 hover:text-[#f57224] cursor-pointer"
                      >
                        <Tag className="w-3.5 h-3.5 text-[#f57224]" />
                        <span>কুপন কোড ব্যবহার করুন (Apply Coupon)</span>
                      </button>
                      {appliedPromo && (
                        <button 
                          onClick={handleRemoveCoupon}
                          className="text-[10px] font-extrabold text-rose-500 hover:underline cursor-pointer"
                        >
                          মুছে ফেলুন
                        </button>
                      )}
                    </div>

                    {showPromoCollapse && (
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            placeholder="যেমন: WELCOME10"
                            disabled={!!appliedPromo || isValidatingCoupon}
                            className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#f57224]/10 disabled:bg-slate-100 disabled:text-slate-500 font-mono"
                          />
                          {!appliedPromo ? (
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon(couponInput)}
                              disabled={isValidatingCoupon || !couponInput.trim()}
                              className="bg-[#0f172a] hover:bg-[#1e293b] disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all select-none active:scale-95 cursor-pointer flex items-center justify-center"
                            >
                              {isValidatingCoupon ? '...' : 'প্রয়োগ'}
                            </button>
                          ) : (
                            <div className="bg-emerald-50 text-emerald-600 px-3 py-2 rounded-xl border border-emerald-200 text-xs font-bold flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              <span>Applied</span>
                            </div>
                          )}
                        </div>

                        {/* Status Messages */}
                        {couponError && (
                          <div className="text-[11px] font-bold text-rose-500 flex items-center gap-1.5 p-2 bg-rose-50 rounded-lg">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{couponError}</span>
                          </div>
                        )}
                        {couponSuccessMsg && (
                          <div className="text-[11px] font-bold text-emerald-600 flex items-center gap-1.5 p-2 bg-emerald-50 rounded-lg">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>{couponSuccessMsg}</span>
                          </div>
                        )}

                        {/* Clickable available promotions */}
                        {availableCoupons.length > 0 && !appliedPromo && (
                          <div className="space-y-1.5">
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider flex items-center gap-1">
                              <Gift className="w-3 h-3 text-orange-500" />
                              <span>আপনার জন্য প্রযোজ্য কুপনসমূহ:</span>
                            </p>
                            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full scrollbar-hidden">
                              {availableCoupons.map((promo) => {
                                const benefit = promo.type === 'flat' ? `৳ ${promo.value} ছাড়` : `${promo.value}% ছাড়`;
                                return (
                                  <button
                                    key={promo.id}
                                    type="button"
                                    onClick={() => {
                                      setCouponInput(promo.code);
                                      handleApplyCoupon(promo.code);
                                    }}
                                    className="p-1 px-2.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-slate-700 hover:border-[#f57224]/40 hover:text-[#f57224] flex items-center gap-1.5 select-none transition-all duration-200 cursor-pointer shrink-0 shadow-3xs"
                                  >
                                    <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
                                    <span>{promo.code}</span>
                                    <span className="text-slate-300">|</span>
                                    <span className="text-emerald-600">{benefit}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Summary Breakdowns */}
                  <div className="p-5 space-y-4">
                    <div className="space-y-2.5 text-xs text-slate-600">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">মোট মালামাল (Total Items)</span>
                        <span className="font-black text-slate-800 font-mono">{totalItems} টি</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">সুবটোটাল (Subtotal)</span>
                        <span className="font-black text-slate-800 font-mono">৳ {subtotal.toLocaleString('en-US')}</span>
                      </div>

                      {discountAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-600 font-bold bg-emerald-50/50 p-2 rounded-xl border border-emerald-100">
                          <span className="flex items-center gap-1">
                            <Percent className="w-3 h-3" />
                            <span>কুপন ডিসকাউন্ট (Discount)</span>
                          </span>
                          <span className="font-black font-mono">– ৳ {discountAmount.toLocaleString('en-US')}</span>
                        </div>
                      )}

                      <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-slate-800">
                        <span className="text-sm font-black uppercase tracking-wide">সর্বমোট মূল্য (Cart Total)</span>
                        <span className="text-2xl font-black text-rose-600 font-display font-mono">
                          ৳ {grandTotal.toLocaleString('en-US')}
                        </span>
                      </div>
                    </div>

                    {/* Primary CTA button */}
                    <div className="pt-1.5">
                      <button
                        id="cart-checkout-cta"
                        onClick={() => onCheckout(appliedPromo ? appliedPromo.code : undefined)}
                        className="w-full bg-gradient-to-r from-[#f57224] via-[#ff6b2b] to-[#e04f05] hover:brightness-110 text-white py-4 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-600/15 transition-all hover:translate-y-[-1px] active:translate-y-[0px] active:scale-[0.98] border-0"
                      >
                        <span>ডেলিভারি সম্পূর্ণ করুন (Proceed to Checkout)</span>
                        <ArrowRight className="w-4 h-4 text-white font-black" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
