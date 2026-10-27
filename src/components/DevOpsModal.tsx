import React, { useState } from 'react';
import {
  X,
  Boxes,
  Copy,
  Check,
  Cpu,
  Layers,
  Terminal,
  Server,
  GitBranch,
  Download,
  Laptop,
  Monitor,
  FolderArchive,
} from 'lucide-react';
import {
  GO_AUTH_SERVICE_CODE,
  GO_MARKET_SERVICE_CODE,
  GO_STRATEGY_SERVICE_CODE,
  GO_SENTIMENT_SERVICE_CODE,
  DOCKERFILE_MULTI_ARCH_CODE,
  DOCKER_COMPOSE_CODE,
  GITHUB_ACTIONS_CI_CD_CODE,
  README_KURULUM_CODE,
  PROJECT_BUNDLE_FILES,
  downloadFullProjectZip,
} from '../services/devopsData';

interface DevOpsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevOpsModal: React.FC<DevOpsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<
    | 'OVERVIEW'
    | 'GO_AUTH'
    | 'GO_MARKET'
    | 'GO_STRATEGY'
    | 'GO_SENTIMENT'
    | 'DOCKERFILE'
    | 'COMPOSE'
    | 'GITHUB_ACTIONS'
  >('OVERVIEW');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadZip = () => {
    downloadFullProjectZip();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  const downloadSingleFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#131722] border border-[#2a2e39] rounded-xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2a2e39] bg-[#171b26]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Bilgisayara İndir &amp; Çok Platformlu Docker İmaj Kurulumu (Apple &amp; Windows)
              </h2>
              <p className="text-xs text-[#787b86]">
                Go Mikroservisleri (GORM + MySQL + WebSocket), Multi-Arch Dockerfile ve GitHub Actions CI/CD Paketi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tüm Paketi İndir (.ZIP)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#2a2e39] text-[#787b86] hover:text-white rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-[#2a2e39] bg-[#171b26] px-4 overflow-x-auto text-xs font-semibold gap-1">
          {[
            { id: 'OVERVIEW', label: 'İndirme & Docker Kurulum Rehberi', icon: FolderArchive },
            { id: 'DOCKERFILE', label: 'Multi-Arch Dockerfile', icon: Cpu },
            { id: 'COMPOSE', label: 'docker-compose.yml', icon: Boxes },
            { id: 'GO_AUTH', label: 'Auth Service (Go+GORM)', icon: Server },
            { id: 'GO_MARKET', label: 'Market WS (Go)', icon: Terminal },
            { id: 'GO_STRATEGY', label: 'Strategy Service (Go)', icon: Layers },
            { id: 'GO_SENTIMENT', label: 'Sentiment LLM (Go)', icon: Server },
            { id: 'GITHUB_ACTIONS', label: 'GitHub Actions CI/CD', icon: GitBranch },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-white bg-[#1e222d]'
                    : 'border-transparent text-[#787b86] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#131722]">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Hero ZIP Download Box */}
              <div className="p-5 rounded-xl bg-gradient-to-r from-blue-950/70 via-[#171b26] to-emerald-950/60 border border-blue-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded">
                      Hazır Kurulum Paketi ({PROJECT_BUNDLE_FILES.length} Dosya)
                    </span>
                    <span className="text-xs text-blue-300 font-mono">cryptopulse-docker-microservices.zip</span>
                  </div>
                  <h3 className="text-sm font-bold text-white">
                    1. Adım: Tüm Go Mikroservislerini ve Docker Yapılandırmasını Bilgisayarınıza İndirin
                  </h3>
                  <p className="text-xs text-[#b2b5be] max-w-2xl leading-relaxed">
                    Aşağıdaki butona tıkladığınızda; <strong>4 adet Go mikroservisi (Auth/JWT/GORM, Market WS, Strategy, Sentiment/DeepInfra)</strong>, <strong>MySQL 8.0 &amp; Redis docker-compose.yml</strong>, Apple Silicon &amp; Windows uyumlu <strong>Multi-Arch Dockerfile</strong>, tek tıkla çalıştırma betikleri (<code>start-mac-apple-silicon.sh</code> ve <code>start-windows.bat</code>) ve <strong>GitHub Actions CI/CD</strong> dosyaları tek bir <code>.zip</code> arşivi olarak bilgisayarınıza iner.
                  </p>
                </div>

                <button
                  onClick={handleDownloadZip}
                  className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-xl shadow-emerald-500/20 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadSuccess ? '✓ ZIP İndirildi!' : 'Bilgisayara İndir (.ZIP)'}</span>
                </button>
              </div>

              {/* Step-by-Step Platform Guides: Apple Mac vs Windows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Apple Silicon Mac Card */}
                <div className="p-4 rounded-xl bg-[#171b26] border border-[#2a2e39] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-emerald-400" />
                      <h4 className="font-bold text-white text-xs">
                        Apple Bilgisayarda Canlıya Alma (macOS M1/M2/M3/M4 - arm64)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                      linux/arm64
                    </span>
                  </div>
                  <p className="text-xs text-[#787b86]">
                    İndirdiğiniz ZIP dosyasını klasöre çıkarın. Terminal&apos;i açıp klasör içinde şu komutu çalıştırın:
                  </p>
                  <div className="flex items-center justify-between p-2.5 rounded bg-[#0c0e14] border border-[#2a2e39]">
                    <code className="font-mono text-[11px] text-emerald-300">
                      chmod +x start-mac-apple-silicon.sh &amp;&amp; ./start-mac-apple-silicon.sh
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(
                          'chmod +x start-mac-apple-silicon.sh && ./start-mac-apple-silicon.sh',
                          'mac-cmd'
                        )
                      }
                      className="px-2 py-1 bg-[#1e222d] hover:bg-[#2a2e39] text-[11px] rounded text-[#d1d4dc] flex items-center gap-1 shrink-0 ml-2"
                    >
                      {copiedKey === 'mac-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Kopyala</span>
                    </button>
                  </div>
                </div>

                {/* Windows PC Card */}
                <div className="p-4 rounded-xl bg-[#171b26] border border-[#2a2e39] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-cyan-400" />
                      <h4 className="font-bold text-white text-xs">
                        Windows Bilgisayarda Canlıya Alma (Windows 10/11 - amd64)
                      </h4>
                    </div>
                    <span className="text-[10px] font-mono bg-cyan-500/15 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30">
                      linux/amd64
                    </span>
                  </div>
                  <p className="text-xs text-[#787b86]">
                    İndirdiğiniz ZIP içindeki <code>start-windows.bat</code> dosyasına çift tıklayın veya PowerShell&apos;de çalıştırın:
                  </p>
                  <div className="flex items-center justify-between p-2.5 rounded bg-[#0c0e14] border border-[#2a2e39]">
                    <code className="font-mono text-[11px] text-cyan-300">
                      docker compose up -d --build
                    </code>
                    <button
                      onClick={() => copyToClipboard('docker compose up -d --build', 'win-cmd')}
                      className="px-2 py-1 bg-[#1e222d] hover:bg-[#2a2e39] text-[11px] rounded text-[#d1d4dc] flex items-center gap-1 shrink-0 ml-2"
                    >
                      {copiedKey === 'win-cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>Kopyala</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-Arch Docker Image Builder Section */}
              <div className="p-4 rounded-xl bg-[#171b26] border border-[#2a2e39] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Ortak Çok Platformlu (Multi-Arch) Docker İmajı Oluşturma Komutu (Docker Buildx)
                    </h4>
                  </div>
                  <span className="text-[10px] text-[#787b86] font-mono">
                    Tek İmaj = Hem Mac (arm64) Hem Windows (amd64)
                  </span>
                </div>
                <p className="text-xs text-[#787b86]">
                  Docker Hub veya GitHub Container Registry üzerine hem Apple hem Windows makinelerin doğrudan çekip (<code>docker pull</code>) çalıştırabileceği ortak imajı derlemek için:
                </p>
                <div className="flex items-center justify-between p-2.5 rounded bg-[#0c0e14] border border-[#2a2e39]">
                  <code className="font-mono text-xs text-purple-300">
                    docker buildx build --platform linux/amd64,linux/arm64 -t cryptopulse/trading-platform:latest --push .
                  </code>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        'docker buildx build --platform linux/amd64,linux/arm64 -t cryptopulse/trading-platform:latest --push .',
                        'buildx-cmd'
                      )
                    }
                    className="px-2.5 py-1 bg-[#1e222d] hover:bg-[#2a2e39] text-xs font-sans rounded text-[#d1d4dc] flex items-center gap-1 shrink-0 ml-2"
                  >
                    {copiedKey === 'buildx-cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Kopyala</span>
                  </button>
                </div>
              </div>

              {/* Individual Files List in the ZIP */}
              <div className="p-4 rounded-xl bg-[#171b26] border border-[#2a2e39]">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">
                  ZIP Paketi İçindeki Dosyalar (Tek Tek de İndirebilirsiniz)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {PROJECT_BUNDLE_FILES.map((file) => (
                    <div
                      key={file.path}
                      className="flex items-center justify-between p-2 rounded bg-[#131722] border border-[#2a2e39] text-xs"
                    >
                      <span className="font-mono text-[11px] text-[#d1d4dc] truncate mr-2" title={file.path}>
                        {file.path}
                      </span>
                      <button
                        onClick={() => downloadSingleFile(file.path.split('/').pop() || 'file.txt', file.content)}
                        className="px-2 py-1 bg-[#1e222d] hover:bg-blue-600 text-[#b2b5be] hover:text-white rounded text-[10px] font-semibold flex items-center gap-1 shrink-0 transition-all"
                      >
                        <Download className="w-3 h-3" />
                        <span>İndir</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'OVERVIEW' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#787b86]">
                  {activeTab === 'GO_AUTH' && 'backend/services/auth-service/main.go (Go + Gin + JWT + GORM MySQL)'}
                  {activeTab === 'GO_MARKET' && 'backend/services/market-service/main.go (Go + Gorilla WebSocket + Binance)'}
                  {activeTab === 'GO_STRATEGY' && 'backend/services/strategy-service/main.go (Go + Pine Backtester)'}
                  {activeTab === 'GO_SENTIMENT' && 'backend/services/sentiment-service/main.go (Go + DeepInfra LLM)'}
                  {activeTab === 'DOCKERFILE' && 'Dockerfile (Multi-Arch: Apple arm64 + Windows amd64)'}
                  {activeTab === 'COMPOSE' && 'docker-compose.yml (MySQL 8.0, Redis, 4 Go Microservices)'}
                  {activeTab === 'GITHUB_ACTIONS' && '.github/workflows/deploy.yml (GitHub Actions CI/CD Pipeline)'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const code =
                        activeTab === 'GO_AUTH'
                          ? GO_AUTH_SERVICE_CODE
                          : activeTab === 'GO_MARKET'
                          ? GO_MARKET_SERVICE_CODE
                          : activeTab === 'GO_STRATEGY'
                          ? GO_STRATEGY_SERVICE_CODE
                          : activeTab === 'GO_SENTIMENT'
                          ? GO_SENTIMENT_SERVICE_CODE
                          : activeTab === 'DOCKERFILE'
                          ? DOCKERFILE_MULTI_ARCH_CODE
                          : activeTab === 'COMPOSE'
                          ? DOCKER_COMPOSE_CODE
                          : GITHUB_ACTIONS_CI_CD_CODE;
                      copyToClipboard(code, activeTab);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-all"
                  >
                    {copiedKey === activeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Kodu Kopyala</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-lg bg-[#0c0e14] border border-[#2a2e39] text-emerald-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-[55vh]">
                {activeTab === 'GO_AUTH' && GO_AUTH_SERVICE_CODE}
                {activeTab === 'GO_MARKET' && GO_MARKET_SERVICE_CODE}
                {activeTab === 'GO_STRATEGY' && GO_STRATEGY_SERVICE_CODE}
                {activeTab === 'GO_SENTIMENT' && GO_SENTIMENT_SERVICE_CODE}
                {activeTab === 'DOCKERFILE' && DOCKERFILE_MULTI_ARCH_CODE}
                {activeTab === 'COMPOSE' && DOCKER_COMPOSE_CODE}
                {activeTab === 'GITHUB_ACTIONS' && GITHUB_ACTIONS_CI_CD_CODE}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
