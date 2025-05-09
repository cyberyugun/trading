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
    bollingerUpper?: number;
    bollingerLower?: number;
    atr?: number;
    profitMargin?: number;
    debtToEquity?: number;
    currentRatio?: number;
    stochK?: number;
    stochD?: number;
    ichimokuCloud?: {
      conversionLine: number;
      baseLine: number;
      leadingSpanA: number;
      leadingSpanB: number;
    };
    obv?: number;
    roc?: number;
    eps?: number;
    revenueGrowth?: number;
    freeCashFlow?: number;
    williamsR?: number;
    mfi?: number;
    adx?: number;
    parabolicSAR?: number;
    keltnerUpper?: number;
    keltnerMiddle?: number;
    keltnerLower?: number;
    cmf?: number;
    rvi?: number;
    forceIndex?: number;
    bullPower?: number;
    bearPower?: number;
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

// Helper function to calculate Bollinger Bands
const calculateBollingerBands = (prices: number[], period: number = 20, stdDev: number = 2): { upper: number; lower: number } => {
  if (prices.length < period) return { upper: 0, lower: 0 };
  
  const sma = prices.slice(-period).reduce((a, b) => a + b, 0) / period;
  const squaredDiffs = prices.slice(-period).map(price => Math.pow(price - sma, 2));
  const standardDeviation = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
  
  return {
    upper: sma + (standardDeviation * stdDev),
    lower: sma - (standardDeviation * stdDev)
  };
};

// Helper function to calculate Average True Range (ATR)
const calculateATR = (high: number[], low: number[], close: number[], period: number = 14): number => {
  if (high.length < 2) return 0;
  
  const trueRanges: number[] = [];
  for (let i = 1; i < high.length; i++) {
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    );
    trueRanges.push(tr);
  }
  
  return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
};

// Helper function to calculate Stochastic Oscillator
const calculateStochastic = (high: number[], low: number[], close: number[], period: number = 14): { k: number; d: number } => {
  if (high.length < period) return { k: 50, d: 50 };
  
  const highestHigh = Math.max(...high.slice(-period));
  const lowestLow = Math.min(...low.slice(-period));
  const currentClose = close[close.length - 1];
  
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  const d = (k + (close[close.length - 2] - lowestLow) / (highestHigh - lowestLow) * 100) / 2;
  
  return { k, d };
};

// Helper function to calculate Ichimoku Cloud
const calculateIchimokuCloud = (high: number[], low: number[], period: number = 9): {
  conversionLine: number;
  baseLine: number;
  leadingSpanA: number;
  leadingSpanB: number;
} => {
  if (high.length < period * 2) return {
    conversionLine: 0,
    baseLine: 0,
    leadingSpanA: 0,
    leadingSpanB: 0
  };

  const highestHigh = Math.max(...high.slice(-period));
  const lowestLow = Math.min(...low.slice(-period));
  const conversionLine = (highestHigh + lowestLow) / 2;

  const highestHigh26 = Math.max(...high.slice(-period * 2));
  const lowestLow26 = Math.min(...low.slice(-period * 2));
  const baseLine = (highestHigh26 + lowestLow26) / 2;

  const leadingSpanA = (conversionLine + baseLine) / 2;
  const leadingSpanB = (highestHigh26 + lowestLow26) / 2;

  return {
    conversionLine,
    baseLine,
    leadingSpanA,
    leadingSpanB
  };
};

// Helper function to calculate On-Balance Volume (OBV)
const calculateOBV = (close: number[], volume: number[]): number => {
  let obv = 0;
  for (let i = 1; i < close.length; i++) {
    if (close[i] > close[i - 1]) {
      obv += volume[i];
    } else if (close[i] < close[i - 1]) {
      obv -= volume[i];
    }
  }
  return obv;
};

// Helper function to calculate Rate of Change (ROC)
const calculateROC = (prices: number[], period: number = 14): number => {
  if (prices.length < period) return 0;
  const currentPrice = prices[prices.length - 1];
  const pastPrice = prices[prices.length - period];
  return ((currentPrice - pastPrice) / pastPrice) * 100;
};

// Helper function to calculate Williams %R
const calculateWilliamsR = (high: number[], low: number[], close: number[], period: number = 14): number => {
  if (high.length < period) return -50;
  
  const highestHigh = Math.max(...high.slice(-period));
  const lowestLow = Math.min(...low.slice(-period));
  const currentClose = close[close.length - 1];
  
  return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
};

