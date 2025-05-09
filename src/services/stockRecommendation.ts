import axios from 'axios';
import { getHistoricalData } from '@/lib/yahooFinance';

interface StockRecommendation {
  symbol: string;
  name: string;
  price: number;
  recommendation: string;
  confidence: number;
  metrics: {
    peRatio?: number;
    dividendYield?: number;
    marketCap?: number;
    volatility?: number;
    momentum?: number;
    rsi?: number;
    macd?: number;
    volumeChange?: number;
    beta?: number;
  };
}

// Helper function to calculate RSI
const calculateRSI = (prices: number[], period: number = 14): number => {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const difference = prices[prices.length - i] - prices[prices.length - i - 1];
    if (difference >= 0) {
      gains += difference;
    } else {
      losses -= difference;
    }
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
};

// Helper function to calculate MACD
const calculateMACD = (prices: number[]): number => {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  return ema12 - ema26;
};

// Helper function to calculate EMA
const calculateEMA = (prices: number[], period: number): number => {
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] - ema) * multiplier + ema;
  }
  
  return ema;
};

// Helper function to calculate volume change
const calculateVolumeChange = (volumes: number[], period: number = 5): number => {
  if (volumes.length < period) return 0;
  const recentVolume = volumes.slice(-period).reduce((a, b) => a + b, 0) / period;
  const previousVolume = volumes.slice(-period * 2, -period).reduce((a, b) => a + b, 0) / period;
  return (recentVolume - previousVolume) / previousVolume;
};

// Helper function to calculate volatility
const calculateVolatility = (prices: number[]): number => {
  const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i]);
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length;
  return Math.sqrt(variance);
};

// Helper function to calculate momentum
const calculateMomentum = (prices: number[], period: number = 14): number => {
  if (prices.length < period) return 0;
  const currentPrice = prices[prices.length - 1];
  const pastPrice = prices[prices.length - period];
  return (currentPrice - pastPrice) / pastPrice;
};

// Helper function to calculate recommendation confidence
const calculateConfidence = (metrics: any, type: 'investment' | 'swing'): number => {
  if (type === 'investment') {
    const peScore = metrics.peRatio ? Math.max(0, 1 - Math.abs(metrics.peRatio - 20) / 40) : 0;
    const dividendScore = metrics.dividendYield ? Math.min(1, metrics.dividendYield / 4) : 0;
    const marketCapScore = metrics.marketCap ? Math.min(1, Math.log10(metrics.marketCap) / 12) : 0;
    const betaScore = metrics.beta ? Math.max(0, 1 - Math.abs(metrics.beta - 1) / 2) : 0;
    return (peScore * 0.3 + dividendScore * 0.25 + marketCapScore * 0.25 + betaScore * 0.2);
  } else {
    const volatilityScore = metrics.volatility ? Math.max(0, 1 - metrics.volatility) : 0;
    const momentumScore = metrics.momentum ? Math.min(1, (metrics.momentum + 0.2) / 0.4) : 0;
    const rsiScore = metrics.rsi ? Math.max(0, 1 - Math.abs(metrics.rsi - 50) / 50) : 0;
    const macdScore = metrics.macd ? Math.min(1, (metrics.macd + 2) / 4) : 0;
    const volumeScore = metrics.volumeChange ? Math.min(1, (metrics.volumeChange + 0.5) / 1) : 0;
    return (
      volatilityScore * 0.25 +
      momentumScore * 0.25 +
      rsiScore * 0.2 +
      macdScore * 0.15 +
      volumeScore * 0.15
    );
  }
};

