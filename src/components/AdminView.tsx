import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, setDoc, query, orderBy 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Product, Order, PaymentSettings, CATEGORIES, CATEGORY_MAP, ChatSession, ChatMessage } from '../types';
import { useAuth } from '../lib/authContext';
import { 
  Plus, Edit2, Trash2, CheckCircle2, AlertCircle, ShoppingCart, 
  Settings, Loader2, Save, X, Phone, User, MapPin, Tag, RefreshCw, Landmark, Truck,
  MessageSquare, Send, Clock, Star, ShieldCheck, Copy, Check, Database
} from 'lucide-react';
import { getOrderNumber, getTrackingNumber } from '../lib/orderUtils';

function getAutoCategory(name: string): string {
  const lower = name.toLowerCase();

  // Watches & Jewellery
  if (/watch|smartwatch|smart-watch|ঘড়ি|স্মার্টওয়াচ|wrist-watch|wrist-wear|fitbit/i.test(lower)) {
    return 'Watches, Bags & Jewellery';
  }
  if (/bag|handbag|backpack|wallet|purse|ল্যাগেজ|ব্যাগ|ভ্যানিটিব্যাগ|jewellery|ring|bangle|necklace|earring|choker|লকেট|ব্র্যাসলেট|চুড়ি/i.test(lower)) {
    return 'Watches, Bags & Jewellery';
  }

  // Fashion (Women vs Men)
  if (/saree|kurti|dress|leggings|hijab|abaya|শাড়ি|কামিজ|মেয়েদের|মেয়ে|women|girl|ladies|female/i.test(lower)) {
    return 'Women’s & Girls’ Fashion';
  }
  if (/pant|shirt|t-shirt|panjabi|pajama|lungi|shoe|loafer|jersey|men|boy|male|gents|man|boys|ছেলের|ছেলে|পাঞ্জাবী|লুঙ্গি|জুতা/i.test(lower)) {
    return 'Men’s & Boys’ Fashion';
  }

  // Accessories
  if (/charger|cable|earphone|headphone|mouse|keyboard|powerbank|adapter|speaker|mic|microphone|case|stand|holder|ringlight|usb|memory|card|headset|bluetooth|soundbar|এয়ারফোন|হেডফোন|কীবোর্ড|মাউস|চার্জার|ড্রাইভ|স্পিকার/i.test(lower)) {
    return 'Electronic Accessories';
  }

  // Gadgets
  if (/mobile|gadget|phone|smartphone|tablet|ipad|laptop|pc|desktop|monitor|camera|router|projector|printer|মেশিন|ট্যাবলেট|স্মার্টফোন/i.test(lower)) {
    return 'Mobile & Gadgets';
  }

  // Home Appliances
  if (/blender|juicer|kettle|oven|cooker|tv|television|fridge|refrigerator|ac|conditioner|fan|vacuum|iron|washing|machine|টেলিভিশন|ব্লেন্ডার|ওভেন|ফ্রিজ|এসি|ফ্যান|কেটলি/i.test(lower)) {
    return 'TV & Home Appliances';
  }

  // Mother & Baby
  if (/baby|diaper|toy|feeder|lactogen|cerelac|stroller|crib|kids|puzzel|doll|বাচ্চা|শিশু|খেলনা/i.test(lower)) {
    return 'Mother & Baby';
  }

  // Automotive
  if (/bike|car|motor|cycle|helmet|engine|oil|vehicle|automotive|মোটরসাইকেল|বাইক|গাড়ি|হেলমেট/i.test(lower)) {
    return 'Automotive & Motorbike';
  }

  // Sports & Outdoors
  if (/ball|bat|cricket|football|gym|exercise|sport|outdoor|camp|tent|jersey|ফুটবল|ক্রিকেট|ব্যাট/i.test(lower)) {
    return 'Sports & Outdoors';
  }

  // Furniture
  if (/bed|sofa|chair|table|wardrobe|almirah|furniture|কাঠের|খাট|চেয়ার|টেবিল|আলমারি|সোফা/i.test(lower)) {
    return 'Furniture';
  }

  // Kitchen & Dining
  if (/pan|pot|knife|plate|spoon|cup|mug|bottle|kitchen|mortar|pestle|চুলা|হাড়ি|কড়াই|চুলো/i.test(lower)) {
    return 'Kitchen & Dining';
  }

  // Stationery & Books
  if (/pen|pencil|notebook|paper|book|stationery|scale|eraser|sharpener|বই|খাতা|কলম|পেন্সিল/i.test(lower)) {
    return 'Books & Stationery';
  }

  // Groceries
  if (/rice|oil|spice|salt|sugar|biscuit|honey|grocer|food|ghee|চা|চিনি|লবণ|মসলা|মধু|ঘি|ডাল|চাল/i.test(lower)) {
    return 'Groceries';
  }

  // Health & Beauty
  if (/shampoo|soap|face|cream|oil|lotion|makeup|lipstick|perfume|beauty|skin|hair|trimmer|shaver|spray|শ্যাম্পু|সাবান|লোশন|মেকআপ|পারফিউম|লিপস্টিক/i.test(lower)) {
    return 'Health & Beauty';
  }

  // Hardware
  if (/screwdriver|drill|hammer|saw|pliers|wrench|tool|hardware/i.test(lower)) {
    return 'Tools & Hardware';
  }

  // Pets
  if (/pet|dog|cat|bird|fish|food/i.test(lower)) {
    return 'Pet Care';
  }

  // Home decor / Lifestyle
  if (/flower|gift|vase|candle|frame|clock|decor|home|lifestyle/i.test(lower)) {
    return 'Home & Lifestyle';
  }

  // Devices
  if (/device|sensor|electronic|led|bulb/i.test(lower)) {
    return 'Electronics Devices';
  }

  return '';
}

