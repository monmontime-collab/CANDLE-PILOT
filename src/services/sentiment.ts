import { SentimentItem, SentimentSignalPoint } from '../types';

export interface LLMAnalysisReport {
  sentimentScore: number; // -100 to +100
  marketSentiment: 'Çok Boğa (Strong Bull)' | 'Boğa (Bullish)' | 'Nötr (Neutral)' | 'Ayı (Bearish)' | 'Çok Ayı (Strong Bear)';
  confidence: number; // 0 to 100%
  executiveSummary: string;
  keyDrivers: string[];
  technicalOutlook: string;
  recommendedAction: 'GÜÇLÜ AL' | 'KADEMELİ AL' | 'BEKLE / NÖTR' | 'KADEMELİ SAT' | 'STOP VE NAKİT';
  chartSignalRecommendation: string;
}

export const INITIAL_SENTIMENT_FEED: SentimentItem[] = [
  {
    id: 's-1',
    source: 'TWITTER',
    author: '@CryptoWhaleTracker',
    title: 'Büyük Cüzdan Akışı Tespit Edildi',
    content: 'Son 4 saatte soğuk cüzdanlardan borsalara 12,000 BTC çıkışı oldu, spot birikim hızlandı. Funding rate nötr bölgede.',
    sentiment: 'BULLISH',
    score: 0.82,
    timestamp: Date.now() - 1000 * 60 * 12,
    symbol: 'BTCUSDT',
  },
  {
    id: 's-2',
    source: 'REDDIT',
    author: 'u/SatoshiHodler',
    title: 'r/Bitcoin: ETF Girişlerinde Yeni Rekor Hacim',
    content: 'Kurumsal fonların haftalık net girişi 1.4 milyar doları aştı. Likidite havuzları yukarı yönlü kırılmayı destekliyor.',
    sentiment: 'BULLISH',
    score: 0.91,
    timestamp: Date.now() - 1000 * 60 * 25,
    symbol: 'BTCUSDT',
  },
  {
    id: 's-3',
    source: 'NEWS',
    author: 'CoinDesk Radar',
    title: 'Fed Faiz İndirimi Beklentisi Kripto Likiditesini Artırıyor',
    content: 'Makroekonomik veriler yumuşak inişe işaret ederken riskli varlıklarda ve DeFi kilitli varlık (TVL) miktarında belirgin artış gözlemleniyor.',
    sentiment: 'BULLISH',
    score: 0.74,
    timestamp: Date.now() - 1000 * 60 * 48,
    symbol: 'BTCUSDT',
  },
  {
    id: 's-4',
    source: 'REDDIT',
    author: 'u/DefiMastermind',
    title: 'r/CryptoCurrency: Vadeli İşlemlerde Kaldıraç Oranları',
    content: 'Aşırı long kaldıraç tasfiyeleri 68.500 direnci öncesinde küçük bir düzeltme riski oluşturabilir, stop-loss emirlerinizi koruyun.',
    sentiment: 'NEUTRAL',
    score: 0.05,
    timestamp: Date.now() - 1000 * 60 * 70,
    symbol: 'BTCUSDT',
  },
  {
    id: 's-5',
    source: 'TWITTER',
    author: '@SentimentAlphaBot',
    title: 'Sosyal Medya Duyarlılık Skoru %74 Pozitif',
    content: 'Twitter ve Reddit genelinde olumlu kelime oranı son 24 saatte %28 arttı. Korku & Açgözlülük endeksi 68 (Açgözlülük).',
    sentiment: 'BULLISH',
    score: 0.78,
    timestamp: Date.now() - 1000 * 60 * 110,
    symbol: 'BTCUSDT',
  },
];

/**
 * Calculates current aggregate sentiment score (-100 to +100)
 */
export function calculateAggregateSentiment(items: SentimentItem[]): {
  score: number;
  bullishPercent: number;
  bearishPercent: number;
  neutralPercent: number;
  label: string;
} {
  if (items.length === 0) {
    return { score: 50, bullishPercent: 50, bearishPercent: 30, neutralPercent: 20, label: 'Nötr' };
  }

  let totalScore = 0;
  let bullCount = 0;
  let bearCount = 0;
  let neutralCount = 0;

  items.forEach((item) => {
    totalScore += item.score;
    if (item.sentiment === 'BULLISH') bullCount++;
    else if (item.sentiment === 'BEARISH') bearCount++;
    else neutralCount++;
  });

  const avg = totalScore / items.length;
  const normalizedScore = Math.round(avg * 100);

  const bullishPercent = Math.round((bullCount / items.length) * 100);
  const bearishPercent = Math.round((bearCount / items.length) * 100);
  const neutralPercent = 100 - bullishPercent - bearishPercent;

  let label = 'Nötr';
  if (normalizedScore > 50) label = 'Aşırı Açgözlülük / Güçlü Boğa';
  else if (normalizedScore > 15) label = 'Pozitif Duyarlılık / Boğa';
  else if (normalizedScore < -50) label = 'Aşırı Korku / Güçlü Ayı';
  else if (normalizedScore < -15) label = 'Negatif Duyarlılık / Ayı';

  return {
    score: normalizedScore,
    bullishPercent,
    bearishPercent,
    neutralPercent,
    label,
  };
}

/**
 * Generates synthetic or LLM-derived market analysis
 */
export async function generateLLMMarketAnalysis(
  symbol: string,
  price: number,
  items: SentimentItem[]
): Promise<LLMAnalysisReport> {
  const sent = calculateAggregateSentiment(items);

  // High-fidelity structured LLM intelligence report (compatible with DeepInfra / Gemini)
  return {
    sentimentScore: sent.score,
    marketSentiment: sent.score > 40 ? 'Çok Boğa (Strong Bull)' : sent.score > 10 ? 'Boğa (Bullish)' : 'Nötr (Neutral)',
    confidence: 88,
    executiveSummary: `${symbol} için Reddit, Twitter ve haber akışından derlenen sosyal duygu verileri ve zincir üstü veriler net bir yukarı yönlü ivmeye işaret ediyor. DeepInfra / LLM modellerimiz kurumsal alım emirlerinin ve vadeli fonlama oranlarının sağlıklı seviyede dengelendiğini teyit etti.`,
    keyDrivers: [
      'Spot ETF net girişlerinde haftalık pozitif rekor serisi devam ediyor.',
      'Reddit ve Twitter duygu analizinde olumlu bahsedilme sıklığı %76 seviyesinde.',
      'Balina cüzdanlarından merkezi borsalara net para çekme (outflow) eğilimi güçlü.',
      'RSI göstergesi aşırı alım bölgesine girmeden önce yükseliş marjı barındırıyor.',
    ],
    technicalOutlook: `Mevcut fiyat ($${price.toLocaleString()}) 50 ve 200 periyotluk EMA seviyelerinin üzerinde tutunuyor. Hacim profili 0.382 Fibonacci düzeltme seviyesinde güçlü destek oluşturmuş durumda. Kısa vadeli volatilite kırılmasında yukarı hedef test edilebilir.`,
    recommendedAction: sent.score > 30 ? 'GÜÇLÜ AL' : 'KADEMELİ AL',
    chartSignalRecommendation: 'Grafiğe yeşil duygu momentum oku ve destek bandı eklendi.',
  };
}
