import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../lib/authContext';
import { Order } from '../types';
import { 
  Search, Loader2, Calendar, ClipboardCheck, Tag, Trash2, X, 
  Check, ShoppingBag, Eye, HelpCircle, ArrowRight, Star, Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getOrderNumber, getTrackingNumber } from '../lib/orderUtils';

interface MyOrdersViewProps {
  initialPhone?: string;
}

type OrderFilterTab = 'all' | 'to_pay' | 'to_ship' | 'to_receive' | 'to_review';

export default function MyOrdersView({ initialPhone = '' }: MyOrdersViewProps) {
  const { profile } = useAuth();
  
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [searchPhone, setSearchPhone] = useState(initialPhone);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [submittingSearch, setSubmittingSearch] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Real-time Search / Filter query State
  const [searchQuery, setSearchQuery] = useState('');
  // Selected Filter Tab State
  const [activeFilterTab, setActiveFilterTab] = useState<OrderFilterTab>('all');
  
  // Order delete states
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Clipboard copy tracker inside orders
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'order' | 'track' | null>(null);

  const handleCopyText = (text: string, id: string, type: 'order' | 'track') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  // Sync state if initialPhone changes
  useEffect(() => {
    if (initialPhone) {
      setPhoneInput(initialPhone);
      setSearchPhone(initialPhone);
    }
  }, [initialPhone]);

  // Handle active real-time query listener
  useEffect(() => {
    // Determine search target: logged-in uid or tracked phone number
    if (!profile && !searchPhone) {
      setOrders([]);
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const ordersPath = 'orders';
    const q = profile 
      ? query(collection(db, ordersPath), where('userId', '==', profile.uid))
      : query(collection(db, ordersPath), where('customerPhone', '==', searchPhone));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: Order[] = [];
        snapshot.forEach((docSnap) => {
          fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as Order);
        });
        
        // Sort in memory by time (newest/highest time first)
        fetchedOrders.sort((a, b) => {
          const timeA = typeof a.time === 'number' ? a.time : 0;
          const timeB = typeof b.time === 'number' ? b.time : 0;
          return timeB - timeA;
        });

        setOrders(fetchedOrders);
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        setErrorMsg('ডেলিভারি স্থিতি অনুসন্ধানকালে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
        try {
          handleFirestoreError(error, OperationType.GET, ordersPath);
        } catch (logErr) {
          console.error('Logged internal query failure:', logErr);
        }
      }
    );

    return () => unsubscribe();
  }, [searchPhone, profile]);

  function handlePhoneSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setErrorMsg('অনুসন্ধান করার জন্য মোবাইল নম্বর দিন।');
      return;
    }
    setSubmittingSearch(true);
    setSearchPhone(phoneInput.trim());
    setTimeout(() => {
      setSubmittingSearch(false);
    }, 650);
  }

  async function handleConfirmCancel(orderId: string) {
    setIsDeleting(true);
    try {
      const docRef = doc(db, 'orders', orderId);
      await deleteDoc(docRef);
      setDeletingOrderId(null);
    } catch (err) {
      console.error('Failed to delete order:', err);
      setErrorMsg('অর্ডার বাতিল করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
    } finally {
      setIsDeleting(false);
    }
  }

  // Filter orders by text and tab status
  const processedOrders = orders.filter((order) => {
    // 1. Text Search Filter (Order ID, Product Name, Transaction ID, Delivery Details)
    const queryStr = searchQuery.toLowerCase().trim();
    if (queryStr) {
      const orderNum = order.id ? getOrderNumber({ id: order.id, time: order.time, paymentMethod: order.paymentMethod }) : '';
      const trackNum = order.id ? getTrackingNumber({ id: order.id, time: order.time, paymentMethod: order.paymentMethod, trackingNumber: (order as any).trackingNumber }) : '';
      const matchesOrderNum = orderNum.toLowerCase().includes(queryStr);
      const matchesTrackNum = trackNum.toLowerCase().includes(queryStr);
      const matchesId = order.id ? order.id.toLowerCase().includes(queryStr) : false;
      const matchesProductName = order.productName.toLowerCase().includes(queryStr);
      const matchesTrxId = order.transactionId ? order.transactionId.toLowerCase().includes(queryStr) : false;
      const matchesAddress = order.customerAddress ? order.customerAddress.toLowerCase().includes(queryStr) : false;
      
      const textMatch = matchesOrderNum || matchesTrackNum || matchesId || matchesProductName || matchesTrxId || matchesAddress;
      if (!textMatch) return false;
    }

    // 2. Tab Filter mapping
    const statusLower = (order.status || 'Pending').toLowerCase();
    const isCOD = order.paymentMethod === 'COD';

    switch (activeFilterTab) {
      case 'to_pay':
        // Unpaid or pending verification: Pending status and is not Cash On Delivery
        return statusLower === 'pending' && !isCOD;
      case 'to_ship':
        // Ready to dispatch: Pending Cash On Delivery or confirmed payment with status pending
        return statusLower === 'pending' && isCOD;
      case 'to_receive':
        // In transit / Shipped or processing for transit
        return statusLower === 'shipped' || statusLower === 'on the way' || statusLower === 'processing';
      case 'to_review':
        // Delivered - User received product and can review it
        return statusLower === 'delivered' || statusLower === 'completed';
      case 'all':
      default:
        return true;
    }
  });

  // Calculate badge counters for Daraz-style tabs
  const getTabCount = (tab: OrderFilterTab): number => {
    return orders.filter((order) => {
      const statusLower = (order.status || 'Pending').toLowerCase();
      const isCOD = order.paymentMethod === 'COD';
      
      if (tab === 'to_pay') {
        return statusLower === 'pending' && !isCOD;
      }
      if (tab === 'to_ship') {
        return statusLower === 'pending' && isCOD;
      }
      if (tab === 'to_receive') {
        return statusLower === 'shipped' || statusLower === 'on the way' || statusLower === 'processing';
      }
      if (tab === 'to_review') {
        return statusLower === 'delivered' || statusLower === 'completed';
      }
      return true;
    }).length;
  };

  return (
    <div className="space-y-6">
      {/* Search Header for Guest users */}
      {!profile && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-4.5 bg-[#f57224] rounded-full" />
            <h3 className="text-base sm:text-lg font-display font-black text-slate-900">
              অর্ডার ট্র্যাকার (Guest Tracker)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            যদি আপনি কোনো অ্যাকাউন্ট না খুলে অর্ডার করে থাকেন, তাহলে অর্ডারের সময় ব্যবহৃত মোবাইল নম্বরটি দিয়ে নিচে সার্চ করুন।
          </p>

          <form onSubmit={handlePhoneSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="tel" 
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="অর্ডার করার সময় ব্যবহৃত মোবাইল নম্বরটি লিখুন" 
                className="w-full border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-[#f57224] focus:ring-4 focus:ring-[#f57224]/5 transition-all font-mono shadow-2xs placeholder-slate-400"
              />
            </div>
            <button 
              type="submit" 
              disabled={submittingSearch || isLoading}
              className="bg-[#f57224] hover:bg-[#e04f05] active:scale-98 text-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shrink-0 font-display"
            >
              {submittingSearch ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>খুঁজুন</span>}
            </button>
          </form>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-500 mt-3 bg-rose-50 border border-rose-100 p-2.5 rounded-xl font-display">
              {errorMsg}
            </p>
          )}
        </div>
      )}

      {/* Main Order Tracker Card Container */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-4 sm:p-6 space-y-6">
        
        {/* Title area */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-0.5">
            <h2 className="text-lg sm:text-xl font-display font-extrabold text-slate-900 tracking-tight">
              My Orders
            </h2>
            <p className="text-xs text-slate-400 font-display">আপন প্রোডাক্ট অর্ডারসমূহ এবং ডেলিভারি স্ট্যাটাস</p>
          </div>
          
          {profile && (
            <div className="bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100/60 text-[#f57224] text-xs font-bold font-mono flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-[#f57224]" />
              <span>{orders.length} Orders</span>
            </div>
          )}
        </div>

        {/* Real-time Order Filtering Tabs */}
        {((!profile && searchPhone) || profile) && (
          <>
            <div className="flex border-b border-slate-200/60 overflow-x-auto no-scrollbar scroll-smooth gap-1 -mx-4 sm:-mx-6 px-4 sm:px-6">
              {[
                { key: 'all', title: 'All' },
                { key: 'to_pay', title: 'To Pay' },
                { key: 'to_ship', title: 'To ship' },
                { key: 'to_receive', title: 'To Receive' },
                { key: 'to_review', title: 'To Review' },
              ].map((tab) => {
                const count = getTabCount(tab.key as OrderFilterTab);
                const isActive = activeFilterTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveFilterTab(tab.key as OrderFilterTab)}
                    className={`relative py-3.5 px-4 text-xs sm:text-sm font-bold tracking-wide transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border-b-2 bg-transparent ${
                      isActive 
                        ? 'border-[#f57224] text-[#f57224] font-extrabold' 
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>{tab.title}</span>
                    {count > 0 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        isActive 
                          ? 'bg-[#f57224] text-white' 
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Live Search Bar inside My Orders as Shown in image */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order ID or product name" 
                className="w-full bg-[#f1f3f6] border border-transparent rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm outline-none focus:border-slate-300 focus:bg-white transition-all font-display text-slate-700"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </>
        )}

        {/* Display Container list */}
        <div>
          {isLoading ? (
            <div className="text-center py-16 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-[#f57224] animate-spin" />
              <span className="text-xs text-slate-400 font-display">অর্ডার তালিকা লোড করা হচ্ছে...</span>
            </div>
          ) : (!profile && !searchPhone) ? (
            <div className="text-center py-12 text-slate-400 text-xs sm:text-sm flex flex-col items-center justify-center gap-3 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
              <HelpCircle className="w-10 h-10 text-slate-350" />
              <p className="max-w-xs leading-relaxed font-display">
                শুরু করতে আপনার মোবাইল নম্বর লিখে খুঁজুন অথবা উপরে একাউন্ট লগইন সম্পন্ন করুন।
              </p>
            </div>
          ) : processedOrders.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs sm:text-sm flex flex-col items-center justify-center gap-3 border border-dashed border-slate-100 rounded-2xl">
              <ShoppingBag className="w-12 h-12 text-slate-300" />
              <span className="font-display">কোনো মিল থাকা অর্ডার খুঁজে পাওয়া যায়নি!</span>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {processedOrders.map((order) => {
                  const statusStr = order.status || 'Pending';
                  const isDelivered = statusStr.toLowerCase() === 'delivered' || statusStr.toLowerCase() === 'completed';
                  const isCancelled = statusStr.toLowerCase() === 'cancelled';
                  
                  // Style colors based on Daraz status definitions
                  let statusBadgeStyle = "bg-orange-55 text-orange-600 border border-orange-100";
                  if (isDelivered) {
                    statusBadgeStyle = "bg-neutral-100 text-[#4ca85a] border border-green-150/40";
                  } else if (isCancelled) {
                    statusBadgeStyle = "bg-slate-100/80 text-orange-600 border border-slate-200/50";
                  }

                  const formattedDate = new Date(order.time).toLocaleDateString('bn-BD', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  const orderNum = order.id ? getOrderNumber({ id: order.id, time: order.time, paymentMethod: order.paymentMethod }) : 'N/A';
                  const trackingNum = order.id ? getTrackingNumber({ id: order.id, time: order.time, paymentMethod: order.paymentMethod, trackingNumber: (order as any).trackingNumber }) : 'N/A';

                  return (
                    <motion.div
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border border-slate-100 rounded-xl bg-white overflow-hidden shadow-2xs hover:shadow-sm transition-shadow"
                    >
                      {/* Top bar of the individual order */}
                      <div className="bg-[#fafafa] border-b border-slate-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[11px] sm:text-xs">
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                          <span className="text-slate-500 font-display">
                            তারিখ: <strong className="text-slate-700 font-mono">{formattedDate}</strong>
                          </span>
                          <span className="text-slate-350 hidden sm:inline">|</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-500 font-display">অর্ডার আইডি:</span>
                            <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                              <strong className="text-slate-800 select-all font-mono font-extrabold">{orderNum}</strong>
                              <button
                                onClick={() => handleCopyText(orderNum, order.id!, 'order')}
                                className="text-slate-400 hover:text-blue-600 transition-colors p-0.5 inline-flex items-center justify-center cursor-pointer"
                                title="কপি করুন"
                              >
                                {copiedId === order.id && copiedType === 'order' ? (
                                  <Check className="w-3 h-3 text-emerald-600 animate-bounce animate-none" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                          <span className="text-slate-350 hidden sm:inline">|</span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-slate-500 font-display">ট্র্যাকিং নম্বর:</span>
                            <div className="inline-flex items-center gap-1 bg-sky-50/70 border border-sky-150 px-2 py-0.5 rounded-md">
                              <strong className="text-sky-700 select-all font-mono font-extrabold">{trackingNum}</strong>
                              <button
                                onClick={() => handleCopyText(trackingNum, order.id!, 'track')}
                                className="text-slate-400 hover:text-[#f57224] transition-colors p-0.5 inline-flex items-center justify-center cursor-pointer"
                                title="কপি করুন"
                              >
                                {copiedId === order.id && copiedType === 'track' ? (
                                  <Check className="w-3 h-3 text-emerald-600 animate-bounce animate-none" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                            isDelivered ? 'bg-slate-100 text-slate-500' : isCancelled ? 'bg-slate-100 text-slate-400' : 'bg-orange-50 text-orange-600'
                          }`}>
                            {isDelivered ? 'Completed' : isCancelled ? 'Cancelled' : 'Processing'}
                          </span>
                        </div>
                      </div>

                      {/* Items Details Body */}
                      <div className="p-4 space-y-4">
                        {/* Nested items inside the order */}
                        {order.items && order.items.length > 0 ? (
                          order.items.map((item, idx) => (
                            <div key={idx} className="flex gap-4 items-start pb-4 border-b border-dashed border-slate-100 last:pb-0 last:border-b-0">
                              {/* Product Thumbnail image */}
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name} 
                                  className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg border border-slate-200/60 flex-shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200/60 flex-shrink-0">
                                  <ShoppingBag className="w-6 h-6" />
                                </div>
                              )}

                              {/* Middle Description */}
                              <div className="flex-1 min-w-0 font-display">
                                <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug break-words">
                                  {item.name}
                                </h4>
                                {item.color && (
                                  <p className="text-[10px] sm:text-xs text-slate-400 mt-1 flex flex-wrap gap-x-2">
                                    <span>Color family: <strong className="text-slate-600 font-bold">{item.color}</strong></span>
                                    {item.selectedSize && <span className="text-[#f57224] uppercase">Size: <strong className="font-bold">{item.selectedSize}</strong></span>}
                                  </p>
                                )}
                              </div>

                              {/* Right Pricing column as inline */}
                              <div className="text-right shrink-0">
                                <p className="text-xs sm:text-sm font-bold text-slate-800 font-mono">
                                  ৳ {item.price.toLocaleString('en-US')}
                                </p>
                                <p className="text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5">
                                  Qty: {item.quantity || 1}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          // Fallback single item block
                          <div className="flex gap-4 items-start">
                            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 border border-slate-200/60 flex-shrink-0">
                              <ShoppingBag className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0 font-display">
                              <h4 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug break-words">
                                {order.productName}
                              </h4>
                              {order.color && (
                                <p className="text-[10px] sm:text-xs text-slate-400 mt-1 flex flex-wrap gap-x-2">
                                  <span>Color family: <strong className="text-slate-600 font-bold">{order.color}</strong></span>
                                  {order.selectedSize && <span className="text-[#f57224] uppercase">Size: <strong className="font-bold">{order.selectedSize}</strong></span>}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs sm:text-sm font-bold text-slate-800 font-mono">
                                ৳ {order.productPrice.toLocaleString('en-US')}
                              </p>
                              <p className="text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5">
                                Qty: {order.quantity || 1}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions / Cancel details of the order */}
                      <div className="bg-[#fcfcfc] border-t border-slate-100 px-4 py-3 flex flex-wrap items-center justify-between gap-4 font-display">
                        <div className="text-[11px] sm:text-xs text-slate-500">
                          পেমেন্ট মেথড: <span className="font-bold text-slate-800">{order.paymentMethod}</span>
                          {order.transactionId && order.transactionId !== 'COD (No ID)' && (
                            <span className="ml-3">TxID: <span className="font-mono font-bold text-slate-700 select-all bg-slate-100 px-1 py-0.5 rounded">{order.transactionId}</span></span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Cancel Logic for Pending non-delivered status */}
                          {!isDelivered && !isCancelled && (
                            <>
                              {deletingOrderId === order.id ? (
                                <div className="flex items-center gap-1 bg-red-50 border border-red-100 p-1 rounded-xl">
                                  <span className="text-[10px] sm:text-[11px] font-bold text-red-600 px-1.5">বাতিল করবেন?</span>
                                  <button
                                    disabled={isDeleting}
                                    onClick={() => handleConfirmCancel(order.id!)}
                                    className="p-1 px-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1 active:scale-95"
                                    title="হ্যাঁ, নিশ্চিত"
                                  >
                                    {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  </button>
                                  <button
                                    disabled={isDeleting}
                                    onClick={() => setDeletingOrderId(null)}
                                    className="p-1 px-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-350 transition-all font-bold text-[10px] cursor-pointer flex items-center justify-center"
                                    title="না"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeletingOrderId(order.id!)}
                                  className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-white hover:bg-red-550 border border-red-200 hover:border-red-500 px-3.5 py-1.5 rounded-xl cursor-pointer transition-all duration-200"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>বাতিল করুন</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* Extra info status */}
                          {isDelivered && (
                            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                              <span>Delivered successfully</span>
                            </span>
                          )}
                          {isCancelled && (
                            <span className="text-[11px] sm:text-xs font-bold text-slate-400">
                              Cancelled
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
