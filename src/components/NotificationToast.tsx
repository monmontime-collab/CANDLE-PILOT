import React from 'react';
import { RealtimeNotification } from '../types';
import { CheckCircle2, AlertTriangle, Radio, X } from 'lucide-react';

interface NotificationToastProps {
  notifications: RealtimeNotification[];
  onDismiss: (id: string) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ notifications, onDismiss }) => {
  // Show latest 3 toasts
  const visible = notifications.slice(-3);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
      {visible.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto bg-[#171b26] border border-[#2a2e39] text-white p-3 rounded-lg shadow-xl flex items-start gap-3 text-xs animate-slide-in"
        >
          <div className="mt-0.5">
            {n.level === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : n.level === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Radio className="w-4 h-4 text-cyan-400 shrink-0" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="font-bold text-white text-xs">{n.title}</h5>
            <p className="text-[#d1d4dc] text-[11px] mt-0.5">{n.message}</p>
          </div>
          <button
            onClick={() => onDismiss(n.id)}
            className="p-1 hover:bg-[#2a2e39] rounded text-[#787b86] hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