// Helper function to calculate Money Flow Index (MFI)
const calculateMFI = (high: number[], low: number[], close: number[], volume: number[], period: number = 14): number => {
  if (high.length < period) return 50;
  
  const typicalPrices = high.map((h, i) => (h + low[i] + close[i]) / 3);
  const moneyFlow = typicalPrices.map((tp, i) => tp * volume[i]);
  
  let positiveFlow = 0;
  let negativeFlow = 0;
  
  for (let i = 1; i <= period; i++) {
    const currentFlow = moneyFlow[moneyFlow.length - i];
    const previousFlow = moneyFlow[moneyFlow.length - i - 1];
    
    if (currentFlow > previousFlow) {
      positiveFlow += currentFlow;
    } else {
      negativeFlow += currentFlow;
    }
  }
  
  if (negativeFlow === 0) return 100;
  const moneyRatio = positiveFlow / negativeFlow;
  return 100 - (100 / (1 + moneyRatio));
};

// Helper function to calculate Average Directional Index (ADX)
const calculateADX = (high: number[], low: number[], close: number[], period: number = 14): number => {
  if (high.length < period * 2) return 0;
  
  const trueRanges: number[] = [];
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  
  for (let i = 1; i < high.length; i++) {
    const tr = Math.max(
      high[i] - low[i],
      Math.abs(high[i] - close[i - 1]),
      Math.abs(low[i] - close[i - 1])
    );
    trueRanges.push(tr);
    
    const upMove = high[i] - high[i - 1];
    const downMove = low[i - 1] - low[i];
    
    if (upMove > downMove && upMove > 0) {
      plusDM.push(upMove);
      minusDM.push(0);
    } else if (downMove > upMove && downMove > 0) {
      plusDM.push(0);
      minusDM.push(downMove);
    } else {
      plusDM.push(0);
      minusDM.push(0);
    }
  }
  
  const smoothedTR = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
  const smoothedPlusDM = plusDM.slice(-period).reduce((a, b) => a + b, 0) / period;
  const smoothedMinusDM = minusDM.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  const plusDI = (smoothedPlusDM / smoothedTR) * 100;
  const minusDI = (smoothedMinusDM / smoothedTR) * 100;
  
  return Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100;
};

// Helper function to calculate Parabolic SAR
const calculateParabolicSAR = (high: number[], low: number[], acceleration: number = 0.02, maximum: number = 0.2): number => {
  if (high.length < 2) return 0;
  
  let sar = low[0];
  let trend = 1; // 1 for uptrend, -1 for downtrend
  let ep = high[0]; // Extreme point
  let af = acceleration; // Acceleration factor
  
  for (let i = 1; i < high.length; i++) {
    if (trend === 1) {
      if (low[i] < sar) {
        trend = -1;
        sar = ep;
        ep = low[i];
        af = acceleration;
      } else {
        if (high[i] > ep) {
          ep = high[i];
          af = Math.min(af + acceleration, maximum);
        }
        sar = sar + af * (ep - sar);
      }
    } else {
      if (high[i] > sar) {
        trend = 1;
        sar = ep;
        ep = high[i];
        af = acceleration;
      } else {
        if (low[i] < ep) {
          ep = low[i];
          af = Math.min(af + acceleration, maximum);
        }
        sar = sar - af * (sar - ep);
      }
    }
  }
  
  return sar;
};

// Helper function to calculate Keltner Channels
const calculateKeltnerChannels = (high: number[], low: number[], close: number[], period: number = 20, multiplier: number = 2): { upper: number; middle: number; lower: number } => {
  if (high.length < period) return { upper: 0, middle: 0, lower: 0 };
  
  const typicalPrices = high.map((h, i) => (h + low[i] + close[i]) / 3);
  const middle = typicalPrices.slice(-period).reduce((a, b) => a + b, 0) / period;
  
  const atr = calculateATR(high, low, close, period);
  
  return {
    upper: middle + (multiplier * atr),
    middle,
    lower: middle - (multiplier * atr)
  };
};

