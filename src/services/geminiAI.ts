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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Based on your knowledge of the current market conditions and company fundamentals, provide recommendations for the top 10 Indonesian stocks (IDX - Indonesia Stock Exchange) that are good for long-term investment. For each stock, provide the information in this exact format:

STOCK 1:
SYMBOL: [Stock Symbol with .JK suffix]
NAME: [Company Name]
PRICE: [Current Price in IDR without currency symbol, e.g., 15000]
RECOMMENDATION: [Strong Buy/Buy/Hold/Sell/Strong Sell]
CONFIDENCE: [0-100]%

FUNDAMENTAL METRICS:
1. P/E Ratio: [value]
2. Dividend Yield: [percentage]%
3. Market Cap: [value in IDR]
4. Profit Margin: [percentage]%
5. Debt to Equity: [value]
6. Current Ratio: [value]

TECHNICAL INDICATORS:
1. RSI: [value between 0-100]
2. MACD: [value]
3. Volume Change: [percentage]%
4. Volatility: [value]
5. Momentum: [value]
6. ATR: [value]

ANALYSIS:
1. Technical: [Technical analysis summary]
2. Fundamental: [Fundamental analysis summary]
3. Sentiment: [Market sentiment analysis]
4. Risk: [Risk assessment]

STOCK 2:
[Same format as above]

[Continue for all 10 stocks]

