import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { motion } from 'motion/react';
import { ShoppingCart, Star, Zap } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface ProductCardProps {
  product: Product;
  onBuy: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
  key?: string | number;
}

export default function ProductCard({ product, onBuy, onSelectProduct }: ProductCardProps) {
  const fallbackImage = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=400';
  const [realReviews, setRealReviews] = useState<any[]>([]);

  useEffect(() => {
    if (!product.id) return;
    const q = query(collection(db, 'reviews'), where('productId', '==', product.id));
    getDocs(q).then((snapshot) => {
      const list: any[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      setRealReviews(list);
    }).catch((error) => {
      console.error("Error fetching product reviews for product card:", error);
    });
  }, [product.id]);

  // Seeded mock elements based on product.id to keep integrity but look incredibly realistic
  const hash = product.id ? product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 42;
  const seedRating = 4.5 + (hash % 6) * 0.1;
  const seedCount = 12 + (hash % 88);

  const totalReviewsCount = seedCount + realReviews.length;
  const totalReviewsSum = (seedRating * seedCount) + realReviews.reduce((acc, r) => acc + (r.rating || 5), 0);
  const rating = (totalReviewsSum / totalReviewsCount).toFixed(1);
  const reviewsCount = totalReviewsCount;
  const remainingStock = 3 + (hash % 7); // 3 to 9 items remaining

  // Check if product has explicit MRP / originalPrice configured from the Admin Panel
  const hasDiscount = !!(product.originalPrice && product.originalPrice > product.price);
  const discountPercent = hasDiscount 
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -6, boxShadow: "0 15px 35px rgba(15, 23, 42, 0.08)" }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onClick={() => onSelectProduct(product)}
      className="bg-white rounded-2xl overflow-hidden border border-slate-200/80 hover:border-[#f57224]/40 shadow-xs flex flex-col group transition-all duration-300 cursor-pointer relative transform-gpu"
    >
      {/* 15% - 30% Off Hot badge */}
      {hasDiscount && (
        <span className="absolute top-2.5 left-2.5 z-10 bg-red-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5 font-sans leading-none">
          <Zap className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300 animate-pulse" />
          <span>{discountPercent}% ছাড়</span>
        </span>
      )}

      {/* Product Image Panel */}
      <div className="relative h-36 sm:h-48 w-full overflow-hidden bg-slate-50 shrink-0">
        <img 
          src={product.image || fallbackImage} 
          alt={product.name}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = fallbackImage;
          }}
        />
        {/* Professional tag status */}
        {product.isNew !== false && (
          <span className="absolute top-2.5 right-2.5 bg-[#f57224] text-white text-[8px] sm:text-[9px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-md shadow-xs font-sans">
            New Arrival
          </span>
        )}
      </div>

      {/* Product Information Panel */}
      <div className="p-4 flex flex-col flex-grow text-left space-y-2.5">
        {/* Category Accent Badge & Rating Stars */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-mono block select-none truncate max-w-[130px]">
            {product.category || 'Accessories'}
          </span>
          
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3 h-3 text-amber-450 fill-amber-400" />
            <span className="text-[10px] font-black text-slate-700 font-mono">{rating}</span>
            <span className="text-[9px] text-slate-400 font-bold font-mono">({reviewsCount})</span>
          </div>
        </div>

        {/* Dynamic product title holding strict attention */}
        <h3 className="font-sans font-extrabold text-slate-800 text-sm group-hover:text-[#f57224] transition-colors leading-snug break-words flex-grow line-clamp-2" title={product.name}>
          {product.name}
        </h3>



        {/* Pricing Segment and Call-to-action */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 mt-auto">
          <div className="flex flex-col text-left">
            {/* Strangled original price to manifest high savings */}
            {hasDiscount && (
              <span className="line-through text-slate-400 text-xs font-bold font-mono leading-none">
                ৳{product.originalPrice?.toLocaleString('en-US')}
              </span>
            )}
            <span className="text-[#f57224] font-black text-base sm:text-lg font-display leading-tight mt-0.5">
              ৳{product.price.toLocaleString('en-US')}
            </span>
          </div>
          
          <button 
            id={`buy-btn-${product.id}`}
            onClick={(e) => {
              e.stopPropagation();
              onBuy(product);
            }} 
            className="flex items-center gap-1 bg-slate-900 hover:bg-gradient-to-r hover:from-[#f57224] hover:to-[#e04f05] text-white text-[11px] font-black py-2.5 px-3 rounded-xl shadow-3xs transition-all duration-300 cursor-pointer transform hover:scale-[1.03] active:scale-[0.97] border-0 shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-white" />
            <span>কিনুন</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