export const getInvestmentRecommendations = async (): Promise<StockRecommendation[]> => {
  try {
    // Expanded list of stocks to analyze
    const stocks = [
      // Tech
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'CRM',
      // Finance
      'JPM', 'BAC', 'V', 'MA', 'AXP', 'GS', 'MS', 'WFC', 'BLK', 'C',
      // Healthcare
      'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'LLY', 'TMO', 'DHR', 'ABT', 'BMY',
      // Consumer
      'WMT', 'PG', 'KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'DIS', 'TGT', 'HD'
    ];
    const recommendations: StockRecommendation[] = [];

    for (const symbol of stocks) {
      try {
        // Get historical data for fundamental analysis
        const historicalData = await getHistoricalData(symbol, '1d', '1mo');
        if (!historicalData || historicalData.length === 0) continue;

        // Get current price
        const currentPrice = historicalData[historicalData.length - 1].close;

        // Fetch additional fundamental data from Yahoo Finance
        const response = await axios.get(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`, {
          params: {
            modules: 'summaryDetail,defaultKeyStatistics,price',
            formatted: true
          }
        });

        const { summaryDetail, defaultKeyStatistics, price } = response.data.quoteSummary.result[0];
        
        const metrics = {
          peRatio: defaultKeyStatistics?.forwardPE?.raw || 0,
          dividendYield: summaryDetail?.dividendYield?.raw || 0,
          marketCap: summaryDetail?.marketCap?.raw || 0,
          beta: defaultKeyStatistics?.beta?.raw || 1
        };

        const confidence = calculateConfidence(metrics, 'investment');
        
        let recommendation = 'Hold';
        if (confidence > 0.7) recommendation = 'Strong Buy';
        else if (confidence > 0.6) recommendation = 'Buy';
        else if (confidence < 0.3) recommendation = 'Sell';

        recommendations.push({
          symbol,
          name: price.longName,
          price: currentPrice,
          recommendation,
          confidence,
          metrics
        });
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
        continue;
      }
    }

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error('Error fetching investment recommendations:', error);
    throw error;
  }
};

export const getSwingTradingRecommendations = async (): Promise<StockRecommendation[]> => {
  try {
    // Expanded list of stocks to analyze
    const stocks = [
      // Tech
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'CRM',
      // Finance
      'JPM', 'BAC', 'V', 'MA', 'AXP', 'GS', 'MS', 'WFC', 'BLK', 'C',
      // Healthcare
      'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'LLY', 'TMO', 'DHR', 'ABT', 'BMY',
      // Consumer
      'WMT', 'PG', 'KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'DIS', 'TGT', 'HD'
    ];
    const recommendations: StockRecommendation[] = [];

    for (const symbol of stocks) {
      try {
        // Get historical data for technical analysis
        const historicalData = await getHistoricalData(symbol, '1d', '1mo');
        if (!historicalData || historicalData.length === 0) continue;

        const prices = historicalData.map(d => d.close);
        const volumes = historicalData.map(d => d.volume);
        const currentPrice = prices[prices.length - 1];

        const metrics = {
          volatility: calculateVolatility(prices),
          momentum: calculateMomentum(prices),
          rsi: calculateRSI(prices),
          macd: calculateMACD(prices),
          volumeChange: calculateVolumeChange(volumes),
          marketCap: 0 // Will be filled from Yahoo Finance
        };

        // Fetch market cap from Yahoo Finance
        const response = await axios.get(`https://query1.finance.yahoo.com/v10/finance/quoteSummary/${symbol}`, {
          params: {
            modules: 'summaryDetail,price',
            formatted: true
          }
        });

        metrics.marketCap = response.data.quoteSummary.result[0].summaryDetail.marketCap.raw;

        const confidence = calculateConfidence(metrics, 'swing');
        
        let recommendation = 'Neutral';
        if (confidence > 0.7 && metrics.momentum > 0 && metrics.rsi > 50) recommendation = 'Swing Buy';
        else if (confidence > 0.7 && metrics.momentum < 0 && metrics.rsi < 50) recommendation = 'Swing Sell';
        else if (confidence < 0.3) recommendation = 'Avoid';

        recommendations.push({
          symbol,
          name: response.data.quoteSummary.result[0].price.longName,
          price: currentPrice,
          recommendation,
          confidence,
          metrics
        });
      } catch (error) {
        console.error(`Error processing ${symbol}:`, error);
        continue;
      }
    }

    // Sort by confidence
    return recommendations.sort((a, b) => b.confidence - a.confidence);
  } catch (error) {
    console.error('Error fetching swing trading recommendations:', error);
    throw error;
  }
}; 