// Helper function to calculate Chaikin Money Flow (CMF)
const calculateCMF = (high: number[], low: number[], close: number[], volume: number[], period: number = 20): number => {
  if (high.length < period) return 0;
  
  let moneyFlowVolume = 0;
  let totalVolume = 0;
  
  for (let i = high.length - period; i < high.length; i++) {
    const moneyFlowMultiplier = ((close[i] - low[i]) - (high[i] - close[i])) / (high[i] - low[i]);
    moneyFlowVolume += moneyFlowMultiplier * volume[i];
    totalVolume += volume[i];
  }
  
  return moneyFlowVolume / totalVolume;
};

// Helper function to calculate recommendation confidence
const calculateConfidence = (metrics: any, type: 'investment' | 'swing'): number => {
  if (type === 'investment') {
    const peScore = metrics.peRatio ? Math.max(0, 1 - Math.abs(metrics.peRatio - 20) / 40) : 0;
    const dividendScore = metrics.dividendYield ? Math.min(1, metrics.dividendYield / 4) : 0;
    const marketCapScore = metrics.marketCap ? Math.min(1, Math.log10(metrics.marketCap) / 12) : 0;
    const betaScore = metrics.beta ? Math.max(0, 1 - Math.abs(metrics.beta - 1) / 2) : 0;
    const profitMarginScore = metrics.profitMargin ? Math.min(1, metrics.profitMargin / 0.2) : 0;
    const debtToEquityScore = metrics.debtToEquity ? Math.max(0, 1 - metrics.debtToEquity / 2) : 0;
    const currentRatioScore = metrics.currentRatio ? Math.min(1, metrics.currentRatio / 2) : 0;
    const epsScore = metrics.eps ? Math.min(1, metrics.eps / 5) : 0;
    const revenueGrowthScore = metrics.revenueGrowth ? Math.min(1, metrics.revenueGrowth / 0.2) : 0;
    const freeCashFlowScore = metrics.freeCashFlow ? Math.min(1, metrics.freeCashFlow / 1000000000) : 0;
    
    return (
      peScore * 0.15 +
      dividendScore * 0.1 +
      marketCapScore * 0.1 +
      betaScore * 0.05 +
      profitMarginScore * 0.15 +
      debtToEquityScore * 0.05 +
      currentRatioScore * 0.1 +
      epsScore * 0.1 +
      revenueGrowthScore * 0.1 +
      freeCashFlowScore * 0.1
    );
  } else {
    const volatilityScore = metrics.volatility ? Math.max(0, 1 - metrics.volatility) : 0;
    const momentumScore = metrics.momentum ? Math.min(1, (metrics.momentum + 0.2) / 0.4) : 0;
    const rsiScore = metrics.rsi ? Math.max(0, 1 - Math.abs(metrics.rsi - 50) / 50) : 0;
    const macdScore = metrics.macd ? Math.min(1, (metrics.macd + 2) / 4) : 0;
    const volumeScore = metrics.volumeChange ? Math.min(1, (metrics.volumeChange + 0.5) / 1) : 0;
    const bollingerScore = metrics.bollingerUpper && metrics.bollingerLower ? 
      Math.max(0, 1 - Math.abs(metrics.price - (metrics.bollingerUpper + metrics.bollingerLower) / 2) / 
      (metrics.bollingerUpper - metrics.bollingerLower)) : 0;
    const atrScore = metrics.atr ? Math.max(0, 1 - metrics.atr / (metrics.price * 0.1)) : 0;
    const stochScore = metrics.stochK && metrics.stochD ? 
      Math.max(0, 1 - Math.abs(metrics.stochK - 50) / 50) : 0;
    const ichimokuScore = metrics.ichimokuCloud ? 
      (metrics.price > metrics.ichimokuCloud.leadingSpanA && 
       metrics.price > metrics.ichimokuCloud.leadingSpanB ? 1 : 0) : 0;
    const obvScore = metrics.obv ? Math.min(1, Math.abs(metrics.obv) / 1000000) : 0;
    const rocScore = metrics.roc ? Math.min(1, (metrics.roc + 10) / 20) : 0;
    const williamsRScore = metrics.williamsR ? Math.max(0, 1 - Math.abs(metrics.williamsR + 50) / 50) : 0;
    const mfiScore = metrics.mfi ? Math.min(1, (metrics.mfi + 10) / 20) : 0;
    const adxScore = metrics.adx ? Math.min(1, (metrics.adx + 20) / 40) : 0;
    
    return (
      volatilityScore * 0.1 +
      momentumScore * 0.1 +
      rsiScore * 0.1 +
      macdScore * 0.1 +
      volumeScore * 0.05 +
      bollingerScore * 0.1 +
      atrScore * 0.1 +
      stochScore * 0.1 +
      ichimokuScore * 0.1 +
      obvScore * 0.1 +
      rocScore * 0.05 +
      williamsRScore * 0.05 +
      mfiScore * 0.05 +
      adxScore * 0.05
    );
  }
};

