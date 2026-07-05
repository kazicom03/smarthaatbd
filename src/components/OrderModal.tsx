import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Truck, 
  CreditCard, 
  Send, 
  ArrowLeft, 
  ArrowRight,
  ShoppingBag, 
  ShieldCheck, 
  Check, 
  ChevronRight,
  Info,
  User,
  Phone,
  Lock,
  Mail,
  MapPin,
  UserPlus,
  LogIn,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { Product, PaymentSettings, CartItem } from '../types';
import { collection, addDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/authContext';
import Logo from './Logo';

interface OrderModalProps {
  product: Product | null;
  cartItems?: CartItem[] | null;
  paymentSettings: PaymentSettings;
  initialQuantity?: number;
  initialColor?: string;
  initialSize?: string;
  initialCouponCode?: string;
  onClose: () => void;
  onSuccess: (phone: string) => void;
  onClearCart?: () => void;
}

export default function OrderModal({ 
  product, 
  cartItems = null,
  paymentSettings, 
  initialQuantity = 1, 
  initialColor = 'Black', 
  initialSize = '',
  initialCouponCode,
  onClose, 
  onSuccess,
  onClearCart
}: OrderModalProps) {
  const { profile, signUp, signIn, loading: authLoading } = useAuth();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [address, setAddress] = useState('');
  const [payMethod, setPayMethod] = useState<'COD' | 'Bkash' | 'Nagad' | 'Bank'>('COD');
  const [trxId, setTrxId] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<'inside' | 'outside'>('inside');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<'bkash' | 'nagad' | 'bank' | null>(null);

  // Secure Coupon and Promo States
  const [couponCode, setCouponCode] = useState(initialCouponCode || '');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccessMsg, setCouponSuccessMsg] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // Stream active coupons to show to customers during checkout
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'promo_codes'), (snapshot) => {
      const list: any[] = [];
      const today = new Date().setHours(0, 0, 0, 0);
      snapshot.forEach(docSnap => {
        const item = docSnap.data();
        const expiryTime = new Date(item.expiryDate).getTime();
        if (item.active === true && expiryTime >= today) {
          list.push({ id: docSnap.id, ...item });
        }
      });
      setAvailableCoupons(list);
    }, (err) => {
      console.error("Failed to stream checkout available coupons:", err);
    });
    return () => unsub();
  }, []);

  // Inland Auth States for logged out users
  const [modalAuthMode, setModalAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);

  // Inland Auth Inputs
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Sync profile details to the checkout inputs when logged in
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      
      const addrLower = (profile.address || '').toLowerCase();
      if (addrLower && !addrLower.includes('dhaka') && !addrLower.includes('ঢাকা')) {
        setDeliveryLocation('outside');
      } else {
        setDeliveryLocation('inside');
      }
    }
  }, [profile]);

  const isMultiItem = !product && cartItems && cartItems.length > 0;

  if (!product && !isMultiItem) return null;

  // Delivery charges calculations
  const insideFee = Number(
    paymentSettings.deliveryInside ?? 
    paymentSettings.insideDhaka ?? 
    paymentSettings.delivery_inside ?? 
    paymentSettings.inside_dhaka ?? 
    paymentSettings.insideDhakaFee ?? 
    80
  );
  
  const outsideFee = Number(
    paymentSettings.deliveryOutside ?? 
    paymentSettings.outsideDhaka ?? 
    paymentSettings.delivery_outside ?? 
    paymentSettings.outside_dhaka ?? 
    paymentSettings.outsideDhakaFee ?? 
    150
  );

  const deliveryCharge = deliveryLocation === 'inside' ? insideFee : outsideFee;
  const totalPrice = isMultiItem
    ? cartItems!.reduce((acc, item) => acc + item.product.price * item.quantity, 0)
    : (product ? product.price * initialQuantity : 0);

  // Auto recalculate coupon discount if totalPrice or appliedPromo changes
  useEffect(() => {
    if (appliedPromo) {
      const discount = appliedPromo.type === 'flat'
        ? Number(appliedPromo.value)
        : (totalPrice * Number(appliedPromo.value)) / 100;
      setDiscountAmount(discount);
    } else {
      setDiscountAmount(0);
    }
  }, [totalPrice, appliedPromo]);

  // Securely auto-apply coupon code passed from Cart Drawer or URL parameters
  useEffect(() => {
    if (initialCouponCode && totalPrice > 0) {
      const applyCouponInline = async () => {
        setIsValidatingCoupon(true);
        setCouponError(null);
        try {
          const docRef = doc(db, "promo_codes", initialCouponCode.toLowerCase());
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const promo = docSnap.data();
            const expiryTime = new Date(promo.expiryDate).getTime();
            const todayTime = new Date().setHours(0, 0, 0, 0);
            const minBuy = Number(promo.minPurchase || 0);

            if (promo.active === true && expiryTime >= todayTime && totalPrice >= minBuy) {
              const calculatedDiscount = promo.type === 'flat'
                ? Number(promo.value)
                : (totalPrice * Number(promo.value)) / 100;
              setAppliedPromo({
                code: promo.code,
                type: promo.type,
                value: promo.value,
                minPurchase: minBuy,
                expiryDate: promo.expiryDate,
                active: promo.active
              });
              setDiscountAmount(calculatedDiscount);
              setCouponSuccessMsg(`কুপন '${promo.code}' সফলভাবে প্রযুক্ত হয়েছে! আপনি পেয়েছেন ৳ ${calculatedDiscount.toLocaleString('en-US')} ছাড়।`);
            } else if (totalPrice < minBuy) {
              setCouponError(`কুপন '${promo.code}' ব্যবহারের জন্য ন্যূনতম ৳ ${minBuy} টাকার পণ্য অর্ডার করতে হবে।`);
            }
          }
        } catch (err) {
          console.error("Failed to query initial coupon code on checkout mount:", err);
        } finally {
          setIsValidatingCoupon(false);
        }
      };
      applyCouponInline();
    }
  }, [initialCouponCode, totalPrice]);

  const grandTotal = Math.max(0, totalPrice + deliveryCharge - discountAmount);

  // Copy helper
  const handleCopyNumber = (num: string, provider: 'bkash' | 'nagad' | 'bank') => {
    navigator.clipboard.writeText(num);
    setCopiedText(provider);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // Secure coupon code validation
  async function handleApplyCoupon(e: React.FormEvent) {
    if (e) e.preventDefault();
    setCouponError(null);
    setCouponSuccessMsg(null);

    const codeToTest = couponCode.trim();
    if (!codeToTest) {
      setCouponError('কোপন কোডটি লিখুন।');
      return;
    }

    setIsValidatingCoupon(true);
    const docId = codeToTest.toLowerCase();

    try {
      const docRef = doc(db, "promo_codes", docId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        setCouponError('ভুল কুপন কোড! দয়া করে সঠিক কোড দিন।');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      const promo = docSnap.data();

      if (promo.active !== true) {
        setCouponError('এই কুপন কোডটি বর্তমানে নিষ্ক্রিয় রয়েছে।');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      // Check expiry date
      const expiryTime = new Date(promo.expiryDate).getTime();
      const todayTime = new Date().setHours(0, 0, 0, 0);
      if (expiryTime < todayTime) {
        setCouponError('দুঃখিত, এই কুপন কোডের মেয়াদ শেষ হয়ে গেছে।');
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      // Check minimum purchase restriction
      const minBuy = Number(promo.minPurchase || 0);
      if (totalPrice < minBuy) {
        setCouponError(`এই কুপনটি ব্যবহার করতে ন্যূনতম ৳ ${minBuy} টাকার পণ্য অর্ডার করতে হবে।`);
        setAppliedPromo(null);
        setDiscountAmount(0);
        return;
      }

      // Success validation
      const calculatedDiscount = promo.type === 'flat'
        ? Number(promo.value)
        : (totalPrice * Number(promo.value)) / 100;

      setAppliedPromo({
        code: promo.code,
        type: promo.type,
        value: promo.value,
        minPurchase: minBuy,
        expiryDate: promo.expiryDate,
        active: promo.active
      });
      setDiscountAmount(calculatedDiscount);
      setCouponSuccessMsg(`কুপন '${promo.code}' সফলভাবে প্রযুক্ত হয়েছে! আপনি পেয়েছেন ৳ ${calculatedDiscount.toLocaleString('en-US')} ছাড়।`);
    } catch (err) {
      console.error('Coupon validation failed safely:', err);
      setCouponError('কুপন চেক করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      setAppliedPromo(null);
      setDiscountAmount(0);
    } finally {
      setIsValidatingCoupon(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setCouponCode('');
    setCouponError(null);
    setCouponSuccessMsg(null);
  }

  // Inline sign in handler during checkout
  const handleInlandLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthSubmitting(true);
    try {
      await signIn(loginId.trim(), loginPass.trim());
      setLoginId('');
      setLoginPass('');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('auth/invalid-credential') || err.message?.includes('auth/user-not-found') || err.message?.includes('auth/wrong-password')) {
        setAuthError('মোবাইল/জিমেইল অথবা পাসওয়ার্ড ভুল হয়েছে। সঠিক তথ্য দিয়ে আবার চেষ্টা করুন।');
      } else {
        setAuthError(err.message || 'লগইন প্রসেস করার সময় কোনো ভুল হয়েছে।');
      }
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Inline registration handler during checkout
  const handleInlandRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthSubmitting(true);

    const formattedName = regName.trim();
    const formattedPhone = regPhone.trim();
    const formattedEmail = regEmail.trim().toLowerCase();
    const formattedAddress = regAddress.trim();
    const formattedPassword = regPassword.trim();

    if (!formattedName || !formattedPhone || !formattedEmail || !formattedPassword) {
      setAuthError('স্টার চিহ্নিত সবগুলো ঘর অবশ্যই পূরণ করুন।');
      setIsAuthSubmitting(false);
      return;
    }

    // Clean and validate phone
    let cleanedPhone = formattedPhone.replace(/[\s\-\+]/g, '');
    if (cleanedPhone.startsWith('8801')) {
      cleanedPhone = cleanedPhone.substring(2);
    }
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!bdPhoneRegex.test(cleanedPhone)) {
      setAuthError('দয়া করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      setIsAuthSubmitting(false);
      return;
    }

    if (!formattedEmail.includes('@') || !formattedEmail.endsWith('@gmail.com')) {
      setAuthError('দয়া করে একটি সঠিক জিমেইল আইডি দিন (যেমন: example@gmail.com)');
      setIsAuthSubmitting(false);
      return;
    }

    // Address length check if provided during register
    if (formattedAddress && formattedAddress.length < 10) {
      setAuthError('ডেলিভারি ঠিকানা অনেক সংক্ষিপ্ত। অনুগ্রহ করে বিস্তারিত লিখুন।');
      setIsAuthSubmitting(false);
      return;
    }

    if (formattedPassword.length < 6) {
      setAuthError('পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।');
      setIsAuthSubmitting(false);
      return;
    }

    try {
      await signUp(formattedName, formattedEmail, cleanedPhone, formattedAddress, formattedPassword);
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegAddress('');
      setRegPassword('');
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('auth/email-already-in-use')) {
        setAuthError('এই জিমেইল আইডি দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা আছে।');
      } else {
        setAuthError(err.message || 'নিবন্ধন করার সময় সমস্যা হয়েছে।');
      }
    } finally {
      setIsAuthSubmitting(false);
    }
  };

  // Submit Order to Firestore
  async function handleSubmitOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) {
      setErrorMsg('অর্ডার সম্পূর্ণ করতে দয়া করে আগে লগইন অথবা সাইন আপ করুন।');
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('দয়া করে আপনার পূর্ণ নাম লিখুন।');
      return;
    }

    // Clean and validate Bangladesh phone number
    let cleanedPhone = phone.trim().replace(/[\s\-\+]/g, '');
    if (cleanedPhone.startsWith('8801')) {
      cleanedPhone = cleanedPhone.substring(2);
    }
    const bdPhoneRegex = /^01[3-9]\d{8}$/;
    if (!cleanedPhone) {
      setErrorMsg('দয়া করে আপনার সচল মোবাইল নম্বর লিখুন।');
      return;
    }
    if (!bdPhoneRegex.test(cleanedPhone)) {
      setErrorMsg('দয়া করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
      return;
    }

    // Validate empty or short address
    const trimmedAddress = address.trim();
    if (!trimmedAddress) {
      setErrorMsg('ডেলিভারি সম্পন্ন করার জন্য সম্পূর্ণ ঠিকানা অবশ্যই প্রদান করতে হবে।');
      return;
    }
    if (trimmedAddress.length < 10) {
      setErrorMsg('ডেলিভারি ঠিকানা অনেক সংক্ষিপ্ত। ন্যূনতম বিবরণ সহ সম্পূর্ণ ঠিকানা দিন (যেমন: ফ্ল্যাট/রোড, এলাকার নাম, থানা এবং জেলা)।');
      return;
    }

    if (payMethod !== 'COD' && !trxId.trim()) {
      setErrorMsg('পেমেন্ট ভেরিফাই করার জন্য ট্রানজেকশন আইডি (TxID) লিখুন।');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const pathForWrite = 'orders';
    try {
      await addDoc(collection(db, pathForWrite), {
        userId: profile.uid,
        productName: isMultiItem 
          ? cartItems!.map(item => `${item.product.name} (${item.color}${item.selectedSize ? ' - ' + item.selectedSize : ''} x${item.quantity})`).join(', ')
          : product!.name,
        productPrice: totalPrice,
        quantity: isMultiItem
          ? cartItems!.reduce((acc, m) => acc + m.quantity, 0)
          : initialQuantity,
        color: isMultiItem
          ? cartItems!.map(item => item.color).join(', ')
          : initialColor,
        selectedSize: isMultiItem
          ? cartItems!.map(item => item.selectedSize || 'N/A').join(', ')
          : (initialSize || ''),
        customerName: trimmedName,
        customerPhone: cleanedPhone,
        customerAddress: trimmedAddress,
        paymentMethod: payMethod,
        transactionId: payMethod === 'COD' ? 'COD (No ID)' : trxId.trim(),
        status: 'Pending',
        time: Date.now(),
        deliveryLocation: deliveryLocation === 'inside' ? 'Inside Dhaka City' : 'Outside Dhaka',
        deliveryCharge: deliveryCharge,
        totalAmount: grandTotal,
        appliedPromo: appliedPromo ? appliedPromo.code : null,
        discountAmount: discountAmount,
        items: isMultiItem
          ? cartItems!.map(item => ({
              id: item.product.id,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              color: item.color,
              selectedSize: item.selectedSize || '',
              image: item.product.image || ''
            }))
          : [{
              id: product!.id,
              name: product!.name,
              price: product!.price,
              quantity: initialQuantity,
              color: initialColor,
              selectedSize: initialSize || '',
              image: product!.image || ''
            }]
      });

      onSuccess(cleanedPhone);
      if (isMultiItem && onClearCart) {
        onClearCart();
      }
      onClose();
    } catch (err) {
      setErrorMsg('অর্ডার সাবমিট করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
      try {
        handleFirestoreError(err, OperationType.WRITE, pathForWrite);
      } catch (logErr) {
        console.error('Logged Firestore internal schema failure:', logErr);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const bkashNum = paymentSettings.bkash || '';
  const nagadNum = paymentSettings.nagad || '';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto flex flex-col font-sans">
        {/* Modern Top Header bar */}
        <header id="checkout-header" className="sticky top-0 bg-white border-b border-slate-200 z-10 px-4 sm:px-6 lg:px-8 py-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button 
              id="back-to-shop-btn"
              onClick={onClose}
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer group"
            >
              <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
              <span>Continue Shopping</span>
            </button>
            <Logo size="sm" variant="light" />
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline font-mono">Secure SSL Checkout</span>
            </div>
          </div>
        </header>

        {/* Main Content Pane */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Side: Order Intake Form or Authentication Form */}
            <div id="checkout-form-pane" className="lg:col-span-7 space-y-6">
              
              {profile && (
                <div id="checkout-progress-stepper" className="bg-white border border-slate-200/80 rounded-2xl p-4.5 shadow-[0_2px_12px_rgba(15,23,42,0.02)] flex items-center justify-between font-sans">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      step === 1 
                        ? 'bg-[#f57224] text-white ring-4 ring-orange-100 shadow-sm' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {step > 1 ? <Check className="w-4 h-4 text-emerald-600" /> : '১'}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-800 leading-none">ঠিকানা ও কন্টাক্ট</h4>
                      <p className="text-[10px] text-slate-400 mt-1">যোগাযোগ এবং ডেলিভারি এলাকা</p>
                    </div>
                  </div>
                  <div className="flex-1 h-px bg-slate-200 mx-3 max-w-[40px] sm:max-w-[80px]" />
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      step === 2 
                        ? 'bg-[#f57224] text-white ring-4 ring-orange-100 shadow-sm' 
                        : 'bg-slate-150 text-slate-400'
                    }`}>
                      ২
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 leading-none">নিরাপদ পেমেন্ট</h4>
                      <p className="text-[10px] text-slate-400 mt-1">পদ্ধতি নির্বাচন ও অর্ডার সম্পূর্ণ</p>
                    </div>
                  </div>
                </div>
              )}

              {!profile ? (
                /* --- INLINE AUTHENTICATION PROMPT --- */
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
                  <div className="text-center space-y-2 max-w-md mx-auto">
                    <div className="w-12 h-12 bg-orange-50 text-[#f57224] rounded-2xl flex items-center justify-center mx-auto border border-orange-100 shadow-xs">
                      <User className="w-6 h-6" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-display font-black text-slate-900 leading-tight">অর্ডার করতে প্রথমে সাইন ইন করুন</h2>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      সহজে অর্ডার করতে এবং ডেলিভারি ট্র্যাকিং সুবিধা পেতে আপনর একটি অ্যাকাউন্ট প্রয়োজন।
                    </p>
                  </div>

                  {/* Auth mode switcher */}
                  <div className="flex border-b border-slate-100 max-w-xs mx-auto">
                    <button
                      type="button"
                      onClick={() => { setModalAuthMode('login'); setAuthError(''); }}
                      className={`flex-1 text-center py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                        modalAuthMode === 'login' 
                          ? 'border-[#f57224] text-[#f57224]' 
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      লগইন করুন
                    </button>
                    <button
                      type="button"
                      onClick={() => { setModalAuthMode('register'); setAuthError(''); }}
                      className={`flex-1 text-center py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
                        modalAuthMode === 'register' 
                          ? 'border-[#f57224] text-[#f57224]' 
                          : 'border-transparent text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      নতুন অ্যাকাউন্ট
                    </button>
                  </div>

                  {authError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs font-medium">
                      {authError}
                    </div>
                  )}

                  {modalAuthMode === 'login' ? (
                    <form onSubmit={handleInlandLogin} className="space-y-4 max-w-sm mx-auto">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 font-display">
                          <Phone className="w-3 h-3 text-[#f57224]" />
                          <span>মোবাইল নম্বর অথবা জিমেইল</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={loginId}
                          onChange={(e) => setLoginId(e.target.value)}
                          placeholder="como: 017XXXXXXXX বা info@gmail.com"
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#f57224]/10 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 flex items-center gap-1 font-display">
                          <Lock className="w-3 h-3 text-[#f57224]" />
                          <span>পাসওয়ার্ড</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showLoginPassword ? "text" : "password"}
                            required
                            value={loginPass}
                            onChange={(e) => setLoginPass(e.target.value)}
                            placeholder="পাসওয়ার্ড লিখুন"
                            className="w-full border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#f57224]/10 font-mono"
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
                        disabled={isAuthSubmitting}
                        className="w-full bg-[#0f172a] hover:bg-[#1e293b] disabled:bg-slate-400 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 border-0"
                      >
                        {isAuthSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogIn className="w-4 h-4" />
                        )}
                        <span>লগইন করুন</span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleInlandRegister} className="space-y-4 max-w-md mx-auto">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 font-display">আপনার পূর্ণ নাম *</label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="যেমন: আসিফ রহমান"
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#f57224]/10 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 font-display">মোবাইল নম্বর *</label>
                          <input
                            type="tel"
                            required
                            value={regPhone}
                            onChange={(e) => setRegPhone(e.target.value)}
                            placeholder="যেমন: 017XXXXXXXX"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#f57224]/10 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1 font-display">জিমেইল ইমেইল *</label>
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="যেমন: username@gmail.com"
                            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#f57224]/10 font-mono"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 font-display">ডেলিভারী ঠিকানা</label>
                        <textarea
                          rows={2}
                          value={regAddress}
                          onChange={(e) => setRegAddress(e.target.value)}
                          placeholder="যেমন: বাসা/রোড, থানা, জেলা শহর"
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#f57224]/10 resize-none leading-relaxed"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 font-display">পাসওয়ার্ড *</label>
                        <div className="relative">
                          <input
                            type={showRegPassword ? "text" : "password"}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড"
                            className="w-full border border-slate-200 rounded-xl pl-4 pr-10 py-2.5 text-sm outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#f57224]/10 font-mono"
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
                        disabled={isAuthSubmitting}
                        className="w-full bg-[#0f172a] hover:bg-[#1e293b] disabled:bg-slate-400 text-white font-bold text-sm py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-98 border-0"
                      >
                        {isAuthSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserPlus className="w-4 h-4" />
                        )}
                        <span>নিবন্ধন বা সাইন আপ সম্পন্ন করুন</span>
                      </button>
                    </form>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmitOrder} className="space-y-6">
                  {step === 1 && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                      {/* 1. Address Area Card */}
                      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.02)] space-y-4">
                        <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5 font-display">
                          <Truck className="w-4 h-4 text-[#f57224]" />
                          <span>ডেলিভারি এলাকা নির্বাচন করুন (Select Shipping Area)</span>
                        </h3>
                        
                        <div className="grid grid-cols-2 gap-3.5">
                          <button
                            type="button"
                            onClick={() => setDeliveryLocation('inside')}
                            className={`flex flex-col items-start p-4.5 rounded-xl border-2 transition-all cursor-pointer text-left relative ${
                              deliveryLocation === 'inside'
                                ? 'border-[#f57224] bg-orange-50/15 shadow-sm text-orange-950 ring-2 ring-[#f57224]/10'
                                : 'border-slate-200 hover:border-slate-350 bg-white text-slate-600'
                            }`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Option 1</span>
                            <span className="text-sm font-extrabold text-slate-800 font-display">Inside Dhaka City</span>
                            <span className="text-xs text-slate-400 mt-1">৪-৫ দিনের মধ্যে হোম ডেলিভারি</span>
                            <span className="text-sm font-black text-[#f57224] mt-2 font-display font-mono">৳ {insideFee}</span>

                            {deliveryLocation === 'inside' && (
                              <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#f57224] text-white rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 font-black text-white" />
                              </div>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeliveryLocation('outside')}
                            className={`flex flex-col items-start p-4.5 rounded-xl border-2 transition-all cursor-pointer text-left relative ${
                              deliveryLocation === 'outside'
                                ? 'border-[#f57224] bg-orange-50/15 shadow-sm text-orange-950 ring-2 ring-[#f57224]/10'
                                : 'border-slate-200 hover:border-slate-350 bg-white text-slate-600'
                            }`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">Option 2</span>
                            <span className="text-sm font-extrabold text-slate-800 font-display">Outside Dhaka</span>
                            <span className="text-xs text-slate-400 mt-1">৬-৭ দিনের মধ্যে ডেলিভারি</span>
                            <span className="text-sm font-black text-[#f57224] mt-2 font-display font-mono">৳ {outsideFee}</span>

                            {deliveryLocation === 'outside' && (
                              <div className="absolute top-2.5 right-2.5 w-5 h-5 bg-[#f57224] text-white rounded-full flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 font-black text-white" />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 2. Customer Contact Details */}
                      <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.02)] space-y-4">
                        <h3 className="text-sm font-bold text-slate-850 flex items-center gap-1.5 font-display">
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>আপনার যোগাযোগের তথ্য ও ঠিকানা (Contact Information)</span>
                        </h3>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-2 font-display">আপনার পূর্ণ নাম * (Your Full Name)</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <User className="w-4 h-4" />
                              </span>
                              <input 
                                id="custName"
                                type="text" 
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="যেমন: আসিফ রহমান / Asif Rahman" 
                                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#f57224] focus:ring-4 focus:ring-[#f57224]/5 transition-all font-medium placeholder-slate-400/80"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-2 font-display">মোবাইল নম্বর * (Your Active Mobile Number)</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                                <Phone className="w-4 h-4" />
                              </span>
                              <input 
                                id="custPhone"
                                type="tel" 
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="যেমন: 017XXXXXXXX" 
                                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#f57224] focus:ring-4 focus:ring-[#f57224]/5 transition-all font-mono font-medium placeholder-slate-400/80"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-655 uppercase tracking-wider mb-2 font-display">সম্পূর্ণ ডেলিভারি ঠিকানা * (Full Delivery Address)</label>
                            <div className="relative">
                              <span className="absolute left-3.5 top-4.5 text-slate-400">
                                <MapPin className="w-4 h-4" />
                              </span>
                              <textarea 
                                id="custAddress"
                                required
                                rows={3}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                placeholder="সঠিক ডেলিভারির স্বার্থে ফ্ল্যাট নং, রোড নং, এলাকার নাম, থানা এবং জেলা বিস্তারিত লিখুন" 
                                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#f57224] focus:ring-4 focus:ring-[#f57224]/5 transition-all font-medium resize-none leading-relaxed placeholder-slate-400/80"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Proceed to Step 2 Button */}
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setErrorMsg(null);
                            const trimmedName = name.trim();
                            if (!trimmedName) {
                              setErrorMsg('দয়া করে আপনার পূর্ণ নাম লিখুন।');
                              return;
                            }

                            let cleanedPhone = phone.trim().replace(/[\s\-\+]/g, '');
                            if (cleanedPhone.startsWith('8801')) {
                              cleanedPhone = cleanedPhone.substring(2);
                            }
                            const bdPhoneRegex = /^01[3-9]\d{8}$/;
                            if (!cleanedPhone) {
                              setErrorMsg('দয়া করে আপনার সচল মোবাইল নম্বর লিখুন।');
                              return;
                            }
                            if (!bdPhoneRegex.test(cleanedPhone)) {
                              setErrorMsg('দয়া করে একটি সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।');
                              return;
                            }

                            const trimmedAddress = address.trim();
                            if (!trimmedAddress) {
                              setErrorMsg('ডেলিভারি সম্পন্ন করার জন্য সম্পূর্ণ ঠিকানা অবশ্যই প্রদান করতে হবে।');
                              return;
                            }
                            if (trimmedAddress.length < 10) {
                              setErrorMsg('ডেলিভারি ঠিকানা অনেক সংক্ষিপ্ত। ন্যূনতম বিবরণ সহ সম্পূর্ণ ঠিকানা দিন (যেমন: ফ্ল্যাট/রোড, এলাকার নাম, থানা এবং জেলা)।');
                              return;
                            }

                            setErrorMsg(null);
                            setStep(2);
                          }}
                          className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white font-extrabold uppercase tracking-wider text-xs sm:text-sm py-4 px-6 rounded-2xl shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 flex items-center justify-center gap-2"
                        >
                          <span>পরবর্তী ধাপে যান (পেমেন্ট পদ্ধতি)</span>
                          <ArrowRight className="w-4 h-4 animate-pulse" />
                        </button>
                      </div>
                    </div>
                  )}

                                        {step === 2 && (
                      <div className="space-y-5 animate-in fade-in duration-300">
                        {/* 3. Secure Payment System */}
                        <div className="bg-white border border-slate-200/90 p-5 rounded-2xl shadow-[0_2px_12px_rgba(15,23,42,0.02)] space-y-4">
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-[#f57224]" />
                            <span>নিরাপদ পেমেন্ট পদ্ধতি নির্বাচন করুন (Secure Payment Method)</span>
                          </h3>

                          {/* Payment Select Pill Buttons */}
                          <div className="grid grid-cols-2 gap-3.5">
                            {[
                              { key: 'COD', title: 'Cash on Delivery', desc: 'পণ্য পেয়ে মূল্য পরিশোধ' },
                              { key: 'Bkash', title: 'bKash Send Money', desc: 'বিকাশ সেন্ড মানি করুন' },
                              { key: 'Nagad', title: 'Nagad Send Money', desc: 'নগদ সেন্ড মানি করুন' },
                              { key: 'Bank', title: 'Bank Transfer', desc: 'ব্যাংক একাউন্ট ট্রান্সফার' }
                            ].map((item) => (
                              <button
                                type="button"
                                key={item.key}
                                onClick={() => {
                                  setPayMethod(item.key as any);
                                  setErrorMsg(null);
                                }}
                                className={`flex items-center gap-3 p-4 rounded-xl border text-left cursor-pointer relative transition-all min-h-[58px] ${
                                  payMethod === item.key 
                                    ? 'border-[#f57224] bg-orange-50/15 shadow-xs ring-1 ring-[#f57224]/10'
                                    : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                                }`}
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  payMethod === item.key ? 'bg-[#f57224] text-white' : 'bg-slate-100 text-slate-400'
                                }`}>
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 pr-4">
                                  <h4 className={`text-xs font-bold leading-tight ${payMethod === item.key ? 'text-[#f57224]' : 'text-slate-800'}`}>
                                    {item.title}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 leading-none mt-1 block">
                                    {item.desc}
                                  </span>
                                </div>
                                {payMethod === item.key && (
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#f57224] text-white rounded-full flex items-center justify-center">
                                    <Check className="w-2.5 h-2.5 font-bold" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>

                          {/* dynamic info banners for selected transfer methods */}
                          {payMethod !== 'COD' && (
                            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 text-xs text-white leading-relaxed space-y-3 shadow-md">
                              {payMethod === 'Bkash' && (
                                <div>
                                  <p className="text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-[10px]">Payment Guide</p>
                                  <p className="text-slate-200 text-sm leading-relaxed">
                                    Please complete <strong>Send Money</strong> of <strong className="text-[#f57224] font-display text-base">৳ {grandTotal.toLocaleString('en-US')}</strong> to our personal bKash number:
                                  </p>
                                  <div className="flex items-center justify-between mt-3 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                                    <span className="font-mono font-bold text-white text-base tracking-widest">{bkashNum || 'Not Provided'}</span>
                                    {bkashNum && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyNumber(bkashNum, 'bkash')}
                                        className="bg-[#f57224] px-3 py-1.5 rounded text-[11px] text-white font-bold hover:bg-[#e04f05] active:scale-95 transition-all border-0"
                                      >
                                        {copiedText === 'bkash' ? 'Copied!' : 'Copy'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {payMethod === 'Nagad' && (
                                <div>
                                  <p className="text-slate-400 font-medium mb-1.5 uppercase tracking-wider text-[10px]">Payment Guide</p>
                                  <p className="text-slate-200 text-sm leading-relaxed">
                                    Please complete <strong>Send Money</strong> of <strong className="text-[#f57224] font-display text-base">৳ {grandTotal.toLocaleString('en-US')}</strong> to our personal Nagad number:
                                  </p>
                                  <div className="flex items-center justify-between mt-3 bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                                    <span className="font-mono font-bold text-white text-base tracking-widest">{nagadNum || 'Not Provided'}</span>
                                    {nagadNum && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopyNumber(nagadNum, 'nagad')}
                                        className="bg-[#f57224] px-3 py-1.5 rounded text-[11px] text-white font-bold hover:bg-[#e04f05] active:scale-95 transition-all border-0"
                                      >
                                        {copiedText === 'nagad' ? 'Copied!' : 'Copy'}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}

                              {payMethod === 'Bank' && (() => {
                                const hasStructuredBank = !!(
                                  paymentSettings.bankName || 
                                  paymentSettings.bankAccountNumber || 
                                  paymentSettings.bankAccountName || 
                                  paymentSettings.bankBranch
                                );
                                return (
                                  <div className="space-y-3 font-sans">
                                    <p className="text-slate-400 font-medium mb-1 text-xs uppercase tracking-wider">BANK ACCOUNT INSTRUCTION</p>
                                    
                                    {hasStructuredBank ? (
                                      <div className="relative overflow-hidden bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-slate-800 rounded-2xl p-4.5 space-y-4 shadow-xl select-none">
                                        <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                                        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
                                        
                                        <div className="flex justify-between items-start gap-4">
                                          <div className="min-w-0 flex-1">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block leading-none mb-1">Bank Name</span>
                                            <span className="text-sm font-extrabold text-white font-display block select-all truncate" title={paymentSettings.bankName}>
                                              {paymentSettings.bankName || 'Not Specified'}
                                            </span>
                                          </div>
                                          {paymentSettings.bankBranch && (
                                            <div className="text-right shrink-0">
                                              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block leading-none mb-1">Branch</span>
                                              <span className="text-xs font-semibold text-slate-300 block">
                                                {paymentSettings.bankBranch}
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        <div>
                                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest block leading-none mb-1">Account Holder</span>
                                          <span className="text-xs font-bold text-slate-200 block select-all truncate" title={paymentSettings.bankAccountName}>
                                            {paymentSettings.bankAccountName || 'Not Specified'}
                                          </span>
                                        </div>

                                        <div className="bg-slate-950/40 rounded-xl border border-slate-800/80 p-3 flex items-center justify-between gap-3">
                                          <div className="min-w-0 flex-1">
                                            <span className="text-[8px] text-slate-400 font-extrabold uppercase tracking-widest block leading-none mb-1">Account Number</span>
                                            <span className="text-sm font-black text-emerald-400 font-mono tracking-wider truncate block select-all">
                                              {paymentSettings.bankAccountNumber || 'N/A'}
                                            </span>
                                          </div>
                                          {paymentSettings.bankAccountNumber && (
                                            <button
                                              type="button"
                                              onClick={() => handleCopyNumber(paymentSettings.bankAccountNumber!, 'bank')}
                                              className="px-3.5 py-2 bg-[#f57224] hover:bg-[#e04f05] active:scale-95 text-[10px] font-black tracking-wider text-white uppercase rounded-lg shadow-sm transition-all shrink-0 cursor-pointer border-0"
                                            >
                                              {copiedText === 'bank' ? 'Copied!' : 'Copy'}
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-1">
                                        <pre className="whitespace-pre-line text-slate-100 font-mono text-[11px] leading-relaxed">
                                          {paymentSettings.bank || 'Bank information is not added by Admin yet.'}
                                        </pre>
                                      </div>
                                    )}

                                    <p className="text-slate-300 leading-normal text-xs pt-1">
                                      Transfer <strong>৳ {grandTotal.toLocaleString('en-US')}</strong> to this account, and input your bank reference or phone number below as TxID.
                                    </p>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {/* Transaction Code input for digital wallets */}
                          {payMethod !== 'COD' && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Transaction ID (TxID) *</label>
                              <input 
                                id="trxId"
                                type="text" 
                                required={payMethod !== 'COD'}
                                value={trxId}
                                onChange={(e) => setTrxId(e.target.value)}
                                placeholder="como: 8JN6X7F9" 
                                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-extrabold outline-none focus:border-[#0f172a] focus:ring-4 focus:ring-[#f57224]/10 transition-all uppercase placeholder-slate-400"
                              />
                            </div>
                          )}
                        </div>

                        {/* Error Banner */}
                        {errorMsg && (
                          <div className="bg-rose-50 border border-rose-100/80 text-rose-700 p-4 rounded-2xl text-xs font-semibold flex items-center gap-2">
                            <Info className="w-4 h-4 text-rose-500 shrink-0" />
                            <span>{errorMsg}</span>
                          </div>
                        )}

                        {/* Submit Action Block */}
                        <div className="pt-2 space-y-3">
                          <button 
                            id="submit-order-button"
                            type="submit" 
                            disabled={isSubmitting}
                            className="w-full bg-gradient-to-r from-[#f57224] via-[#ff6b2b] to-[#e04f05] hover:brightness-110 disabled:bg-slate-400 text-white font-black uppercase tracking-wider text-xs sm:text-sm py-4 px-6 rounded-2xl shadow-lg shadow-orange-600/15 cursor-pointer transition-all duration-200 flex items-center justify-center gap-2.5 transform active:scale-98 border-0"
                          >
                            {isSubmitting ? (
                              <>
                                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                                <span>Processing Order...</span>
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 text-white" />
                                <span>Place Order Now • ৳ {grandTotal.toLocaleString('en-US')}</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs py-3.5 rounded-2xl cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
                          >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span>পূর্ববর্তী ধাপে ফিরুন</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </form>
              )}
            </div>

            {/* Right Side: Order Summary Card Sticky Panel (5 columns on lg) */}
            <div id="checkout-summary-pane" className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl opacity-40 -z-10" />
                
                <h2 className="text-sm sm:text-base font-extrabold text-[#0f172a] mb-4 flex items-center justify-between">
                  <span>Order Summary</span>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-bold">
                    {isMultiItem ? cartItems!.reduce((acc, item) => acc + item.quantity, 0) : 1} Items
                  </span>
                </h2>

                {/* Selected Product Card Detail preview */}
                {isMultiItem ? (
                  <div className="max-h-60 overflow-y-auto space-y-3.5 pb-4 border-b border-slate-100">
                    {cartItems!.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        <img 
                          src={item.product.image || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=400'} 
                          alt={item.product.name} 
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1 leading-tight">
                            {item.product.name}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 mt-0.5 whitespace-nowrap">
                            Color: <strong className="text-slate-600">{item.color}</strong>
                            {item.selectedSize && <> • Size: <strong className="text-slate-600 uppercase">{item.selectedSize}</strong></>}
                            • Qty: <strong className="text-slate-600">{item.quantity}</strong>
                          </p>
                        </div>
                        <span className="text-xs font-black text-slate-750 font-mono">
                          ৳ {(item.product.price * item.quantity).toLocaleString('en-US')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  product && (
                    <div className="flex items-start gap-4 pb-4 border-b border-slate-100">
                      {product.image && (
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-100 shrink-0"
                        />
                      )}
                      <div className="flex-1 space-y-1">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 leading-tight">
                          {product.name}
                        </h4>
                        <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                          <span className="text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-sm">
                            Color: <strong className="text-slate-700">{initialColor}</strong>
                          </span>
                          {initialSize && (
                            <span className="text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-sm uppercase">
                              Size: <strong className="text-slate-700">{initialSize}</strong>
                            </span>
                          )}
                          <span className="text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-sm">
                            Quantity: <strong className="text-slate-700">{initialQuantity}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}

                {/* Subtotals & Breakdowns */}
                <div className="py-4 space-y-3.5 border-b border-slate-100 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Product Price</span>
                    <span className="font-bold text-slate-800 font-display font-mono">৳ {totalPrice.toLocaleString('en-US')}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium flex items-center gap-1">
                      <span>Delivery Charge</span>
                      <span className="text-[10px] text-[#f57224] bg-orange-50 px-1.5 py-0.2 rounded-sm font-bold">
                        {deliveryLocation === 'inside' ? 'Inside City' : 'Outside City'}
                      </span>
                    </span>
                    <span className="font-bold text-slate-800 font-display font-mono">৳ {deliveryCharge.toLocaleString('en-US')}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 font-semibold bg-emerald-50/40 p-1.5 rounded-lg border border-emerald-100/40">
                      <span className="flex items-center gap-1">
                        <span>Discount Applied</span>
                        <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-extrabold font-mono">
                          {appliedPromo?.code}
                        </span>
                      </span>
                      <span className="font-bold font-mono">- ৳ {discountAmount.toLocaleString('en-US')}</span>
                    </div>
                  )}
                </div>

                {/* Coupon Code Input field */}
                <div className="py-3.5 border-b border-slate-100">
                  {!appliedPromo ? (
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest font-display">
                        Promo / Coupon Code
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          placeholder="e.g., EID50, SAVE20"
                          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold outline-none focus:border-[#0f172a] focus:ring-1 focus:ring-[#f57224]/10 uppercase placeholder-slate-300"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={isValidatingCoupon}
                          className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-lg text-xs font-bold transition-all shrink-0 active:scale-95 cursor-pointer disabled:bg-slate-300"
                        >
                          {isValidatingCoupon ? '...' : 'Apply'}
                        </button>
                      </div>
                      
                      {/* Removed redundant available coupons list to keep checkout form clean and elegant */}

                      {couponError && (
                        <p className="text-[10px] text-rose-600 font-semibold">{couponError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100/80 rounded-xl p-2.5">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-emerald-850 flex items-center gap-1 leading-none uppercase tracking-wide">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Coupon Applied</span>
                        </p>
                        <p className="text-xs font-black text-emerald-700 mt-1 font-mono">{appliedPromo.code}</p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        className="text-[10px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded transition-colors cursor-pointer border border-slate-200"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {couponSuccessMsg && (
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1.5 leading-relaxed">{couponSuccessMsg}</p>
                  )}
                </div>

                {/* Grand Total */}
                <div className="pt-4 flex justify-between items-baseline">
                  <span className="text-sm font-bold text-slate-800">Total Payable</span>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#f57224] font-display tracking-tight font-mono">৳ {grandTotal.toLocaleString('en-US')}</span>
                    <p className="text-[9px] text-slate-400 font-medium">All taxes and duties included</p>
                  </div>
                </div>
              </div>

              {/* Secure checkout assurances */}
              <div className="bg-slate-100/50 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Checkout Assurance</h4>
                <div className="space-y-2.5">
                  <div className="flex gap-2.5 text-xs text-slate-600 leading-normal">
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#f57224]" />
                    </div>
                    <span>Inspect item closely upon delivery before finalizing payment.</span>
                  </div>
                  <div className="flex gap-2.5 text-xs text-slate-600 leading-normal">
                    <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-[#f57224]" />
                    </div>
                    <span>Fast shipping dispatch from central hub in Genda, Savar.</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </AnimatePresence>
  );
}
