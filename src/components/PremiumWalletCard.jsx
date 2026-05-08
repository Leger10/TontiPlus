import React from 'react';
import { Wallet, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const PremiumWalletCard = ({ balance, loading }) => {
  return (
    <div className="relative overflow-hidden rounded-xl p-8 animate-fade-in-up premium-shadow border border-[hsl(var(--accent))] green-gradient text-white">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-[hsl(var(--accent))]/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#0a2e1f]/50 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center gap-2 bg-[#1a1a1a]/40 backdrop-blur-md px-4 py-2 rounded-full border border-[hsl(var(--accent))]/30 shadow-inner">
            <Sparkles className="w-4 h-4 text-[hsl(var(--accent))]" />
            <span className="text-xs font-black tracking-widest text-[hsl(var(--accent))] uppercase">Premium Wallet</span>
          </div>
          <div className="p-3 bg-[#1a1a1a]/40 backdrop-blur-md rounded-2xl border border-[hsl(var(--accent))]/30 shadow-inner">
            <Wallet className="w-7 h-7 text-[hsl(var(--accent))]" />
          </div>
        </div>

        <div>
          <p className="text-sm font-bold text-[#b0b0b0] uppercase tracking-widest mb-3">Solde Disponible</p>
          {loading ? (
            <Skeleton className="h-16 w-56 bg-white/10 rounded-xl" />
          ) : (
            <h2 className="text-5xl md:text-6xl font-black tracking-tight flex items-baseline gap-3 text-white drop-shadow-lg">
              {balance?.toLocaleString() || 0}
              <span className="text-2xl font-bold text-[hsl(var(--accent))]">FCFA</span>
            </h2>
          )}
        </div>
      </div>
    </div>
  );
};

export default PremiumWalletCard;