// Helper function to calculate Relative Volatility Index (RVI)
const calculateRVI = (prices: number[], period: number = 14): number => {
  if (prices.length < period * 2) return 50;
  
  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const upChanges = changes.map(change => change > 0 ? change : 0);
  const downChanges = changes.map(change => change < 0 ? -change : 0);
  
  const upStdDev = Math.sqrt(upChanges.slice(-period).reduce((sum, val) => sum + val * val, 0) / period);
  const downStdDev = Math.sqrt(downChanges.slice(-period).reduce((sum, val) => sum + val * val, 0) / period);
  
  if (downStdDev === 0) return 100;
  return 100 * (upStdDev / (upStdDev + downStdDev));
};

// Helper function to calculate Force Index
const calculateForceIndex = (close: number[], volume: number[], period: number = 14): number => {
  if (close.length < 2) return 0;
  
  const forceIndexes = close.slice(1).map((price, i) => {
    const priceChange = price - close[i];
    return priceChange * volume[i + 1];
  });
  
  return forceIndexes.slice(-period).reduce((a, b) => a + b, 0) / period;
};

// Helper function to calculate Elder Ray Index
const calculateElderRay = (high: number[], low: number[], close: number[], period: number = 13): { bullPower: number; bearPower: number } => {
  if (high.length < period) return { bullPower: 0, bearPower: 0 };
  
  const ema = calculateEMA(close, period);
  const bullPower = high[high.length - 1] - ema;
  const bearPower = low[low.length - 1] - ema;
  
  return { bullPower, bearPower };
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
      'WMT', 'PG', 'KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'DIS', 'TGT', 'HD',
      // Energy
      'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PXD', 'MPC', 'VLO', 'PSX', 'OXY',
      // Industrial
      'BA', 'CAT', 'GE', 'HON', 'MMM', 'UNP', 'UPS', 'FDX', 'DE', 'LMT',
      // Materials
      'BHP', 'RIO', 'FCX', 'NEM', 'AA', 'NUE', 'ECL', 'ALB', 'LIN', 'DD',
      // Real Estate
      'AMT', 'CCI', 'PLD', 'WELL', 'SPG', 'PSA', 'O', 'DLR', 'AVB', 'EQR',
      // Utilities
      'NEE', 'DUK', 'D', 'SO', 'AEP', 'SRE', 'XEL', 'PCG', 'DTE', 'WEC',
      // Communication Services
      'T', 'VZ', 'TMUS', 'CHTR', 'CMCSA', 'DISH', 'PARA', 'WBD', 'FOX', 'NWSA',
      // Consumer Discretionary
      'AMZN', 'TSLA', 'HD', 'MCD', 'SBUX', 'NKE', 'LOW', 'TJX', 'MAR', 'BKNG',
      // Consumer Staples
      'PG', 'KO', 'PEP', 'WMT', 'COST', 'PM', 'MO', 'EL', 'CL', 'GIS',
      // Technology Hardware
      'AVGO', 'QCOM', 'TXN', 'MU', 'ADI', 'KLAC', 'LRCX', 'AMAT', 'MCHP', 'MRVL',
      // Software
      'ADBE', 'CRM', 'NOW', 'INTU', 'ADP', 'CTSH', 'CDNS', 'SNPS', 'ANSS', 'TEAM',
      // Semiconductors
      'NVDA', 'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN', 'MU', 'ADI', 'KLAC', 'MRVL',
      // Biotechnology
      'GILD', 'REGN', 'VRTX', 'BIIB', 'AMGN', 'CELG', 'ALXN', 'ILMN', 'BMRN', 'SGEN',
      // Healthcare Equipment
      'ISRG', 'ABT', 'MDT', 'BSX', 'EW', 'ZBH', 'BAX', 'HOLX', 'VAR', 'IDXX',
      // Healthcare Services
      'UNH', 'ANTM', 'CI', 'HUM', 'AET', 'DVA', 'CNC', 'MOH', 'UHS', 'THC'
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
            modules: 'summaryDetail,defaultKeyStatistics,financialData,balanceSheetHistory,cashflowStatementHistory',
            formatted: true
          }
        });

        const { summaryDetail, defaultKeyStatistics, financialData, balanceSheetHistory, cashflowStatementHistory } = response.data.quoteSummary.result[0];
        
        const metrics = {
          peRatio: defaultKeyStatistics?.forwardPE?.raw || 0,
          dividendYield: summaryDetail?.dividendYield?.raw || 0,
          marketCap: summaryDetail?.marketCap?.raw || 0,
          beta: defaultKeyStatistics?.beta?.raw || 1,
          profitMargin: financialData?.profitMargins?.raw || 0,
          debtToEquity: defaultKeyStatistics?.debtToEquity?.raw || 0,
          currentRatio: financialData?.currentRatio?.raw || 0,
          eps: defaultKeyStatistics?.trailingEps?.raw || 0,
          revenueGrowth: financialData?.revenueGrowth?.raw || 0,
          freeCashFlow: cashflowStatementHistory?.cashflowStatements[0]?.totalCashFromOperatingActivities?.raw || 0
        };

        const confidence = calculateConfidence(metrics, 'investment');
        
        let recommendation = 'Hold';
        if (confidence > 0.7 && metrics.profitMargin > 0.1 && metrics.revenueGrowth > 0) recommendation = 'Strong Buy';
        else if (confidence > 0.6 && metrics.profitMargin > 0 && metrics.revenueGrowth > -0.1) recommendation = 'Buy';
        else if (confidence < 0.3 || metrics.profitMargin < 0 || metrics.revenueGrowth < -0.2) recommendation = 'Sell';

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
    console.error('Error fetching investment recommendations:', error);
    throw error;
  }
};

