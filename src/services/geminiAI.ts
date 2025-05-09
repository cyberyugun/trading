import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'AIzaSyAeo0Z7L1-70TG6LHhZm1JidElvaurflcE');

interface StockAnalysis {
  symbol: string;
  name: string;
  price: number;
  recommendation: string;
  confidence: number;
  analysis: {
    technical: string;
    fundamental: string;
    sentiment: string;
    risk: string;
  };
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

export async function getGeminiRecommendation(
  symbol: string,
  metrics: any,
  type: 'investment' | 'swing'
): Promise<StockAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // Prepare the prompt based on the type of analysis
    const prompt = type === 'investment' 
      ? `Analyze the following stock for long-term investment:
         Symbol: ${symbol}
         Current Price: ${metrics.price}
         P/E Ratio: ${metrics.peRatio}
         Dividend Yield: ${metrics.dividendYield}%
         Market Cap: ${metrics.marketCap}
         Profit Margin: ${metrics.profitMargin}%
         Debt to Equity: ${metrics.debtToEquity}
         Current Ratio: ${metrics.currentRatio}
         Revenue Growth: ${metrics.revenueGrowth}%
         Free Cash Flow: ${metrics.freeCashFlow}
         
         Please provide:
         1. A clear recommendation (Strong Buy, Buy, Hold, Sell, Strong Sell)
         2. Confidence level (0-100)
         3. Technical analysis summary
         4. Fundamental analysis summary
         5. Market sentiment analysis
         6. Risk assessment`
      : `Analyze the following stock for swing trading:
         Symbol: ${symbol}
         Current Price: ${metrics.price}
         RSI: ${metrics.rsi}
         MACD: ${metrics.macd}
         Volume Change: ${metrics.volumeChange}%
         Volatility: ${metrics.volatility}
         Momentum: ${metrics.momentum}
         Bollinger Bands: Upper ${metrics.bollingerUpper}, Lower ${metrics.bollingerLower}
         ATR: ${metrics.atr}
         Stochastic: K ${metrics.stochK}, D ${metrics.stochD}
         Williams %R: ${metrics.williamsR}
         MFI: ${metrics.mfi}
         ADX: ${metrics.adx}
         
         Please provide:
         1. A clear recommendation (Strong Buy, Buy, Hold, Sell, Strong Sell)
         2. Confidence level (0-100)
         3. Technical analysis summary
         4. Short-term trend analysis
         5. Market sentiment analysis
         6. Risk assessment`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response
    const lines = text.split('\n');
    const recommendation = lines.find(line => line.includes('recommendation'))?.split(':')[1]?.trim() || 'Hold';
    const confidence = parseInt(lines.find(line => line.includes('confidence'))?.match(/\d+/)?.[0] || '50');
    
    // Extract analysis sections
    const technical = lines.find(line => line.includes('technical'))?.split(':')[1]?.trim() || '';
    const fundamental = lines.find(line => line.includes('fundamental'))?.split(':')[1]?.trim() || '';
    const sentiment = lines.find(line => line.includes('sentiment'))?.split(':')[1]?.trim() || '';
    const risk = lines.find(line => line.includes('risk'))?.split(':')[1]?.trim() || '';

    return {
      symbol,
      name: symbol, // You might want to fetch the actual company name
      price: metrics.price,
      recommendation,
      confidence,
      analysis: {
        technical,
        fundamental,
        sentiment,
        risk
      },
      metrics
    };
  } catch (error) {
    console.error('Error getting Gemini recommendation:', error);
    throw new Error('Failed to get AI recommendation. Please try again later.');
  }
}

export async function getInvestmentRecommendations(): Promise<StockAnalysis[]> {
  try {
    // Get stock data from your existing service
    const stocks = await getInvestmentRecommendations();
    
    // Get AI recommendations for each stock
    const recommendations = await Promise.all(
      stocks.map(stock => getGeminiRecommendation(stock.symbol, stock.metrics, 'investment'))
    );

    return recommendations;
  } catch (error) {
    console.error('Error getting investment recommendations:', error);
    throw new Error('Failed to get investment recommendations. Please try again later.');
  }
}

export async function getSwingTradingRecommendations(): Promise<StockAnalysis[]> {
  try {
    // Get stock data from your existing service
    const stocks = await getSwingTradingRecommendations();
    
    // Get AI recommendations for each stock
    const recommendations = await Promise.all(
      stocks.map(stock => getGeminiRecommendation(stock.symbol, stock.metrics, 'swing'))
    );

    return recommendations;
  } catch (error) {
    console.error('Error getting swing trading recommendations:', error);
    throw new Error('Failed to get swing trading recommendations. Please try again later.');
  }
} 