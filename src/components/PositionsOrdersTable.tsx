import React, { useState } from 'react';
import { Position, Order, RealtimeNotification } from '../types';
import { XCircle, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

interface PositionsOrdersTableProps {
  positions: Position[];
  orders: Order[];
  notifications: RealtimeNotification[];
  onClosePosition: (positionId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

export const PositionsOrdersTable: React.FC<PositionsOrdersTableProps> = ({
  positions,
  orders,
  notifications,
  onClosePosition,
  onCancelOrder,
}) => {
  const [tab, setTab] = useState<'POSITIONS' | 'ORDERS' | 'HISTORY' | 'WS_STREAM'>('POSITIONS');

  const openOrders = orders.filter((o) => o.status === 'OPEN');
  const pastOrders = orders.filter((o) => o.status !== 'OPEN');

  return (
    <div className="h-56 bg-[#131722] border-t border-[#2a2e39] flex flex-col text-xs select-none">
      {/* Header Tabs */}
      <div className="flex items-center gap-1 px-3 bg-[#171b26] border-b border-[#2a2e39]">
        <button
          onClick={() => setTab('POSITIONS')}
          className={`py-2 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
            tab === 'POSITIONS'
              ? 'border-emerald-500 text-white bg-[#1e222d]'
              : 'border-transparent text-[#787b86] hover:text-white'
          }`}
        >
          <span>Açık Pozisyonlar</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2a2e39] text-emerald-400 font-mono">
            {positions.length}
          </span>
        </button>

        <button
          onClick={() => setTab('ORDERS')}
          className={`py-2 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
            tab === 'ORDERS'
              ? 'border-emerald-500 text-white bg-[#1e222d]'
              : 'border-transparent text-[#787b86] hover:text-white'
          }`}
        >
          <span>Bekleyen Emirler</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#2a2e39] text-cyan-400 font-mono">
            {openOrders.length}
          </span>
        </button>

        <button
          onClick={() => setTab('HISTORY')}
          className={`py-2 px-3 font-semibold border-b-2 transition-all ${
            tab === 'HISTORY'
              ? 'border-emerald-500 text-white bg-[#1e222d]'
              : 'border-transparent text-[#787b86] hover:text-white'
          }`}
        >
          Emir Geçmişi
        </button>

        <button
          onClick={() => setTab('WS_STREAM')}
          className={`py-2 px-3 font-semibold border-b-2 flex items-center gap-1.5 transition-all ${
            tab === 'WS_STREAM'
              ? 'border-emerald-500 text-white bg-[#1e222d]'
              : 'border-transparent text-[#787b86] hover:text-white'
          }`}
        >
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>WebSocket Bildirim Akışı</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'POSITIONS' && (
          positions.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#787b86]">
              Açık pozisyon bulunmuyor. Sağ panelden Long veya Short işlem açabilirsiniz.
            </div>
          ) : (
            <table className="w-full text-left font-mono">
              <thead className="bg-[#171b26] text-[#787b86] text-[10px] uppercase sticky top-0">
                <tr>
                  <th className="py-2 px-3">Sembol / Yön</th>
                  <th className="py-2 px-3">Büyüklük</th>
                  <th className="py-2 px-3">Giriş Fiyatı</th>
                  <th className="py-2 px-3">Gösterge Fiyat</th>
                  <th className="py-2 px-3">Likidasyon</th>
                  <th className="py-2 px-3">Kaldıraç</th>
                  <th className="py-2 px-3">K/Z (PnL)</th>
                  <th className="py-2 px-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e222d] text-[11px]">
                {positions.map((pos) => {
                  const isProfit = pos.pnl >= 0;
                  return (
                    <tr key={pos.id} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-white mr-1.5">{pos.symbol}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            pos.side === 'LONG'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {pos.side}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-white">{pos.amount}</td>
                      <td className="py-2.5 px-3 text-[#d1d4dc]">${pos.entryPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-[#d1d4dc]">${pos.markPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-amber-400 font-semibold">${pos.liquidationPrice.toFixed(2)}</td>
                      <td className="py-2.5 px-3 text-cyan-400">{pos.leverage}x</td>
                      <td className="py-2.5 px-3">
                        <span className={`font-bold ${isProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isProfit ? '+' : ''}${pos.pnl.toFixed(2)} ({isProfit ? '+' : ''}{pos.pnlPercent.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => onClosePosition(pos.id)}
                          className="px-2.5 py-1 bg-[#1e222d] hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/40 rounded text-[10px] font-sans font-bold transition-all"
                        >
                          Piyasa ile Kapat
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )
        )}

        {tab === 'ORDERS' && (
          openOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#787b86]">
              Bekleyen aktif limit emri bulunmamaktadır.
            </div>
          ) : (
            <table className="w-full text-left font-mono">
              <thead className="bg-[#171b26] text-[#787b86] text-[10px] uppercase sticky top-0">
                <tr>
                  <th className="py-2 px-3">Zaman</th>
                  <th className="py-2 px-3">Sembol</th>
                  <th className="py-2 px-3">Tür</th>
                  <th className="py-2 px-3">Yön</th>
                  <th className="py-2 px-3">Emir Fiyatı</th>
                  <th className="py-2 px-3">Miktar</th>
                  <th className="py-2 px-3 text-right">İptal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e222d] text-[11px]">
                {openOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-[#787b86]">
                      {new Date(o.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-white">{o.symbol}</td>
                    <td className="py-2 px-3 text-cyan-400">{o.type}</td>
                    <td className="py-2 px-3 font-semibold text-emerald-400">{o.side}</td>
                    <td className="py-2 px-3 text-white">${o.price.toFixed(2)}</td>
                    <td className="py-2 px-3 text-[#d1d4dc]">{o.amount}</td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => onCancelOrder(o.id)}
                        className="p-1 hover:bg-rose-500/20 text-[#787b86] hover:text-rose-400 rounded transition-all"
                        title="Emri İptal Et"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'HISTORY' && (
          pastOrders.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[#787b86]">
              Geçmiş işlem kaydı bulunmamaktadır.
            </div>
          ) : (
            <table className="w-full text-left font-mono">
              <thead className="bg-[#171b26] text-[#787b86] text-[10px] uppercase sticky top-0">
                <tr>
                  <th className="py-2 px-3">Zaman</th>
                  <th className="py-2 px-3">Sembol</th>
                  <th className="py-2 px-3">Tür</th>
                  <th className="py-2 px-3">Yön</th>
                  <th className="py-2 px-3">Fiyat</th>
                  <th className="py-2 px-3">Miktar</th>
                  <th className="py-2 px-3">Durum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e222d] text-[11px]">
                {pastOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02]">
                    <td className="py-2 px-3 text-[#787b86]">{new Date(o.createdAt).toLocaleTimeString()}</td>
                    <td className="py-2 px-3 text-white">{o.symbol}</td>
                    <td className="py-2 px-3 text-cyan-400">{o.type}</td>
                    <td className="py-2 px-3 font-semibold text-emerald-400">{o.side}</td>
                    <td className="py-2 px-3">${o.price.toFixed(2)}</td>
                    <td className="py-2 px-3">{o.amount}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold">
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === 'WS_STREAM' && (
          <div className="p-3 font-mono space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="flex items-center gap-2 p-2 rounded bg-[#171b26] border border-[#2a2e39] text-[11px]"
              >
                {n.level === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : n.level === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span className="text-[#787b86]">[{new Date(n.time).toLocaleTimeString()}]</span>
                <strong className="text-white">{n.title}:</strong>
                <span className="text-[#d1d4dc]">{n.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