export const getSwingTradingRecommendations = async (): Promise<StockRecommendation[]> => {
  try {
    // Use the same expanded stock list as investment recommendations
    const stocks = [
      // Tech
      'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'AMD', 'INTC', 'CRM',
      // Finance
      'JPM', 'BAC', 'V', 'MA', 'AXP', 'GS', 'MS', 'WFC', 'BLK', 'C',
      // Healthcare
      'JNJ', 'PFE', 'MRK', 'ABBV', 'UNH', 'LLY', 'TMO', 'DHR', 'ABT', 'BMY',
      // Consumer
      'WMT', 'PG', 'KO', 'PEP', 'MCD', 'SBUX', 'NKE', 'DIS', 'TGT', 'HD',
      // Energy
      'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'PXD', 'MPC', 'VLO', 'PSX', 'OXY',
      // Industrial
      'BA', 'CAT', 'GE', 'HON', 'MMM', 'UNP', 'UPS', 'FDX', 'DE', 'LMT',
      // Materials
      'BHP', 'RIO', 'FCX', 'NEM', 'AA', 'NUE', 'ECL', 'ALB', 'LIN', 'DD',
      // Real Estate
      'AMT', 'CCI', 'PLD', 'WELL', 'SPG', 'PSA', 'O', 'DLR', 'AVB', 'EQR',
      // Utilities
      'NEE', 'DUK', 'D', 'SO', 'AEP', 'SRE', 'XEL', 'PCG', 'DTE', 'WEC',
      // Communication Services
      'T', 'VZ', 'TMUS', 'CHTR', 'CMCSA', 'DISH', 'PARA', 'WBD', 'FOX', 'NWSA',
      // Consumer Discretionary
      'AMZN', 'TSLA', 'HD', 'MCD', 'SBUX', 'NKE', 'LOW', 'TJX', 'MAR', 'BKNG',
      // Consumer Staples
      'PG', 'KO', 'PEP', 'WMT', 'COST', 'PM', 'MO', 'EL', 'CL', 'GIS',
      // Technology Hardware
      'AVGO', 'QCOM', 'TXN', 'MU', 'ADI', 'KLAC', 'LRCX', 'AMAT', 'MCHP', 'MRVL',
      // Software
      'ADBE', 'CRM', 'NOW', 'INTU', 'ADP', 'CTSH', 'CDNS', 'SNPS', 'ANSS', 'TEAM',
      // Semiconductors
      'NVDA', 'AMD', 'INTC', 'QCOM', 'AVGO', 'TXN', 'MU', 'ADI', 'KLAC', 'MRVL',
      // Biotechnology
      'GILD', 'REGN', 'VRTX', 'BIIB', 'AMGN', 'CELG', 'ALXN', 'ILMN', 'BMRN', 'SGEN',
      // Healthcare Equipment
      'ISRG', 'ABT', 'MDT', 'BSX', 'EW', 'ZBH', 'BAX', 'HOLX', 'VAR', 'IDXX',
      // Healthcare Services
      'UNH', 'ANTM', 'CI', 'HUM', 'AET', 'DVA', 'CNC', 'MOH', 'UHS', 'THC'
    ];
    const recommendations: StockRecommendation[] = [];

    for (const symbol of stocks) {
      try {
        // Get historical data for technical analysis
        const historicalData = await getHistoricalData(symbol, '1d', '1mo');
        if (!historicalData || historicalData.length === 0) continue;

        const prices = historicalData.map(d => d.close);
        const volumes = historicalData.map(d => d.volume);
        const highs = historicalData.map(d => d.high);
        const lows = historicalData.map(d => d.low);
        const currentPrice = prices[prices.length - 1];

        const bollingerBands = calculateBollingerBands(prices);
        const atr = calculateATR(highs, lows, prices);
        const stochastic = calculateStochastic(highs, lows, prices);
        const ichimokuCloud = calculateIchimokuCloud(highs, lows);
        const obv = calculateOBV(prices, volumes);
        const roc = calculateROC(prices);
        const williamsR = calculateWilliamsR(highs, lows, prices);
        const mfi = calculateMFI(highs, lows, prices, volumes);
        const adx = calculateADX(highs, lows, prices);
        const parabolicSAR = calculateParabolicSAR(highs, lows);
        const keltnerChannels = calculateKeltnerChannels(highs, lows, prices);
        const cmf = calculateCMF(highs, lows, prices, volumes);
        const rvi = calculateRVI(prices);
        const forceIndex = calculateForceIndex(prices, volumes);
        const elderRay = calculateElderRay(highs, lows, prices);

        const metrics = {
          volatility: calculateVolatility(prices),
          momentum: calculateMomentum(prices),
          rsi: calculateRSI(prices),
          macd: calculateMACD(prices),
          volumeChange: calculateVolumeChange(volumes),
          bollingerUpper: bollingerBands.upper,
          bollingerLower: bollingerBands.lower,
          atr,
          stochK: stochastic.k,
          stochD: stochastic.d,
          ichimokuCloud,
          obv,
          roc,
          williamsR,
          mfi,
          adx,
          parabolicSAR,
          keltnerUpper: keltnerChannels.upper,
          keltnerMiddle: keltnerChannels.middle,
          keltnerLower: keltnerChannels.lower,
          cmf,
          rvi,
          forceIndex,
          bullPower: elderRay.bullPower,
          bearPower: elderRay.bearPower,
          price: currentPrice,
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
        if (confidence > 0.7 && 
            metrics.momentum > 0 && 
            metrics.rsi > 50 && 
            currentPrice < metrics.bollingerUpper && 
            currentPrice > metrics.bollingerLower &&
            metrics.stochK > 50 &&
            metrics.ichimokuCloud.leadingSpanA > metrics.ichimokuCloud.leadingSpanB &&
            metrics.williamsR > -80 &&
            metrics.mfi > 50 &&
            metrics.adx > 25 &&
            currentPrice > metrics.parabolicSAR &&
            currentPrice < metrics.keltnerUpper &&
            metrics.cmf > 0 &&
            metrics.rvi > 50 &&
            metrics.forceIndex > 0 &&
            metrics.bullPower > 0) {
          recommendation = 'Swing Buy';
        } else if (confidence > 0.7 && 
                   metrics.momentum < 0 && 
                   metrics.rsi < 50 && 
                   currentPrice > metrics.bollingerUpper &&
                   metrics.stochK < 50 &&
                   metrics.ichimokuCloud.leadingSpanA < metrics.ichimokuCloud.leadingSpanB &&
                   metrics.williamsR < -20 &&
                   metrics.mfi < 50 &&
                   metrics.adx > 25 &&
                   currentPrice < metrics.parabolicSAR &&
                   currentPrice > metrics.keltnerLower &&
                   metrics.cmf < 0 &&
                   metrics.rvi < 50 &&
                   metrics.forceIndex < 0 &&
                   metrics.bearPower < 0) {
          recommendation = 'Swing Sell';
        } else if (confidence < 0.3 || metrics.volatility > 0.5) {
          recommendation = 'Avoid';
        }

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