import React, { useState } from 'react';
import { OrderBookData, PublicTrade } from '../services/binance';

interface OrderBookPanelProps {
  orderBook: OrderBookData;
  trades: PublicTrade[];
  currentPrice: number;
  onPriceClick?: (price: number) => void;
}

export const OrderBookPanel: React.FC<OrderBookPanelProps> = ({
  orderBook,
  trades,
  currentPrice,
  onPriceClick,
}) => {
  const [tab, setTab] = useState<'BOOK' | 'TRADES'>('BOOK');

  const maxBidTotal = orderBook.bids[orderBook.bids.length - 1]?.total || 1;
  const maxAskTotal = orderBook.asks[orderBook.asks.length - 1]?.total || 1;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  return (
    <div className="w-64 bg-[#131722] border-l border-[#2a2e39] flex flex-col text-xs select-none">
      {/* Tabs */}
      <div className="flex border-b border-[#2a2e39] bg-[#171b26]">
        <button
          onClick={() => setTab('BOOK')}
          className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
            tab === 'BOOK'
              ? 'border-emerald-500 text-white bg-[#1e222d]'
              : 'border-transparent text-[#787b86] hover:text-white'
          }`}
        >
          Emir Defteri
        </button>
        <button
          onClick={() => setTab('TRADES')}
          className={`flex-1 py-2 font-semibold text-center border-b-2 transition-all ${
            tab === 'TRADES'
              ? 'border-emerald-500 text-white bg-[#1e222d]'
              : 'border-transparent text-[#787b86] hover:text-white'
          }`}
        >
          İşlemler
        </button>
      </div>

      {tab === 'BOOK' ? (
        <div className="flex-1 flex flex-col p-2 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-3 text-[10px] text-[#787b86] pb-1 border-b border-[#2a2e39] uppercase font-mono">
            <span>Fiyat</span>
            <span className="text-right">Miktar</span>
            <span className="text-right">Toplam</span>
          </div>

          {/* Asks (Sells) in reverse order (highest to lowest ask) */}
          <div className="flex-1 flex flex-col justify-end overflow-hidden py-1">
            {orderBook.asks.slice().reverse().map((ask, i) => {
              const depthPercent = Math.min(100, (ask.total / maxTotal) * 100);
              return (
                <div
                  key={`ask-${i}`}
                  onClick={() => onPriceClick?.(ask.price)}
                  className="grid grid-cols-3 text-[11px] font-mono py-0.5 relative hover:bg-white/5 cursor-pointer"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-rose-500/15 pointer-events-none"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <span className="text-rose-400 font-semibold z-10">{ask.price.toFixed(2)}</span>
                  <span className="text-right text-[#d1d4dc] z-10">{ask.amount.toFixed(3)}</span>
                  <span className="text-right text-[#787b86] z-10">{ask.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Current Mid Market Price Banner */}
          <div className="py-2 my-1 px-2 bg-[#1e222d] rounded flex items-center justify-between font-mono border-y border-[#2a2e39]">
            <span className="text-sm font-bold text-white">${currentPrice.toFixed(2)}</span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Canlı Spread
            </span>
          </div>

          {/* Bids (Buys) */}
          <div className="flex-1 flex flex-col overflow-hidden py-1">
            {orderBook.bids.map((bid, i) => {
              const depthPercent = Math.min(100, (bid.total / maxTotal) * 100);
              return (
                <div
                  key={`bid-${i}`}
                  onClick={() => onPriceClick?.(bid.price)}
                  className="grid grid-cols-3 text-[11px] font-mono py-0.5 relative hover:bg-white/5 cursor-pointer"
                >
                  <div
                    className="absolute right-0 top-0 bottom-0 bg-emerald-500/15 pointer-events-none"
                    style={{ width: `${depthPercent}%` }}
                  />
                  <span className="text-emerald-400 font-semibold z-10">{bid.price.toFixed(2)}</span>
                  <span className="text-right text-[#d1d4dc] z-10">{bid.amount.toFixed(3)}</span>
                  <span className="text-right text-[#787b86] z-10">{bid.total.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 p-2 overflow-y-auto">
          <div className="grid grid-cols-3 text-[10px] text-[#787b86] pb-1 border-b border-[#2a2e39] uppercase font-mono">
            <span>Fiyat</span>
            <span className="text-right">Miktar</span>
            <span className="text-right">Zaman</span>
          </div>
          <div className="divide-y divide-[#1e222d] pt-1">
            {trades.slice(0, 25).map((t) => (
              <div key={t.id} className="grid grid-cols-3 text-[11px] font-mono py-1">
                <span className={t.side === 'BUY' ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                  {t.price.toFixed(2)}
                </span>
                <span className="text-right text-[#d1d4dc]">{t.amount.toFixed(3)}</span>
                <span className="text-right text-[#787b86]">
                  {new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
