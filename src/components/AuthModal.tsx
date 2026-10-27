import React, { useState } from 'react';
import { UserSession } from '../types';
import { X, ShieldCheck, Key, User, Lock, CheckCircle2, LogOut } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession;
  onLogin: (session: UserSession) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userSession,
  onLogin,
  onLogout,
}) => {
  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState<string>('AlgoTrader_Pro');
  const [email, setEmail] = useState<string>('trader@cryptopulse.io');
  const [password, setPassword] = useState<string>('secret123');
  const [role, setRole] = useState<'TRADER' | 'PRO_TRADER' | 'ADMIN'>('PRO_TRADER');

  if (!isOpen) return null;

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Generate valid simulated JWT token
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(
      JSON.stringify({
        sub: '10492',
        username,
        email,
        role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 72 * 3600,
      })
    );
    const signature = 'dGVzdF9zaWduYXR1cmVfaHMtMjU2X2NyeXB0b3B1bHNl';
    const mockToken = `${header}.${payload}.${signature}`;

    onLogin({
      token: mockToken,
      username,
      email,
      role,
      isAuthenticated: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131722] border border-[#2a2e39] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2e39] bg-[#171b26]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">JSON Web Token (JWT) Kimlik Doğrulama</h2>
              <p className="text-xs text-[#787b86]">Go Auth Microservice &amp; Güvenli API Oturumu</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#2a2e39] text-[#787b86] hover:text-white rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {userSession.isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#171b26] border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-white">{userSession.username}</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    {userSession.role}
                  </span>
                </div>
                <p className="text-xs text-[#787b86]">{userSession.email}</p>
              </div>

              {/* Decoded JWT Inspector */}
              <div>
                <label className="text-[11px] text-[#787b86] font-semibold block mb-1">
                  Aktif JWT Bearer Token (Go Microservices Header)
                </label>
                <div className="p-3 bg-[#0c0e14] border border-[#2a2e39] rounded-lg text-emerald-400 font-mono text-[10px] break-all leading-relaxed">
                  Authorization: Bearer {userSession.token}
                </div>
              </div>

              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full py-2.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Oturumu Kapat</span>
              </button>
            </div>
          ) : (
            <>
              {/* Tab selector */}
              <div className="flex border-b border-[#2a2e39] text-xs font-semibold">
                <button
                  onClick={() => setTab('LOGIN')}
                  className={`flex-1 py-2 text-center border-b-2 transition-all ${
                    tab === 'LOGIN' ? 'border-emerald-500 text-white' : 'border-transparent text-[#787b86]'
                  }`}
                >
                  Giriş Yap
                </button>
                <button
                  onClick={() => setTab('REGISTER')}
                  className={`flex-1 py-2 text-center border-b-2 transition-all ${
                    tab === 'REGISTER' ? 'border-emerald-500 text-white' : 'border-transparent text-[#787b86]'
                  }`}
                >
                  Hesap Oluştur
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-3">
                <div>
                  <label className="text-[11px] text-[#787b86] block mb-1">Kullanıcı Adı</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#787b86] absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full bg-[#1e222d] border border-[#2a2e39] rounded pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#787b86] block mb-1">E-Posta Adresi</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#1e222d] border border-[#2a2e39] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-[#787b86] block mb-1">Şifre</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#787b86] absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full bg-[#1e222d] border border-[#2a2e39] rounded pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-[#787b86] block mb-1">Rol / Yetki</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-[#1e222d] border border-[#2a2e39] rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="TRADER">Trader (Standart)</option>
                    <option value="PRO_TRADER">Pro Trader (Pine Script &amp; Backtest Sınırsız)</option>
                    <option value="ADMIN">Admin (Tüm Mikroservis Yönetimi)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20"
                >
                  {tab === 'LOGIN' ? 'Giriş Yap ve JWT Üret' : 'Kayıt Ol & Giriş Yap'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
