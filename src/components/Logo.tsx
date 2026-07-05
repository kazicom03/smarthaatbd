import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark'; // 'dark' variant for dark backgrounds, 'light' for light backgrounds
  showText?: boolean;
}

export default function Logo({ 
  className = '', 
  size = 'md', 
  variant = 'dark', 
  showText = true 
}: LogoProps) {
  // Determine sizes
  const iconSizes = {
    sm: 'w-4.5 h-4.5 xs:w-5 xs:h-5 sm:w-6 sm:h-6',
    md: 'w-8 h-8 sm:w-8.5 sm:h-8.5',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-[10px] xs:text-xs sm:text-sm font-semibold tracking-wide',
    md: 'text-base sm:text-lg font-extrabold tracking-tight',
    lg: 'text-2xl font-black tracking-tight'
  };

  const isDark = variant === 'dark';

  return (
    <div id="smarthaatbd-logo" className={`flex items-center ${size === 'sm' ? 'gap-1' : 'gap-2.5'} select-none ${className}`}>
      {/* Icon Design Container */}
      <div className="relative shrink-0 group">
        {/* Subtle, premium copper/orange glow behind the logo on hover */}
        <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-[#ff9a3c] via-[#f57224] to-[#e04f05] opacity-0 group-hover:opacity-60 blur-md transition duration-500"></div>
        
        {/* Sleek Logo Badge */}
        <div className={`relative flex items-center justify-center transition-all duration-300 ${
          size === 'sm' 
            ? 'p-1 rounded-lg border border-slate-800' 
            : 'p-1.5 sm:p-2 rounded-xl border border-slate-800 group-hover:border-slate-700'
        } ${
          isDark 
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 shadow-xl' 
            : 'bg-white shadow-sm'
        }`}>
          {/* Custom Pristine SVG Icon */}
          <svg 
            className={`${iconSizes[size]} transition-transform duration-300 group-hover:scale-105`}
            viewBox="0 0 100 100" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              {/* Premium Gradients */}
              <linearGradient id="premium-brand-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffb238" /> {/* Lustrous Copper Gold */}
                <stop offset="50%" stopColor="#f57224" /> {/* Vibrant Signature Orange */}
                <stop offset="100%" stopColor="#d84000" /> {/* Deep Metallic Copper */}
              </linearGradient>
              <linearGradient id="inner-luxury-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffca28" /> {/* Radiant Gold */}
                <stop offset="60%" stopColor="#f57224" /> {/* Premium Orange Accent */}
                <stop offset="100%" stopColor="#bf360c" /> {/* Copper Finish */}
              </linearGradient>
              <linearGradient id="accent-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffd54f" /> {/* Light Gold Spark */}
                <stop offset="100%" stopColor="#ffb300" /> {/* Deep Gold Spark */}
              </linearGradient>
            </defs>

            {/* Hexagonal Premium Shield/Hex Outline */}
            <path 
              d="M50 8 L86 28 L86 72 L50 92 L14 72 L14 28 Z" 
              stroke="url(#premium-brand-gradient)" 
              strokeWidth="6.5" 
              strokeLinejoin="round" 
              strokeLinecap="round" 
            />

            {/* Inner Minimal 'S' curve for Smart/Savar with luxury premium copper-gold & orange gradient */}
            <path 
              d="M63 32 C60 22, 38 22, 37 32 C36 42, 64 45, 63 56 C62 67, 40 67, 37 58" 
              stroke="url(#inner-luxury-gradient)" 
              strokeWidth="6.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />

            {/* Glowing Smart Node (Golden Spark) in the center-bottom gap of S */}
            <circle 
              cx="50" 
              cy="44" 
              r="6" 
              fill="url(#accent-gold-gradient)" 
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>

      {/* Styled Brand Typography */}
      {showText && (
        <span className={`font-sans tracking-tight ${textSizes[size]} select-none flex items-center`}>
          {/* Smart: bold and sharp premium font-style */}
          <span className={`font-black uppercase tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Smart
          </span>
          {/* haat: copper fill color */}
          <span className="font-extrabold text-[#f57224] tracking-tight ml-[1px]">
            haat
          </span>
          {/* BD Badge: Sleek Premium Orange static label without animate-pulse */}
          <span className={`uppercase font-black px-1.5 rounded-sm bg-gradient-to-r from-[#ff6b2b] to-[#f57224] text-white shadow-[0_2px_6px_rgba(242,101,34,0.3)] tracking-widest font-mono ${
            size === 'sm' ? 'text-[7px] xs:text-[8px] py-0.5 ml-1' : 'text-[9px] sm:text-[10px] py-0.5 ml-1.5 border border-[#ff9f68]/20 rounded-md'
          }`}>
            BD
          </span>
        </span>
      )}
    </div>
  );
}
