import React, { useState } from 'react';
import { OrderSide, OrderType } from '../types';
import { ArrowUpRight, ArrowDownRight, ShieldCheck, Zap } from 'lucide-react';

interface OrderEntryPanelProps {
  currentPrice: number;
  availableBalance: number;
  symbol: string;
  onPlaceOrder: (order: {
    side: OrderSide;
    type: OrderType;
    price: number;
    amount: number;
    leverage: number;
  }) => void;
}

export const OrderEntryPanel: React.FC<OrderEntryPanelProps> = ({
  currentPrice,
  availableBalance,
  symbol,
  onPlaceOrder,
}) => {
  const [side, setSide] = useState<OrderSide>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('LIMIT');
  const [price, setPrice] = useState<string>(currentPrice ? currentPrice.toFixed(2) : '');
  const [amount, setAmount] = useState<string>('0.05');
  const [leverage, setLeverage] = useState<number>(10);

  const numPrice = orderType === 'MARKET' ? currentPrice : parseFloat(price) || currentPrice;
  const numAmount = parseFloat(amount) || 0;
  const totalValue = numPrice * numAmount;
  const marginRequired = leverage > 0 ? totalValue / leverage : totalValue;

  // Estimated liquidation price
  const estLiqPrice =
    side === 'BUY'
      ? Math.max(0, numPrice * (1 - 0.9 / leverage))
      : numPrice * (1 + 0.9 / leverage);

  const handlePercent = (pct: number) => {
    if (numPrice <= 0) return;
    const maxMargin = availableBalance * (pct / 100);
    const maxVal = maxMargin * leverage;
    const calculatedAmount = maxVal / numPrice;
    setAmount(calculatedAmount.toFixed(4));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numAmount <= 0) return;

    onPlaceOrder({
      side,
      type: orderType,
      price: numPrice,
      amount: numAmount,
      leverage,
    });
  };

  return (
    <div className="w-72 bg-[#131722] border-l border-[#2a2e39] flex flex-col p-3 text-xs select-none">
      {/* Long / Short Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-[#171b26] rounded-lg mb-3">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`py-2 rounded font-bold flex items-center justify-center gap-1 transition-all ${
            side === 'BUY'
              ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/25'
              : 'text-[#787b86] hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>AL / LONG</span>
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`py-2 rounded font-bold flex items-center justify-center gap-1 transition-all ${
            side === 'SELL'
              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
              : 'text-[#787b86] hover:text-white'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>SAT / SHORT</span>
        </button>
      </div>

      {/* Order Type selection */}
      <div className="flex gap-1 mb-3 text-[11px]">
        {(['LIMIT', 'MARKET', 'STOP_LIMIT'] as OrderType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setOrderType(t)}
            className={`flex-1 py-1 rounded font-semibold transition-all ${
              orderType === t ? 'bg-[#2a2e39] text-white' : 'text-[#787b86] hover:text-white hover:bg-[#1e222d]'
            }`}
          >
            {t === 'LIMIT' ? 'Limit' : t === 'MARKET' ? 'Piyasa' : 'Stop'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-3">
        {/* Leverage slider */}
        <div className="bg-[#171b26] p-2.5 rounded-lg border border-[#2a2e39]">
          <div className="flex justify-between items-center mb-1 text-[11px]">
            <span className="text-[#787b86]">Kaldıraç Oranı</span>
            <span className="text-amber-400 font-bold font-mono">{leverage}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="50"
            value={leverage}
            onChange={(e) => setLeverage(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 h-1.5 bg-[#2a2e39] rounded cursor-pointer"
          />
          <div className="flex justify-between text-[9px] text-[#50535e] font-mono mt-1">
            <span>1x</span>
            <span>10x</span>
            <span>25x</span>
            <span>50x</span>
          </div>
        </div>

        {/* Price Input (if not Market) */}
        {orderType !== 'MARKET' ? (
          <div>
            <div className="flex justify-between items-center text-[11px] text-[#787b86] mb-1">
              <span>Emir Fiyatı (USDT)</span>
              <button
                type="button"
                onClick={() => setPrice(currentPrice.toFixed(2))}
                className="text-emerald-400 hover:underline"
              >
                Son Fiyatı Al
              </button>
            </div>
            <input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-[#1e222d] border border-[#2a2e39] rounded px-3 py-1.5 font-mono text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        ) : (
          <div className="p-2 bg-[#171b26] border border-[#2a2e39] rounded text-[11px] text-[#787b86]">
            Piyasa Fiyatı: <strong className="text-white font-mono">${currentPrice.toFixed(2)}</strong> (En iyi fiyattan anında eşleşir)
          </div>
        )}

        {/* Amount Input */}
        <div>
          <div className="flex justify-between items-center text-[11px] text-[#787b86] mb-1">
            <span>Miktar</span>
            <span>{symbol.replace('USDT', '')}</span>
          </div>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-[#1e222d] border border-[#2a2e39] rounded px-3 py-1.5 font-mono text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Quick percentage buttons */}
        <div className="grid grid-cols-4 gap-1">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePercent(pct)}
              className="py-1 bg-[#1e222d] hover:bg-[#2a2e39] border border-[#2a2e39] rounded text-[10px] font-mono text-[#d1d4dc] hover:text-white"
            >
              %{pct}
            </button>
          ))}
        </div>

        {/* Order Details Summary */}
        <div className="bg-[#171b26] p-2.5 rounded-lg border border-[#2a2e39] text-[11px] space-y-1.5 font-mono">
          <div className="flex justify-between text-[#787b86]">
            <span>Gereken Teminat:</span>
            <span className="text-white">${marginRequired.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between text-[#787b86]">
            <span>Toplam Pozisyon Değeri:</span>
            <span className="text-white">${totalValue.toFixed(2)} USDT</span>
          </div>
          <div className="flex justify-between text-[#787b86]">
            <span>Tahmini Tasfiye (Liq):</span>
            <span className="text-amber-400 font-semibold">${estLiqPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#787b86] pt-1 border-t border-[#2a2e39]">
            <span>Kullanılabilir Bakiye:</span>
            <span className="text-emerald-400 font-bold">${availableBalance.toLocaleString()} USDT</span>
          </div>
        </div>

        {/* Submit Order Button */}
        <button
          type="submit"
          className={`w-full py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-lg mt-auto ${
            side === 'BUY'
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'
              : 'bg-rose-500 hover:bg-rose-400 text-white shadow-rose-500/20'
          }`}
        >
          <Zap className="w-4 h-4 fill-current" />
          <span>{side === 'BUY' ? 'AL / LONG AÇ' : 'SAT / SHORT AÇ'}</span>
        </button>
      </form>
    </div>
  );
};