Please ensure:
1. All stocks are from the Indonesia Stock Exchange (IDX)
2. Include the .JK suffix in the stock symbols
3. Prices should be provided as numbers without currency symbol (e.g., 15000 for Rp15.000)
4. Each stock follows this exact format with the labels as shown
5. Focus on major Indonesian companies with good fundamentals
6. Include all fundamental and technical indicators with their current values
7. Use numbered points for all metrics and analysis sections`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response to extract recommendations
    const recommendations: StockAnalysis[] = [];
    const stockSections = text.split(/STOCK \d+:/); // Split by stock sections

    for (const section of stockSections) {
      if (section.trim()) {
        const symbol = section.match(/SYMBOL:\s*([A-Z]+\.JK)/)?.[1] || '';
        const name = section.match(/NAME:\s*([^\n]+)/)?.[1] || symbol;
        const price = parseFloat(section.match(/PRICE:\s*(\d+)/)?.[1] || '0');
        const recommendation = section.match(/RECOMMENDATION:\s*([^\n]+)/)?.[1]?.trim() || 'Hold';
        const confidence = parseInt(section.match(/CONFIDENCE:\s*(\d+)/)?.[1] || '50');
        
        // Extract fundamental metrics
        const peRatio = parseFloat(section.match(/1\.\s*P\/E Ratio:\s*(\d+\.?\d*)/)?.[1] || '0');
        const dividendYield = parseFloat(section.match(/2\.\s*Dividend Yield:\s*(\d+\.?\d*)/)?.[1] || '0');
        const marketCap = parseFloat(section.match(/3\.\s*Market Cap:\s*(\d+)/)?.[1] || '0');
        const profitMargin = parseFloat(section.match(/4\.\s*Profit Margin:\s*(\d+\.?\d*)/)?.[1] || '0');
        const debtToEquity = parseFloat(section.match(/5\.\s*Debt to Equity:\s*(\d+\.?\d*)/)?.[1] || '0');
        const currentRatio = parseFloat(section.match(/6\.\s*Current Ratio:\s*(\d+\.?\d*)/)?.[1] || '0');
        
        // Extract technical indicators
        const rsi = parseFloat(section.match(/1\.\s*RSI:\s*(\d+)/)?.[1] || '0');
        const macd = parseFloat(section.match(/2\.\s*MACD:\s*([-]?\d+\.?\d*)/)?.[1] || '0');
        const volumeChange = parseFloat(section.match(/3\.\s*Volume Change:\s*([-]?\d+\.?\d*)/)?.[1] || '0');
        const volatility = parseFloat(section.match(/4\.\s*Volatility:\s*(\d+\.?\d*)/)?.[1] || '0');
        const momentum = parseFloat(section.match(/5\.\s*Momentum:\s*([-]?\d+\.?\d*)/)?.[1] || '0');
        const atr = parseFloat(section.match(/6\.\s*ATR:\s*(\d+\.?\d*)/)?.[1] || '0');
        
        // Extract analysis sections
        const technical = section.match(/1\.\s*Technical:\s*([^\n]+)/)?.[1]?.trim() || '';
        const fundamental = section.match(/2\.\s*Fundamental:\s*([^\n]+)/)?.[1]?.trim() || '';
        const sentiment = section.match(/3\.\s*Sentiment:\s*([^\n]+)/)?.[1]?.trim() || '';
        const risk = section.match(/4\.\s*Risk:\s*([^\n]+)/)?.[1]?.trim() || '';
        
        recommendations.push({
          symbol,
          name,
          price,
          recommendation,
          confidence,
          analysis: {
            technical,
            fundamental,
            sentiment,
            risk
          },
          metrics: {
            peRatio,
            dividendYield,
            marketCap,
            profitMargin,
            debtToEquity,
            currentRatio,
            rsi,
            macd,
            volumeChange,
            volatility,
            momentum,
            atr
          }
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting investment recommendations:', error);
    throw new Error('Failed to get investment recommendations. Please try again later.');
  }
}

export async function getSwingTradingRecommendations(): Promise<StockAnalysis[]> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Based on your knowledge of current market conditions and technical analysis, provide recommendations for the top 10 Indonesian stocks (IDX - Indonesia Stock Exchange) that are good for swing trading (short-term trading). For each stock, provide the information in this exact format:

STOCK 1:
SYMBOL: [Stock Symbol with .JK suffix]
NAME: [Company Name]
PRICE: [Current Price in IDR without currency symbol, e.g., 15000]
RECOMMENDATION: [Strong Buy/Buy/Hold/Sell/Strong Sell]
CONFIDENCE: [0-100]%

TECHNICAL INDICATORS:
1. RSI: [value between 0-100]
2. MACD: [value]
3. Volume Change: [percentage]%
4. Volatility: [value]
5. Momentum: [value]
6. ATR: [value]

ANALYSIS:
1. Technical: [Technical analysis summary]
2. Trend: [Short-term trend analysis]
3. Sentiment: [Market sentiment analysis]
4. Risk: [Risk assessment]

STOCK 2:
[Same format as above]

[Continue for all 10 stocks]

Please ensure:
1. All stocks are from the Indonesia Stock Exchange (IDX)
2. Include the .JK suffix in the stock symbols
3. Prices should be provided as numbers without currency symbol (e.g., 15000 for Rp15.000)
4. Each stock follows this exact format with the labels as shown
5. Focus on liquid stocks with good trading volume
6. Include all technical indicators with their current values
7. Use numbered points for technical indicators and analysis sections`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the AI response to extract recommendations
    const recommendations: StockAnalysis[] = [];
    const stockSections = text.split(/STOCK \d+:/); // Split by stock sections

    for (const section of stockSections) {
      if (section.trim()) {
        const symbol = section.match(/SYMBOL:\s*([A-Z]+\.JK)/)?.[1] || '';
        const name = section.match(/NAME:\s*([^\n]+)/)?.[1] || symbol;
        const price = parseFloat(section.match(/PRICE:\s*(\d+)/)?.[1] || '0');
        const recommendation = section.match(/RECOMMENDATION:\s*([^\n]+)/)?.[1]?.trim() || 'Hold';
        const confidence = parseInt(section.match(/CONFIDENCE:\s*(\d+)/)?.[1] || '50');
        
        // Extract technical indicators
        const rsi = parseFloat(section.match(/1\.\s*RSI:\s*(\d+)/)?.[1] || '0');
        const macd = parseFloat(section.match(/2\.\s*MACD:\s*([-]?\d+\.?\d*)/)?.[1] || '0');
        const volumeChange = parseFloat(section.match(/3\.\s*Volume Change:\s*([-]?\d+\.?\d*)/)?.[1] || '0');
        const volatility = parseFloat(section.match(/4\.\s*Volatility:\s*(\d+\.?\d*)/)?.[1] || '0');
        const momentum = parseFloat(section.match(/5\.\s*Momentum:\s*([-]?\d+\.?\d*)/)?.[1] || '0');
        const atr = parseFloat(section.match(/6\.\s*ATR:\s*(\d+\.?\d*)/)?.[1] || '0');
        
        // Extract analysis sections
        const technical = section.match(/1\.\s*Technical:\s*([^\n]+)/)?.[1]?.trim() || '';
        const fundamental = section.match(/2\.\s*Trend:\s*([^\n]+)/)?.[1]?.trim() || ''; // Using trend instead of fundamental for swing trading
        const sentiment = section.match(/3\.\s*Sentiment:\s*([^\n]+)/)?.[1]?.trim() || '';
        const risk = section.match(/4\.\s*Risk:\s*([^\n]+)/)?.[1]?.trim() || '';
        
        recommendations.push({
          symbol,
          name,
          price,
          recommendation,
          confidence,
          analysis: {
            technical,
            fundamental,
            sentiment,
            risk
          },
          metrics: {
            rsi,
            macd,
            volumeChange,
            volatility,
            momentum,
            atr
          }
        });
      }
    }

    return recommendations;
  } catch (error) {
    console.error('Error getting swing trading recommendations:', error);
    throw new Error('Failed to get swing trading recommendations. Please try again later.');
  }
} 