export default function AdminView() {
  const { profile } = useAuth();
  
  // Tabs of admin view: 'orders' | 'products' | 'settings' | 'chats' | 'reviews' | 'coupons'
  const [subTab, setSubTab] = useState<'orders' | 'products' | 'settings' | 'chats' | 'reviews' | 'coupons'>('orders');

  // Chat administration states
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<ChatMessage[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Firestore streamed data lists
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({});
  
  // Loading indicators
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [adminLightboxImage, setAdminLightboxImage] = useState<string | null>(null);

  // Search filter inside orders
  const [orderQuery, setOrderQuery] = useState('');

  // Admin copy order feedback states
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

  // Add/Edit Product Mode & State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodIsNew, setProdIsNew] = useState(true);
  const [prodCategory, setProdCategory] = useState('');
  const [prodSubcategory, setProdSubcategory] = useState('');
  const [isCategoryManuallyEdited, setIsCategoryManuallyEdited] = useState(false);
  const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
  const [selectedStandardSizes, setSelectedStandardSizes] = useState<string[]>([]);
  const [customSizesInput, setCustomSizesInput] = useState('');

  // Auto-detect category based on title input
  useEffect(() => {
    if (!editingProduct && !isCategoryManuallyEdited && prodName.trim()) {
      const detected = getAutoCategory(prodName);
      if (detected) {
        setProdCategory(detected);
      }
    }
  }, [prodName, editingProduct, isCategoryManuallyEdited]);

  // Settings State Inputs
  const [settingBkash, setSettingBkash] = useState('');
  const [settingNagad, setSettingNagad] = useState('');
  const [settingBank, setSettingBank] = useState('');
  const [settingInsideDhaka, setSettingInsideDhaka] = useState('');
  const [settingOutsideDhaka, setSettingOutsideDhaka] = useState('');
  const [settingFooterDeveloperName, setSettingFooterDeveloperName] = useState('');
  const [settingFooterWhatsapp, setSettingFooterWhatsapp] = useState('');
  const [settingFooterEmail, setSettingFooterEmail] = useState('');
  const [settingFooterOfficeAddress, setSettingFooterOfficeAddress] = useState('');
  const [settingFooterTagline, setSettingFooterTagline] = useState('');
  const [settingFooterFacebook, setSettingFooterFacebook] = useState('');

  // Coupon Management States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(true);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [cCode, setCCode] = useState('');
  const [cType, setCType] = useState<'flat' | 'percentage'>('flat');
  const [cValue, setCValue] = useState('');
  const [cMinPurchase, setCMinPurchase] = useState('0');
  const [cExpiryDate, setCExpiryDate] = useState('');
  const [cActive, setCActive] = useState(true);

  // 1. Live listener for all orders
  useEffect(() => {
    const unsubOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const list: Order[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Order);
      });
      // Sort newest order first
      list.sort((a, b) => b.time - a.time);
      setOrders(list);
      setIsLoadingOrders(false);
    }, (err) => {
      console.error("Stream all orders failed:", err);
      setIsLoadingOrders(false);
    });

    return () => unsubOrders();
  }, []);

  // 2. Live listener for all products
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, 'products'), (snapshot) => {
      const list: Product[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Product);
      });
      setProducts(list);
      setIsLoadingProducts(false);
    }, (err) => {
      console.error("Stream all products failed:", err);
      setIsLoadingProducts(false);
    });

    return () => unsubProducts();
  }, []);

  // 2.5 Live listener for reviews
  useEffect(() => {
    const unsubReviews = onSnapshot(collection(db, 'reviews'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Sort newest review first
      list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setReviews(list);
      setIsLoadingReviews(false);
    }, (err) => {
      console.error("Stream all reviews failed:", err);
      setIsLoadingReviews(false);
    });

    return () => unsubReviews();
  }, []);

  // 3. Live listener for settings
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'payment'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as PaymentSettings;
        setPaymentSettings(data);
        setSettingBkash(data.bkash || '');
        setSettingNagad(data.nagad || '');
        setSettingBank(data.bank || '');
        setSettingInsideDhaka(String(
          data.deliveryInside ?? 
          data.insideDhaka ?? 
          data.delivery_inside ?? 
          data.inside_dhaka ?? 
          data.insideDhakaFee ?? 
          80
        ));
        setSettingOutsideDhaka(String(
          data.deliveryOutside ?? 
          data.outsideDhaka ?? 
          data.delivery_outside ?? 
          data.outside_dhaka ?? 
          data.outsideDhakaFee ?? 
          150
        ));
        setSettingFooterDeveloperName(data.footerDeveloperName || '');
        setSettingFooterWhatsapp(data.footerWhatsapp || '');
        setSettingFooterEmail(data.footerEmail || '');
        setSettingFooterOfficeAddress(data.footerOfficeAddress || '');
        setSettingFooterTagline(data.footerTagline || '');
        setSettingFooterFacebook(data.footerFacebook || '');
      }
    }, (err) => {
      console.error("Stream payment settings failed:", err);
    });

    return () => unsubSettings();
  }, []);

  // 3.5 Live listener for Promo Codes / Coupons
  useEffect(() => {
    const unsubCoupons = onSnapshot(collection(db, 'promo_codes'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      list.sort((a, b) => a.id.localeCompare(b.id));
      setCoupons(list);
      setIsLoadingCoupons(false);
    }, (err) => {
      console.error("Stream all promo codes failed:", err);
      setIsLoadingCoupons(false);
    });

    return () => unsubCoupons();
  }, []);

  // 4. Live listener for all customer Live Chats
  useEffect(() => {
    const unsubChats = onSnapshot(collection(db, 'chat_sessions'), (snapshot) => {
      const list: ChatSession[] = [];
      let unread = 0;
      snapshot.forEach((docSnap) => {
        const item = { id: docSnap.id, ...docSnap.data() } as ChatSession;
        list.push(item);
        if (item.unreadByAdmin) {
          unread++;
        }
      });
      // Sort newest active session first
      list.sort((a, b) => b.lastActive - a.lastActive);
      setChatSessions(list);
      setUnreadChatsCount(unread);
      setIsLoadingChats(false);
    }, (err) => {
      console.error("Stream live chats config failed:", err);
      setIsLoadingChats(false);
    });

    return () => unsubChats();
  }, []);

  // 5. Live listener for specific active chat session messages
  useEffect(() => {
    if (!selectedSessionId) {
      setActiveChatMessages([]);
      return;
    }

    // Reset unread by admin immediately upon selection
    const sessionRef = doc(db, 'chat_sessions', selectedSessionId);
    updateDoc(sessionRef, { unreadByAdmin: false }).catch((err) => {
      console.error("Failed resetting admin unread:", err);
    });

    const messagesQuery = query(
      collection(db, 'chat_sessions', selectedSessionId, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubMessages = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        msgs.push({ id: docSnap.id, ...docSnap.data() } as ChatMessage);
      });
      setActiveChatMessages(msgs);
    }, (err) => {
      console.error("Stream active session messages failed:", err);
    });

    return () => unsubMessages();
  }, [selectedSessionId]);

  // Handle Admin Text Reply Sending
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const replyText = adminReplyText.trim();
    if (!replyText || !selectedSessionId || isSendingReply) return;

    setIsSendingReply(true);
    setAdminReplyText('');

    const sessionRef = doc(db, 'chat_sessions', selectedSessionId);
    const timestamp = Date.now();

    try {
      // 1. Save reply message document in subcollection
      const msgId = `msg_${Date.now()}_Admin`;
      const msgRef = doc(db, 'chat_sessions', selectedSessionId, 'messages', msgId);
      
      const replyMsg: ChatMessage = {
        id: msgId,
        senderId: 'admin',
        text: replyText,
        timestamp: timestamp
      };

      await setDoc(msgRef, replyMsg);

      // 2. Update parent session record
      await updateDoc(sessionRef, {
        lastMessage: replyText,
        lastActive: timestamp,
        unreadByCustomer: true,
        unreadByAdmin: false
      });

    } catch (err) {
      console.error("Sending reply failed:", err);
      triggerToast("মেসেজ পাঠাতে ব্যত্যয় ঘটেছে!", true);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Show Toast helper
  const triggerToast = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 3000);
    } else {
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Add or Save product form submission
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName.trim() || !prodPrice.trim()) {
      triggerToast("প্রোডাক্টের নাম এবং মূল্য প্রদান করা আবশ্যক!", true);
      return;
    }

    setIsSubmitting(true);
    const customParsed = customSizesInput
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);
    const finalSizesList = Array.from(new Set([...selectedStandardSizes, ...customParsed]));

    const dataToSave = {
      name: prodName.trim(),
      price: Number(prodPrice),
      originalPrice: prodOriginalPrice ? Number(prodOriginalPrice) : null,
      description: prodDesc.trim(),
      image: prodImage.trim() || 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=400',
      isNew: prodIsNew,
      category: prodCategory.trim() || '',
      subcategory: prodSubcategory.trim() || '',
      sizes: finalSizesList
    };

    try {
      if (editingProduct) {
        // Update product
        await updateDoc(doc(db, 'products', editingProduct.id), dataToSave);
        triggerToast("প্রোডাক্ট সফলভাবে আপডেট হয়েছে!");
      } else {
        // Add new product
        await addDoc(collection(db, 'products'), dataToSave);
        triggerToast("নতুন প্রোডাক্ট সফলভাবে সংযুক্ত হয়েছে!");
      }

      // Reset Form fields
      setEditingProduct(null);
      setProdName('');
      setProdPrice('');
      setProdOriginalPrice('');
      setProdDesc('');
      setProdImage('');
      setProdIsNew(true);
      setProdCategory('');
      setProdSubcategory('');
      setIsCategoryManuallyEdited(false);
      setSelectedStandardSizes([]);
      setCustomSizesInput('');
    } catch (err) {
      console.error(err);
      triggerToast("প্রোডাক্ট সংরক্ষণ কার্য সম্পন্ন করা যায়নি।", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initiate Edit mode
  const handleStartEdit = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdPrice(String(product.price));
    setProdOriginalPrice(product.originalPrice ? String(product.originalPrice) : '');
    setProdDesc(product.description || '');
    setProdImage(product.image || '');
    setProdIsNew(product.isNew ?? true);
    setProdCategory(product.category || '');
    setProdSubcategory(product.subcategory || '');
    setIsCategoryManuallyEdited(true); // Preserve choice upon edit

    const STANDARD_SIZES = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    const productSizes = product.sizes || [];
    const standards = productSizes.filter(s => STANDARD_SIZES.includes(s));
    const customs = productSizes.filter(s => !STANDARD_SIZES.includes(s));
    setSelectedStandardSizes(standards);
    setCustomSizesInput(customs.join(', '));
  };

  // Delete product block
  const handleDeleteProduct = async (prodId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই প্রোডাক্টটি চিরতরে মুছে ফেলতে চান? এটি মুছে ফেললে প্রোডাক্টটি শপ থেকে হারিয়ে যাবে।")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'products', prodId));
      triggerToast("প্রোডাক্টটি সফলভাবে মুছে ফেলা হয়েছে!");
    } catch (err) {
      console.error(err);
      triggerToast("প্রোডাক্ট ডিলিট করা সম্ভব হয়নি।", true);
    }
  };

  // Delete Order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই কাস্টমার অর্ডারটি মুছে ফেলতে চান?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'orders', orderId));
      triggerToast("অর্ডারটি সফলভাবে ডাটাবেজ থেকে ধুয়েমুছে ফেলা হয়েছে!");
    } catch (err) {
      console.error(err);
      triggerToast("অর্ডার ডিলিট ব্যর্থ হয়েছে।", true);
    }
  };

  // Toggle Order status Pending <-> Delivered
  const handleToggleOrderStatus = async (order: Order) => {
    if (!order.id) return;
    const nextStatus = order.status === 'Delivered' ? 'Pending' : 'Delivered';
    try {
      await updateDoc(doc(db, 'orders', order.id), {
        status: nextStatus
      });
      triggerToast(`অর্ডার স্ট্যাটাস সফলভাবে '${nextStatus === 'Delivered' ? 'ডেলিভার্ড' : 'পেন্ডিং'}' করা হয়েছে!`);
    } catch (err) {
      console.error(err);
      triggerToast("অর্ডার স্ট্যাটাস আপডেট করতে সমস্যা হয়েছে।", true);
    }
  };

  // Delete Review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("আপনি কি নিশ্চিতভাবে এই কাস্টমার রিভিউটি মুছে ফেলতে চান?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      triggerToast("রিভিউটি সফলভাবে মুছে ফেলা হয়েছে!");
    } catch (err) {
      console.error(err);
      triggerToast("রিভিউ মুছতে সমস্যা হয়েছে।", true);
    }
  };

  // Save admin settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'settings', 'payment'), {
        bkash: settingBkash.trim(),
        nagad: settingNagad.trim(),
        bank: settingBank.trim(),
        deliveryInside: Number(settingInsideDhaka),
        deliveryOutside: Number(settingOutsideDhaka),
        insideDhaka: Number(settingInsideDhaka),
        outsideDhaka: Number(settingOutsideDhaka),
        delivery_inside: Number(settingInsideDhaka),
        delivery_outside: Number(settingOutsideDhaka),
        inside_dhaka: Number(settingInsideDhaka),
        outside_dhaka: Number(settingOutsideDhaka),
        insideDhakaFee: Number(settingInsideDhaka),
        outsideDhakaFee: Number(settingOutsideDhaka),
        footerDeveloperName: settingFooterDeveloperName.trim(),
        footerWhatsapp: settingFooterWhatsapp.trim(),
        footerEmail: settingFooterEmail.trim(),
        footerOfficeAddress: settingFooterOfficeAddress.trim(),
        footerTagline: settingFooterTagline.trim(),
        footerFacebook: settingFooterFacebook.trim(),
      }, { merge: true });

      triggerToast("পেমেন্ট ও ডেলিভারি সেটিংস সফলভাবে সেভ হয়েছে!");
    } catch (err) {
      console.error(err);
      triggerToast("সেটিংস সেভ করতে সমস্যা হয়েছে।", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Coupon (Add or Update)
  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();

    const codeClean = cCode.trim();
    if (!codeClean) {
      triggerToast('কুপন কোড লিখুন।', true);
      return;
    }
    if (!cValue || Number(cValue) <= 0) {
      triggerToast('সঠিক কুপন মূল্য/ডিসকাউন্ট দিন।', true);
      return;
    }
    if (!cExpiryDate) {
      triggerToast('কুপন মেয়াদ শেষের তারিখ দিন।', true);
      return;
    }

    setIsSubmitting(true);
    try {
      const docId = codeClean.toLowerCase();
      const couponData = {
        code: codeClean.toUpperCase(),
        type: cType,
        value: Number(cValue),
        minPurchase: Number(cMinPurchase) || 0,
        expiryDate: cExpiryDate,
        active: cActive,
      };

      await setDoc(doc(db, 'promo_codes', docId), couponData);
      triggerToast(`কুপন '${couponData.code}' সফলভাবে ${editingCoupon ? 'আপডেট' : 'তৈরি'} করা হয়েছে!`);
      
      // Reset form
      setCCode('');
      setCType('flat');
      setCValue('');
      setCMinPurchase('0');
      setCExpiryDate('');
      setCActive(true);
      setEditingCoupon(null);
    } catch (err) {
      console.error('Failed to save coupon:', err);
      triggerToast('কুপন সংরক্ষণ করতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCouponClick = (coupon: any) => {
    setEditingCoupon(coupon);
    setCCode(coupon.code || coupon.id.toUpperCase());
    setCType(coupon.type || 'flat');
    setCValue(String(coupon.value || ''));
    setCMinPurchase(String(coupon.minPurchase || '0'));
    setCExpiryDate(coupon.expiryDate || '');
    setCActive(coupon.active !== false);
  };

  const handleCancelCouponEdit = () => {
    setEditingCoupon(null);
    setCCode('');
    setCType('flat');
    setCValue('');
    setCMinPurchase('0');
    setCExpiryDate('');
    setCActive(true);
  };

  const handleDeleteCoupon = async (couponId: string) => {
    if (!window.confirm('আপনি কি নিশ্চিত যে এই কুপনটি ডিলিট করতে চান?')) return;

    try {
      await deleteDoc(doc(db, 'promo_codes', couponId));
      triggerToast('কুপনটি সফলভাবে মুছে ফেলা হয়েছে!');
    } catch (err) {
      console.error('Failed to delete coupon:', err);
      triggerToast('কুপন মুছতে ব্যর্থ হয়েছে। দয়া করে আবার চেষ্টা করুন।', true);
    }
  };

  const handleToggleCouponActive = async (coupon: any) => {
    try {
      const docRef = doc(db, 'promo_codes', coupon.id);
      await updateDoc(docRef, { active: !coupon.active });
      triggerToast(`কুপন '${coupon.code || coupon.id.toUpperCase()}' সফলভাবে ${!coupon.active ? 'সক্রিয়' : 'নিষ্ক্রিয়'} করা হয়েছে!`);
    } catch (err) {
      console.error('Failed to toggle coupon active status:', err);
      triggerToast('কুপন অ্যাক্টিভিটি পরিবর্তন করতে ব্যর্থ হয়েছে।', true);
    }
  };

  // Filter orders by query search
  const filteredOrders = orders.filter(ord => {
    const q = orderQuery.toLowerCase();
    const orderNum = ord.id ? getOrderNumber({ id: ord.id, time: ord.time, paymentMethod: ord.paymentMethod }) : '';
    const trackNum = ord.id ? getTrackingNumber({ id: ord.id, time: ord.time, paymentMethod: ord.paymentMethod, trackingNumber: (ord as any).trackingNumber }) : '';
    return (
      ord.customerName.toLowerCase().includes(q) ||
      ord.customerPhone.includes(q) ||
      ord.productName.toLowerCase().includes(q) ||
      (ord.transactionId && ord.transactionId.toLowerCase().includes(q)) ||
      orderNum.toLowerCase().includes(q) ||
      trackNum.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 rounded-3xl p-6 text-white border border-rose-900/40 shadow-md relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="absolute inset-0 bg-rose-500/5 blur-xl pointer-events-none rounded-2xl" />
        <div className="space-y-1 relative z-10">
          <span className="text-[10px] font-bold text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">Owner Management Hub</span>
          <h1 className="text-xl sm:text-2xl font-display font-extrabold">স্মার্টহাট অ্যাডমিন প্যানেল</h1>
          <p className="text-xs text-rose-200/75">পণ্য পরিবর্তন, কাস্টমারদের সমস্ত অর্ডার ট্র্যাকিং এবং পেমেন্ট সেটিংস হালনাগাদ করার কেন্দ্রীয় নিয়ন্ত্রণ কক্ষ।</p>
        </div>
      </div>

      {/* Primary Subtabs Navigation */}
      <div className="flex flex-wrap bg-slate-100 border border-slate-200/80 p-1 rounded-xl max-w-2xl gap-1">
        <button
          onClick={() => setSubTab('orders')}
          className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            subTab === 'orders'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          অর্ডার রিসিভড ({orders.length})
        </button>
        <button
          onClick={() => setSubTab('products')}
          className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            subTab === 'products'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          পণ্য পরিচালনা ({products.length})
        </button>
        <button
          onClick={() => setSubTab('settings')}
          className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            subTab === 'settings'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-550 hover:text-slate-800'
          }`}
        >
          যাবতীয় সেটিংস
        </button>
        <button
          onClick={() => setSubTab('chats')}
          className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center relative ${
            subTab === 'chats'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          লাইভ চ্যাট
          {unreadChatsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold shadow-xs border border-white">
              {unreadChatsCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setSubTab('reviews')}
          className={`flex-1 min-w-[80px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            subTab === 'reviews'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          রিভিউসমূহ ({reviews.length})
        </button>
        <button
          onClick={() => setSubTab('coupons')}
          className={`flex-1 min-w-[85px] py-2 text-xs font-bold rounded-lg transition-all cursor-pointer text-center ${
            subTab === 'coupons'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          কুপনসমূহ ({coupons.length})
        </button>
      </div>

      {/* Floating dynamic messages toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-emerald-50 border border-emerald-100/80 text-emerald-800 text-xs rounded-xl font-bold flex items-center gap-2 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-rose-50 border border-rose-100/80 text-rose-800 text-xs rounded-xl font-bold flex items-center gap-2 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUB-PANE PANELS */}
      <div className="space-y-6">
        
        {/* TAB 1: ORDERS OVERALL TRAFFIC */}
        {subTab === 'orders' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-950 font-display">কাস্টমারদের সমস্ত অর্ডার</h3>
                <p className="text-xs text-slate-500">সমস্ত কাস্টমারদের অর্ডার রিয়েলটাইমে আপডেট হচ্ছে। নিচে সার্চ করুন ও কনফার্ম করুন।</p>
              </div>

              {/* Order quick search */}
              <input
                type="text"
                value={orderQuery}
                onChange={(e) => setOrderQuery(e.target.value)}
                placeholder="ফোন নম্বর, নাম বা ট্রানজেকশন দিয়ে খুঁজুন..."
                className="border border-slate-200 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-rose-500 w-full sm:max-w-xs font-display"
              />
            </div>

            {isLoadingOrders ? (
              <div className="text-center py-16 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-rose-500 animate-spin" />
                <span className="text-xs text-slate-400">অর্ডার সমূহ ব্রাউজ করা হচ্ছে...</span>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-xs">
                কোনো অর্ডারের রেকর্ড খুঁজে পাওয়া যায়নি!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 font-display">
                      <th className="p-4">তারিখ ও পণ্য</th>
                      <th className="p-4">গ্রাহকের বিবরণ</th>
                      <th className="p-4">পেমেন্ট মেথড ও TxID</th>
                      <th className="p-4">মোব চার্জ</th>
                      <th className="p-4 text-right">স্ট্যাটাস ও অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map(order => {
                      const dt = new Date(order.time).toLocaleDateString('bn-BD', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      });
                      const isDelivered = order.status === 'Delivered';
                      const orderNum = order.id ? getOrderNumber({ id: order.id, time: order.time, paymentMethod: order.paymentMethod }) : 'N/A';
                      const trackingNum = order.id ? getTrackingNumber({ id: order.id, time: order.time, paymentMethod: order.paymentMethod, trackingNumber: (order as any).trackingNumber }) : 'N/A';

                      return (
                        <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 space-y-2 max-w-sm">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-[10px] text-slate-400 font-bold">
                              <span>{dt}</span>
                              <span>•</span>
                              <div className="inline-flex items-center gap-1 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[9px] text-slate-800">
                                <span>ID: <strong>{orderNum}</strong></span>
                                <button
                                  onClick={() => handleCopyText(orderNum, order.id!, 'order')}
                                  className="text-slate-400 hover:text-blue-600 cursor-pointer p-0.5 inline-flex items-center justify-center transition-colors"
                                  title="কপি করুন"
                                >
                                  {copiedId === order.id && copiedType === 'order' ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                              <span>•</span>
                              <div className="inline-flex items-center gap-1 bg-sky-50 border border-sky-100 px-1.5 py-0.5 rounded text-[9px] text-sky-700">
                                <span>Track: <strong>{trackingNum}</strong></span>
                                <button
                                  onClick={() => handleCopyText(trackingNum, order.id!, 'track')}
                                  className="text-slate-450 hover:text-[#f57224] cursor-pointer p-0.5 inline-flex items-center justify-center transition-colors"
                                  title="কপি করুন"
                                >
                                  {copiedId === order.id && copiedType === 'track' ? (
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-2.5 h-2.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                            {order.items && order.items.length > 0 ? (
                              <div className="space-y-1.5 mt-1.5">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200/60 p-1.5 rounded-lg">
                                    {item.image && (
                                      <img 
                                        src={item.image} 
                                        alt={item.name} 
                                        referrerPolicy="no-referrer"
                                        className="w-7 h-7 object-cover bg-white rounded border border-slate-100 shrink-0"
                                      />
                                    )}
                                    <div className="min-w-0 flex-1 text-[11px] leading-tight">
                                      <p className="font-bold text-slate-800 truncate" title={item.name}>{item.name}</p>
                                      <p className="text-slate-400 font-bold text-[9px] font-mono">
                                        Color: <span className="text-slate-600">{item.color}</span>
                                        {item.selectedSize && <> • Size: <span className="text-orange-600 uppercase font-black">{item.selectedSize}</span></>}
                                        • Qty: <span className="text-slate-600">{item.quantity}</span> • Price: <span className="text-slate-600">৳{item.price}</span>
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <>
                                <h4 className="font-bold text-slate-800 text-[13px] line-clamp-2">{order.productName}</h4>
                                <div className="flex flex-wrap gap-1.5 text-[10px] mt-1">
                                  <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">qty: {order.quantity || 1}</span>
                                  <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-medium">color: {order.color || 'N/A'}</span>
                                  {order.selectedSize && (
                                    <span className="text-orange-600 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded uppercase font-black">size: {order.selectedSize}</span>
                                  )}
                                </div>
                              </>
                            )}
                          </td>
                          <td className="p-4 space-y-1 text-slate-700">
                            <p className="font-bold flex items-center gap-1">
                              <User className="w-3 h-3 text-slate-400" />
                              <span>{order.customerName}</span>
                            </p>
                            <p className="font-mono text-xs flex items-center gap-1 font-semibold">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{order.customerPhone}</span>
                            </p>
                            <p className="text-[11px] leading-relaxed max-w-xs text-slate-500 flex items-start gap-1">
                              <MapPin className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />
                              <span>{order.customerAddress}</span>
                            </p>
                          </td>
                          <td className="p-4 space-y-1 font-mono text-slate-600">
                            <span className="bg-blue-50 text-blue-800 font-sans font-extrabold text-[10px] px-2 py-0.5 rounded-sm uppercase tracking-wider">{order.paymentMethod}</span>
                            <p className="text-[11px] mt-1 select-all font-sans font-bold text-slate-800">TxID: {order.transactionId}</p>
                            <p className="text-[11px] font-sans text-slate-400">ডেলিভারি এলাকা: {order.deliveryLocation || 'সংগৃহীত হয়নি'}</p>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-800 text-[13px] font-display">
                            ৳ {(order.totalAmount ?? order.productPrice).toLocaleString('en-US')}
                          </td>
                          <td className="p-4 space-y-2 text-right">
                            <div className="flex justify-end gap-1.5 items-center">
                              <button
                                onClick={() => handleToggleOrderStatus(order)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase shadow-3xs cursor-pointer transition-all ${
                                  isDelivered 
                                    ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                    : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                }`}
                                title="পেন্ডিং ও ডেলিভার্ড এন্ট্রি টগল করুন"
                              >
                                {isDelivered ? '✓ ডেলিভার্ড' : '⏳ পেন্ডিং'}
                              </button>
                              
                              <button
                                onClick={() => handleDeleteOrder(order.id!)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-500 rounded-lg cursor-pointer transition-colors"
                                title="ডিলিট করুন"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANAGE PRODUCTS CATALOG */}
        {subTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Form to Create/Edit Product (5 columns) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 font-display">
                  <Plus className="w-4 h-4 text-rose-500" />
                  <span>{editingProduct ? 'প্রোডাক্ট প্যানেল এডিট' : 'নতুন প্রোডাক্ট যুক্ত করুন'}</span>
                </h3>
                {editingProduct && (
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setProdName('');
                      setProdPrice('');
                      setProdDesc('');
                      setProdImage('');
                      setProdIsNew(true);
                      setProdCategory('');
                      setProdSubcategory('');
                      setIsCategoryManuallyEdited(false);
                      setSelectedStandardSizes([]);
                      setCustomSizesInput('');
                    }}
                    className="text-xs text-rose-500 font-bold hover:underline"
                  >
                    বাতিল
                  </button>
                )}
              </div>

              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">প্রোডাক্টের নাম *</label>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="যেমন: T900 Ultra Smart Watch"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500 font-display font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">প্রোডাক্টের বিক্রয় মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="যেমন: 1549"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">পূর্বের নিয়মিত মূল্য বা MRP (৳) (ঐচ্ছিক)</label>
                  <input
                    type="number"
                    value={prodOriginalPrice}
                    onChange={(e) => setProdOriginalPrice(e.target.value)}
                    placeholder="যেমন: 1999 (ফাঁকা রাখলে ছাড়ের হিসাব দেখাবে না)"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">ক্যাটাগরি নির্ধারণ করুন *</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => {
                      setProdCategory(e.target.value);
                      setProdSubcategory(''); // reset on main category change
                      setIsCategoryManuallyEdited(true);
                    }}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500 bg-white font-display font-medium text-slate-800 cursor-pointer"
                  >
                    <option value="">কোনো ক্যাটাগরি নেই (No Category)</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {prodCategory && CATEGORY_MAP[prodCategory] && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">সাব-ক্যাটাগরি নির্ধারণ করুন</label>
                    <select
                      value={prodSubcategory}
                      onChange={(e) => setProdSubcategory(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500 bg-white font-display font-medium text-slate-800 cursor-pointer"
                    >
                      <option value="">কোনো সাব-ক্যাটাগরি নেই (No Subcategory)</option>
                      {CATEGORY_MAP[prodCategory].map((sub) => (
                        <option key={sub} value={sub}>
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">প্রোডাক্ট ইমেজ (Unsplash বা অন্য কোনো URL)</label>
                  <input
                    type="url"
                    value={prodImage}
                    onChange={(e) => setProdImage(e.target.value)}
                    placeholder="যেমন: https://images.unsplash.com/..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">খালি রাখলে সিস্টেম স্বয়ংক্রিয়ভাবে ডিফল্ট ছবি যুক্ত করবে।</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">প্রোডাক্ট পরিচিতি / বিবরণ</label>
                  <textarea
                    rows={4}
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="প্রোডাক্টের মূল ফিচার ও ওয়ারেন্টি ইত্যাদি লিখুন..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500 resize-none leading-relaxed text-slate-750 font-display"
                  />
                </div>

                {/* Size Options Management Block */}
                <div className="space-y-2.5 p-3.5 border border-slate-200 rounded-xl bg-slate-50/50">
                  <label className="block text-xs font-bold text-slate-700">প্রোডাক্ট সাইজ অপশন (Sizes)</label>

                  {/* Beautiful Instruction Prompt for Fashion & Clothing Categories */}
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-[11px] leading-relaxed text-slate-650 flex gap-2.5 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-[#f57224] shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1 font-display">
                      <span className="block font-black text-[#f57224] uppercase tracking-wide">পোশাক ও অন্যান্য আইটেমের সাইজ গাইডলাইন:</span>
                      <p className="text-slate-600 font-medium">
                        • <strong className="text-slate-850">পোশাক ক্যাটাগরির জন্য:</strong> নিচে দেওয়া স্ট্যান্ডার্ড সাইজগুলোতে ক্লিক/টিক দিয়ে দ্রুত সাইজ অপশন যুক্ত করুন।
                      </p>
                      <p className="text-slate-600 font-medium">
                        • <strong className="text-slate-850">অন্যান্য কাস্টম সাইজের জন্য:</strong> যেমন জুতার সাইজ (৩৯, ৪০, ৪১) বা বাচ্চাদের সাইজ (২২, ২৪, ২৬) কমা দিয়ে টাইপ করে সরাসরি নিচে ইনপুট দিতে পারবেন।
                      </p>
                    </div>
                  </div>
                  
                  {/* Standard size checkboxes */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">স্ট্যান্ডার্ড সাইজ টিক করুন:</span>
                    <div className="flex flex-wrap gap-2">
                      {STANDARD_SIZES.map((sz) => {
                        const checked = selectedStandardSizes.includes(sz);
                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => {
                              if (checked) {
                                setSelectedStandardSizes(selectedStandardSizes.filter(s => s !== sz));
                              } else {
                                setSelectedStandardSizes([...selectedStandardSizes, sz]);
                              }
                            }}
                            className={`border rounded-lg px-2.5 py-1 text-xs font-extrabold transition-all duration-150 cursor-pointer ${
                              checked 
                                ? 'bg-orange-50 border-orange-500 text-orange-600 font-black' 
                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Other sizes or custom sizes separated by commas */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] text-slate-400 font-bold uppercase">অন্যান্য বা কাস্টম সাইজ (কমা দিয়ে লিখুন):</span>
                    <input
                      type="text"
                      value={customSizesInput}
                      onChange={(e) => setCustomSizesInput(e.target.value)}
                      placeholder="যেমন: 22, 24, 26 অথবা 39, 40, 41"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-rose-500 bg-white"
                    />
                    <p className="text-[9px] text-slate-400">একাধিক সাইজ কমা দিয়ে আলাদা করে লিখুন।</p>
                  </div>

                  {/* Informative Firestore Schema Integration Blueprint Guide */}
                  <div className="mt-3.5 border border-indigo-150/60 rounded-xl bg-indigo-50/20 overflow-hidden shadow-xs">
                    <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 px-3.5 py-2.5 border-b border-indigo-100/60 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-xs">
                        <Database className="w-4 h-4 text-indigo-650 animate-pulse" />
                        <span>ফায়ারবেস ডাটাবেজ সংরক্ষণ স্কিমা গাইড</span>
                      </div>
                      <span className="text-[9px] bg-indigo-650 text-white font-mono px-2 py-0.5 rounded-md font-black uppercase tracking-wider">
                        Active Sync
                      </span>
                    </div>
                    <div className="p-3.5 text-xs text-slate-600 space-y-2.5 leading-relaxed font-display">
                      <p className="font-semibold text-slate-750">
                        এডমিন প্যানেলে সাইজ সিলেক্ট বা টাইপ করার পর ফায়ারস্টোর ডাটাবেজে যেভাবে ডেটা রিয়েলটাইম সেভ হয়:
                      </p>
                      
                      {/* Interactive Code Mockup */}
                      <div className="bg-slate-900 text-slate-300 rounded-xl p-3.5 font-mono text-[10px] leading-relaxed space-y-3.5 shadow-md border border-slate-800">
                        <div>
                          <span className="text-emerald-400 font-black block">// ১. firestore ➔ 'products' collection:</span>
                          <span className="text-slate-400">{"{"}</span>
                          <div className="pl-4">
                            <span className="text-indigo-300">name:</span> <span className="text-amber-300">"Raincoat Super Orbit"</span>,<br />
                            <span className="text-indigo-300">category:</span> <span className="text-amber-300">"Men's & Boys' Fashion"</span>,<br />
                            <span className="text-indigo-300">sizes:</span> <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 border border-emerald-900/30 rounded font-black">["S", "M", "L", "XL"]</span> <span className="text-slate-500">// (Array of Strings)</span>
                          </div>
                          <span className="text-slate-400">{"}"}</span>
                        </div>

                        <div className="border-t border-slate-800 pt-3">
                          <span className="text-amber-450 font-black block">// ২. firestore ➔ 'orders' collection (যখন কাস্টমার অর্ডার সাবমিট করে):</span>
                          <span className="text-slate-400">{"{"}</span>
                          <div className="pl-4">
                            <span className="text-indigo-300">productName:</span> <span className="text-amber-300">"Raincoat Super Orbit"</span>,<br />
                            <span className="text-indigo-300">selectedSize:</span> <span className="text-emerald-400 bg-emerald-955 px-2 py-0.5 border border-emerald-900/30 rounded font-black">"XL"</span> <span className="text-slate-500">// (স্ট্রিং ফিল্ড)</span>
                          </div>
                          <span className="text-slate-400">{"}"}</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-indigo-800 font-extrabold text-[11px] bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100/50 leading-relaxed">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <span>কনজিউমার সাইট এবং এডমিন প্যানেল উভয় জায়গায় এই ফিল্ডটি সফলভাবে রিয়ালটাইমে যুক্ত এবং অটো-সিঙ্ক্রোনাইজ করা হয়েছে!</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="isNew"
                    type="checkbox"
                    checked={prodIsNew}
                    onChange={(e) => setProdIsNew(e.target.checked)}
                    className="rounded border-slate-200 text-rose-500 focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="isNew" className="text-xs font-bold text-slate-600 cursor-pointer">
                    এই প্রোডাক্টটিকে "নতুন (New Product)" ব্যাজ দিয়ে চিহ্নিত করুন
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#0f172a] hover:bg-[#1e293b] text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm active:scale-98 transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{editingProduct ? 'আপডেট সেভ করুন' : 'নতুন প্রোডাক্ট আপলোড'}</span>
                </button>
              </form>
            </div>

            {/* List of Products inside Admin Grid (7 columns) */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider block font-display">বর্তমান প্রোডাক্ট লিস্টসমূহ ({products.length})</h3>
              
              {isLoadingProducts ? (
                <div className="py-12 bg-white rounded-2xl border text-center flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                  <span className="text-xs text-slate-450">প্রোডাক্ট বাকেট চেক করা হচ্ছে...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="py-12 bg-white rounded-2xl border text-center text-slate-450 text-xs">
                  কোনো পণ্য সংযুক্ত করা নেই।
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map(prod => (
                    <div key={prod.id} className="bg-white p-4 rounded-xl border border-slate-200 flex gap-3 shadow-3xs items-start">
                      {prod.image && (
                        <img
                          src={prod.image}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="w-16 h-16 rounded-lg object-cover bg-slate-100 border border-slate-100 shrink-0"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {prod.isNew && (
                            <span className="text-[9px] bg-red-100 text-red-700 border border-red-200/50 px-1 py-0.2 rounded font-bold font-mono">New</span>
                          )}
                          {prod.category && (
                            <span className="text-[9px] bg-sky-100 text-[#0369a1] border border-sky-200 px-1 py-0.2 rounded font-bold font-mono truncate max-w-[120px]">{prod.category}</span>
                          )}
                          <h4 className="font-extrabold text-slate-850 text-xs line-clamp-1 truncate font-display">{prod.name}</h4>
                        </div>
                        <p className="text-blue-600 font-extrabold text-xs font-mono font-display flex items-center gap-1.5 flex-wrap">
                          <span>৳ {prod.price.toLocaleString('en-US')}</span>
                          {prod.originalPrice && prod.originalPrice > prod.price && (
                            <span className="text-slate-400 font-normal line-through text-[10px]">৳ {prod.originalPrice.toLocaleString('en-US')}</span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">{prod.description || 'বিবরণ নেই।'}</p>
                        
                        <div className="pt-2 flex items-center gap-1">
                          <button
                            onClick={() => handleStartEdit(prod)}
                            className="text-[10px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-100 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                          >
                            এডিট করুন
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="p-1.5 text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-100 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: SETTINGS BANK / CODES */}
        {subTab === 'settings' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs max-w-2xl">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-5 font-display flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-500" />
              <span>পেমেন্ট নম্বর ও ডেলিভারি চার্জ নির্ধারণ</span>
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ব্যক্তিগত bKash মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    value={settingBkash}
                    onChange={(e) => setSettingBkash(e.target.value)}
                    placeholder="যেমন: 01625467988 (Personal)"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">ব্যক্তিগত Nagad মোবাইল নম্বর</label>
                  <input
                    type="tel"
                    value={settingNagad}
                    onChange={(e) => setSettingNagad(e.target.value)}
                    placeholder="যেমন: 01625467988 (Personal)"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">ব্যাংক ট্র্যান্সফার নির্দেশনাবলী</label>
                <textarea
                  rows={4}
                  value={settingBank}
                  onChange={(e) => setSettingBank(e.target.value)}
                  placeholder="হিসাব নম্বর, ব্যাংক নাম এবং শাখা ইত্যাদি বিস্তারিত..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 font-mono leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-605 mb-1 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Inside Dhaka Delivery Fee (৳)</span>
                  </label>
                  <input
                    type="number"
                    value={settingInsideDhaka}
                    onChange={(e) => setSettingInsideDhaka(e.target.value)}
                    placeholder="80"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-605 mb-1 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Outside Dhaka Delivery Fee (৳)</span>
                  </label>
                  <input
                    type="number"
                    value={settingOutsideDhaka}
                    onChange={(e) => setSettingOutsideDhaka(e.target.value)}
                    placeholder="150"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              {/* Website Footer Information Management Section */}
              <div className="pt-6 border-t border-slate-100 mt-6 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
                  <span>ওয়েবসাইট ফুটার ইনফরমেশন ম্যানেজমেন্ট (Footer Customization)</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">ডিজাইনার ও ডেভলপার নাম (WhatsApp/Email ক্রেডিট)</label>
                    <input
                      type="text"
                      value={settingFooterDeveloperName}
                      onChange={(e) => setSettingFooterDeveloperName(e.target.value)}
                      placeholder="যেমন: MD KAZI SAGOR"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">যোগাযোগের WhatsApp নম্বর (শুধু সংখ্যা)</label>
                    <input
                      type="text"
                      value={settingFooterWhatsapp}
                      onChange={(e) => setSettingFooterWhatsapp(e.target.value)}
                      placeholder="যেমন: 01625467988"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">যোগাযোগের ইমেইল অ্যাড্রেস</label>
                    <input
                      type="email"
                      value={settingFooterEmail}
                      onChange={(e) => setSettingFooterEmail(e.target.value)}
                      placeholder="যেমন: kazicom03@gmail.com"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">ডিজিটাল লাইফস্টাইল ট্যাগলাইন / স্লোগান</label>
                    <input
                      type="text"
                      value={settingFooterTagline}
                      onChange={(e) => setSettingFooterTagline(e.target.value)}
                      placeholder="যেমন: Digital Lifestyle Companion"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5">ফেসবুক পেজ লিঙ্ক (Facebook Page Link)</label>
                    <input
                      type="url"
                      value={settingFooterFacebook}
                      onChange={(e) => setSettingFooterFacebook(e.target.value)}
                      placeholder="যেমন: https://www.facebook.com/md.sagor.795247"
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5">হেড অফিস ঠিকানা (Head Office Address)</label>
                  <textarea
                    rows={2}
                    value={settingFooterOfficeAddress}
                    onChange={(e) => setSettingFooterOfficeAddress(e.target.value)}
                    placeholder="যেমন: B-2/2, Anandapur, Genda, Savar, Dhaka"
                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-xl cursor-pointer shadow-sm active:scale-98 transition-all flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>সেটিংস ডাটাবেজে সংরক্ষণ করুন</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: REAL-TIME live CHAT MANAGER */}
        {subTab === 'chats' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md overflow-hidden flex flex-col md:flex-row min-h-[550px]" style={{ height: 'calc(100vh - 280px)' }}>
            
            {/* Left Sidebar: Conversations list */}
            <div className="w-full md:w-80 border-r border-slate-200 shrink-0 flex flex-col bg-slate-50/50">
              <div className="p-4 border-b border-slate-100 bg-white">
                <h3 className="text-sm font-extrabold text-[#0f172a] tracking-tight">সমস্ত চ্যাট সেশন</h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">কাস্টমার ও গেস্টদের যেকোনো প্রশ্নের রিয়েল-টাইম উত্তর প্যানেল।</p>
              </div>

              {/* Chat Session records List */}
              <div className="flex-grow overflow-y-auto divide-y divide-slate-100 p-2">
                {isLoadingChats ? (
                  <div className="text-center py-10">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin mx-auto" />
                    <span className="text-[11px] text-slate-400 block mt-2">চ্যাট ডাটা লোড হচ্ছে...</span>
                  </div>
                ) : chatSessions.length === 0 ? (
                  <div className="text-center py-16 text-slate-400 text-xs px-4 leading-relaxed font-medium">
                    এই মুহূর্তে কোনো কাস্টমার চ্যাট সেশন চালু নেই!
                  </div>
                ) : (
                  chatSessions.map((chat) => {
                    const isSelected = selectedSessionId === chat.id;
                    return (
                      <button
                        key={chat.id}
                        onClick={() => setSelectedSessionId(chat.id || null)}
                        className={`w-full text-left p-3.5 rounded-2xl flex items-start gap-3 transition-colors cursor-pointer mb-1 text-xs ${
                          isSelected 
                            ? 'bg-blue-50/70 border border-blue-100/30' 
                            : 'hover:bg-slate-100/60'
                        }`}
                      >
                        <div className={`w-8.5 h-8.5 rounded-xl shrink-0 flex items-center justify-center font-bold text-xs ${
                          chat.unreadByAdmin 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className={`font-bold truncate text-slate-900 ${chat.unreadByAdmin ? 'font-black text-rose-600' : ''}`}>
                              {chat.customerName}
                            </span>
                            <span className="text-[9px] text-slate-400 shrink-0 font-mono">
                              {new Date(chat.lastActive).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <p className="text-[11px] text-slate-450 truncate mt-1 leading-normal">
                            {chat.lastMessage}
                          </p>

                          <div className="flex items-center gap-1.5 mt-1.5">
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                              chat.isGuest 
                                ? 'bg-slate-200 text-slate-600' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {chat.isGuest ? 'Guest' : 'Member'}
                            </span>
                            {chat.unreadByAdmin && (
                              <span className="inline-block bg-rose-500 text-white text-[8px] px-1 py-0.5 font-bold rounded-sm animate-pulse ml-auto">
                                New Message
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Selected chat interactive screen */}
            <div className="flex-grow flex flex-col bg-slate-100/35">
              {!selectedSessionId ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8 max-w-sm mx-auto">
                  <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 border border-blue-200 shadow-sm animate-bounce">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">একটি লাইভ চ্যাট সেশন নির্বাচন করুন</h4>
                  <p className="text-xs text-slate-450 mt-1 lines-relaxed">কাস্টমারকে লাইভ সাপোর্ট প্রদান ও অর্ডার সংক্রান্ত আলাপ করতে বাম পাশের তালিকা থেকে যেকোনো সেশনে ক্লিক করুন।</p>
                </div>
              ) : (
                <>
                  {/* Active session context header */}
                  {(() => {
                    const activeChat = chatSessions.find((c) => c.id === selectedSessionId);
                    return (
                      <div className="p-4 bg-white border-b border-slate-200/80 flex items-center justify-between">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{activeChat?.customerName || 'কাস্টমার'}</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                              activeChat?.isGuest ? 'bg-slate-200 text-slate-600' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {activeChat?.isGuest ? 'Guest' : 'Member'}
                            </span>
                          </h4>
                          {activeChat?.customerPhone && (
                            <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <span>{activeChat.customerPhone}</span>
                            </p>
                          )}
                        </div>

                        <button 
                          onClick={() => setSelectedSessionId(null)}
                          className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 shrink-0"
                        >
                          সেশন বন্ধ করুন
                        </button>
                      </div>
                    );
                  })()}

                  {/* Message stack bubble display */}
                  <div className="flex-grow p-4 overflow-y-auto space-y-4">
                    {activeChatMessages.map((msg) => {
                      const isMe = msg.senderId === 'admin';
                      return (
                        <div 
                          key={msg.id}
                          className={`flex items-start gap-2 max-w-[85%] ${isMe ? 'ml-auto flex-row-reverse' : ''}`}
                        >
                          <div className={`p-1.5 rounded-full shrink-0 ${
                            isMe 
                              ? 'bg-slate-900 text-slate-200' 
                              : 'bg-slate-100 border border-slate-200 text-slate-600'
                          }`}>
                            <User className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className={`text-xs py-2.5 px-3.5 rounded-2xl shadow-3xs leading-relaxed ${
                              isMe 
                                ? 'bg-blue-600 text-white rounded-tr-xs' 
                                : 'bg-white border border-slate-200 text-slate-700 rounded-tl-xs'
                            }`}>
                              {msg.text}
                            </div>
                            <span className="block text-[9px] text-slate-400 mt-1 px-1 font-mono">
                              {new Date(msg.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Admin Reply Composer Form */}
                  <form 
                    onSubmit={handleSendAdminReply}
                    className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
                  >
                    <input
                      type="text"
                      required
                      value={adminReplyText}
                      onChange={(e) => setAdminReplyText(e.target.value)}
                      placeholder="কাস্টমারকে উত্তর লিখুন..."
                      disabled={isSendingReply}
                      className="flex-grow border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition-all focus:ring-1 focus:ring-blue-500/10 placeholder-slate-450 leading-none"
                    />
                    <button
                      type="submit"
                      disabled={!adminReplyText.trim() || isSendingReply}
                      className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      {isSendingReply ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

          </div>
        )}

        {/* TAB 5: CUSTOMER REVIEWS FEEDBACK MODERATION */}
        {subTab === 'reviews' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
              <div>
                <h3 className="text-base font-extrabold text-slate-950 font-display">গ্রাহকদের ফিডব্যাক ও ছবি রিভিউ</h3>
                <p className="text-xs text-slate-500">গ্রাহকদের দেওয়া সমস্ত পণ্য রিভিউ এবং আপলোড করা ছবি এখানে দেখতে ও পরিচালনা করতে পারবেন।</p>
              </div>
            </div>

            {isLoadingReviews ? (
              <div className="p-12 text-center text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#f57224] mb-2" />
                <p className="text-xs text-slate-500 font-display">রিভিউসমূহ ডাটাবেজ থেকে লোড হচ্ছে...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="p-12 text-center bg-slate-50/20 font-display">
                <span className="text-3xl">📝</span>
                <p className="text-xs font-bold text-slate-500 mt-2">এখনো কোনো গ্রাহক রিভিউ পাওয়া যায়নি!</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 uppercase font-black text-slate-600 border-b border-slate-150">
                    <tr>
                      <th className="p-4 font-display">পণ্যের বিবরণ</th>
                      <th className="p-4 font-display">গ্রাহক</th>
                      <th className="p-4 font-display">রেটিং স্কোর</th>
                      <th className="p-4 font-display">লিখিত মন্তব্য</th>
                      <th className="p-4 font-display">সংযুক্ত ছবি রিভিউ</th>
                      <th className="p-4 text-right font-display">নিয়ন্ত্রণ অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reviews.map((rev) => {
                      const matchedProd = products.find(p => p.id === rev.productId);
                      return (
                        <tr key={rev.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img 
                                src={matchedProd?.image || 'https://via.placeholder.com/40'} 
                                alt={rev.productName} 
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 object-contain rounded border border-slate-205 shrink-0 bg-slate-50" 
                              />
                              <div>
                                <h4 className="font-bold text-slate-800 font-display min-w-[120px] max-w-[200px] truncate" title={rev.productName}>
                                  {rev.productName}
                                </h4>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {rev.productId}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            <div className="space-y-0.5 font-display">
                              <div className="flex items-center gap-1.5">
                                <span className="font-black text-slate-800">{rev.customerName || 'সম্মানিত ক্রেতা'}</span>
                                {rev.isVerifiedPurchase && (
                                  <span className="inline-flex items-center bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded border border-emerald-100 leading-none font-bold">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                    <span>যাচাইকৃত</span>
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 block font-mono">
                                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex text-amber-400 shrink-0">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-3.5 h-3.5 ${i < (rev.rating || 5) ? 'fill-current text-amber-400' : 'text-slate-200'}`} 
                                />
                              ))}
                            </div>
                          </td>
                          <td className="p-4">
                            <p className="min-w-[150px] max-w-[320px] text-slate-700 leading-relaxed font-display whitespace-pre-line py-0.5">
                              {rev.comment}
                            </p>
                          </td>
                          <td className="p-4 whitespace-nowrap">
                            {rev.images && rev.images.length > 0 ? (
                              <div className="flex gap-1.5">
                                {rev.images.map((imgUrl: string, idx: number) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setAdminLightboxImage(imgUrl)}
                                    className="relative w-10 h-10 rounded overflow-hidden border border-slate-200 shadow-3xs cursor-zoom-in shrink-0 bg-slate-100 transition-transform active:scale-95 hover:scale-105"
                                  >
                                    <img src={imgUrl} alt="Review attachment" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-xs italic font-display">কোনো ছবি নেই</span>
                            )}
                          </td>
                          <td className="p-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleDeleteReview(rev.id)}
                              className="p-1.5 text-rose-600 hover:text-white hover:bg-rose-600 rounded-lg border border-rose-200/55 transition-all cursor-pointer inline-flex items-center justify-center bg-rose-50/50"
                              title="রিভিউটি মুছে ফেলুন"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: PROMO CODES / COUPONS MANAGEMENT */}
        {subTab === 'coupons' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Create/Edit coupon Form Section */}
            <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs h-fit">
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 mb-5 font-display flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-500" />
                <span>{editingCoupon ? 'কুপন পরিবর্তন করুন' : 'নতুন কুপন কোড তৈরি করুন'}</span>
              </h3>

              <form onSubmit={handleSaveCoupon} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">কুপন কোড (Unique Code) *</label>
                  <input
                    type="text"
                    required
                    value={cCode}
                    onChange={(e) => setCCode(e.target.value.replace(/\s+/g, '').toUpperCase())}
                    placeholder="যেমন: SAVE100, SUMMER25"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">ডিসকাউন্ট ধরণ *</label>
                    <select
                      value={cType}
                      onChange={(e) => setCType(e.target.value as 'flat' | 'percentage')}
                      className="w-full border border-slate-200 bg-white rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-500"
                    >
                      <option value="flat">৳ ফ্ল্যাট ছাড় (Flat ৳)</option>
                      <option value="percentage">% শতাংশ ছাড় (Percentage %)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">পরিমাণ (Value) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={cValue}
                      onChange={(e) => setCValue(e.target.value)}
                      placeholder={cType === 'flat' ? '৳ যেমন: ১০০' : '% যেমন: ১০'}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">ন্যূনতম অর্ডার মূল্য (Min Purchase) ৳</label>
                  <input
                    type="number"
                    min="0"
                    value={cMinPurchase}
                    onChange={(e) => setCMinPurchase(e.target.value)}
                    placeholder="যেমন: ৫00 (0 হলে শর্তহীন)"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">মেয়াদ শেষের তারিখ (Expiry Date) *</label>
                  <input
                    type="date"
                    required
                    value={cExpiryDate}
                    onChange={(e) => setCExpiryDate(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="coupon_active"
                    checked={cActive}
                    onChange={(e) => setCActive(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="coupon_active" className="text-xs font-bold text-slate-700 cursor-pointer select-none">কুপন সক্রিয় (Active Coupon)</label>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2">
                  {editingCoupon && (
                    <button
                      type="button"
                      onClick={handleCancelCouponEdit}
                      className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
                    >
                      বাতিল করুন
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold text-xs py-3 rounded-xl cursor-pointer shadow-sm active:scale-98 transition-all flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{editingCoupon ? 'আপডেট করুন' : 'সংরক্ষণ করুন'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Existing Coupons List moderation Section */}
            <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden h-fit">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/20">
                <div>
                  <h3 className="text-base font-extrabold text-slate-950 font-display">বর্তমান সক্রিয় ও নিষ্ক্রিয় কুপনসমূহ</h3>
                  <p className="text-xs text-slate-500">সমস্ত কুপন কোড, ডিসকাউন্টের মূল্য এবং এক্সপায়ারি ডেট নিয়ন্ত্রণ সেন্টার।</p>
                </div>
              </div>

              {isLoadingCoupons ? (
                <div className="p-12 text-center text-slate-400 font-display">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-2" />
                  <p className="text-xs text-slate-550">কুপনসমূহ ডেটাবেজ থেকে লোড হচ্ছে...</p>
                </div>
              ) : coupons.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-display">
                  <span className="text-3xl">🎫</span>
                  <p className="text-xs font-bold text-slate-500 mt-2">কোনো কুপন তৈরি করা হয়নি!</p>
                  <p className="text-[11px] text-slate-400 mt-1">বাম পাশের ফর্ম থেকে কুপন কোড এড করে প্রথম অফার প্রকাশ করুন।</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead className="bg-slate-50 uppercase font-black text-slate-600 border-b border-slate-150">
                      <tr>
                        <th className="p-4 font-display">কুপন কোড ও ধরণ</th>
                        <th className="p-4 font-display">ডিসকাউন্ট পরিমাণ</th>
                        <th className="p-4 font-display">ন্যূনতম ক্রয় সীমা</th>
                        <th className="p-4 font-display">মেয়াদ শেষ</th>
                        <th className="p-4 font-display">স্ট্যাটাস</th>
                        <th className="p-4 text-right font-display font-black">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {coupons.map((coupon) => {
                        const isExpired = new Date(coupon.expiryDate).getTime() < new Date().setHours(0,0,0,0);
                        return (
                          <tr key={coupon.id} className={`hover:bg-slate-50/40 transition-colors ${!coupon.active || isExpired ? 'bg-slate-50/20 text-slate-400' : 'text-slate-800'}`}>
                            <td className="p-4">
                              <div className="font-mono font-black text-sm tracking-wider uppercase flex items-center gap-1.5 select-all text-slate-900">
                                <Tag className="w-3.5 h-3.5 text-blue-500" />
                                <span>{coupon.code || coupon.id.toUpperCase()}</span>
                              </div>
                              <span className="text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-sans font-bold inline-block mt-1">
                                {coupon.type === 'flat' ? '৳ ফ্ল্যাট নগদ ছাড়' : '% শতকরা ছাড়'}
                              </span>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-900">
                              {coupon.type === 'flat' ? `৳ ${Number(coupon.value).toLocaleString()}` : `${coupon.value}%`}
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-900">
                              ৳ {Number(coupon.minPurchase || 0).toLocaleString()}
                            </td>
                            <td className="p-4 font-mono text-slate-600">
                              <div className="space-y-0.5 font-display">
                                <span>{coupon.expiryDate}</span>
                                {isExpired && (
                                  <span className="block text-[9px] font-black uppercase text-rose-500 tracking-wide font-sans">মেয়াদোত্তীর্ণ (Expired)</span>
                                )}
                              </div>
                            </td>
                            <td className="p-4">
                              <button
                                type="button"
                                onClick={() => handleToggleCouponActive(coupon)}
                                className={`px-2.5 py-1 text-[10px] font-bold rounded-full transition-all border cursor-pointer flex items-center gap-1 leading-none ${
                                  coupon.active && !isExpired
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-100'
                                    : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-100'
                                }`}
                                title={coupon.active ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${coupon.active && !isExpired ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                <span>{coupon.active && !isExpired ? 'Active' : 'Disabled'}</span>
                              </button>
                            </td>
                            <td className="p-4 text-right space-x-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleEditCouponClick(coupon)}
                                className="p-1 px-2.5 text-xs text-indigo-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-all cursor-pointer inline-flex items-center justify-center gap-1"
                                title="পরিবর্তন করুন"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span className="font-semibold text-[10px] font-display">সম্পাদনা</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="p-1 text-rose-600 hover:text-white hover:bg-rose-600 bg-rose-50 rounded-md border border-rose-100 transition-all cursor-pointer inline-flex items-center justify-center"
                                title="কুপন ডিলিট করুন"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Admin Review Lightbox Modal Image Viewer */}
      <AnimatePresence>
        {adminLightboxImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setAdminLightboxImage(null)}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button 
              onClick={() => setAdminLightboxImage(null)}
              className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-colors cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.img 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              src={adminLightboxImage} 
              alt="Review Attachment Enlarged" 
              referrerPolicy="no-referrer"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl select-none"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
