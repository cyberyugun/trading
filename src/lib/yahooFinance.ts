// Using a more reliable CORS proxy
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache: { [key: string]: { data: any; timestamp: number } } = {};

// Historical data cache
const historicalDataCache = new Map<string, StockData[]>();

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Using multiple CORS proxies for fallback
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://cors-anywhere.herokuapp.com/'
];

// Type definitions
export type TimeInterval = '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo';
export type TimeRange = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max';

// Helper function for retrying API calls
async function retryFetch<T>(
  fetchFn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delay: number = RETRY_DELAY
): Promise<T> {
  try {
    return await fetchFn();
  } catch (error) {
    if (retries === 0) {
      throw error;
    }
    console.log(`Retrying... ${retries} attempts remaining`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryFetch(fetchFn, retries - 1, delay * 2); // Exponential backoff
  }
}

// Cache helper functions
const getCacheKey = (endpoint: string, params: any) => {
  return `${endpoint}-${JSON.stringify(params)}`;
};

const getFromCache = (key: string) => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCache = (key: string, data: any) => {
  cache[key] = {
    data,
    timestamp: Date.now()
  };
};

export interface StockData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface StockQuote {
  symbol: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  regularMarketVolume: number
  regularMarketTime: number
}

export interface SearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
}

export async function getQuote(symbol: string): Promise<StockQuote> {
  try {
    const cacheKey = getCacheKey('quote', { symbol });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('Using cached quote data for:', symbol);
      return cachedData;
    }

    console.log('Fetching quote for symbol:', symbol);
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    )}`;

    const data = await retryFetch(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return JSON.parse(text);
    });

    if (!data.chart?.result?.[0]?.indicators?.quote?.[0]) {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format')
    }

    const quote = data.chart.result[0].indicators.quote[0]
    const meta = data.chart.result[0].meta
    const lastIndex = quote.close.length - 1

    console.log('Parsed quote:', quote)
    
    const result = {
      symbol: meta.symbol,
      regularMarketPrice: quote.close[lastIndex],
      regularMarketChange: quote.close[lastIndex] - quote.open[lastIndex],
      regularMarketChangePercent: ((quote.close[lastIndex] - quote.open[lastIndex]) / quote.open[lastIndex]) * 100,
      regularMarketVolume: quote.volume[lastIndex],
      regularMarketTime: meta.regularMarketTime
    }

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching quote:', error);
    throw new Error('Failed to fetch quote data. Please try again later.');
  }
}

export async function getHistoricalData(
  symbol: string,
  interval: TimeInterval,
  range: TimeRange,
  forceRefresh: boolean = false
): Promise<StockData[]> {
  const cacheKey = `${symbol}-${interval}-${range}`;
  
  // If not forcing refresh and we have cached data, return it
  if (!forceRefresh && historicalDataCache.has(cacheKey)) {
    console.log('Using cached historical data for:', symbol);
    return historicalDataCache.get(cacheKey)!;
  }

  try {
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
    )}`;

    const response = await retryFetch(async () => {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return res;
    });

    const data = await response.json();
    
    if (!data.chart?.result?.[0]?.indicators?.quote?.[0]) {
      throw new Error('Invalid response format');
    }

    const quote = data.chart.result[0].indicators.quote[0];
    const timestamps = data.chart.result[0].timestamp;
    
    const historicalData = timestamps.map((timestamp: number, index: number) => ({
      timestamp,
      open: quote.open[index],
      high: quote.high[index],
      low: quote.low[index],
      close: quote.close[index],
      volume: quote.volume[index]
    }));

    // Cache the data
    historicalDataCache.set(cacheKey, historicalData);
    return historicalData;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw error;
  }
}

export async function convertCurrency(from: string, to: string, amount: number): Promise<number> {
  try {
    // For IDR to USD conversion, use a direct rate since Yahoo Finance might not support IDR
    if (from === 'IDR' && to === 'USD') {
      const rate = 0.000064; // Approximate IDR to USD rate
      return amount * rate;
    }

    const symbol = `${from}${to}=X`;
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`
    )}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.chart?.result?.[0]?.indicators?.quote?.[0]) {
      throw new Error('Invalid response format');
    }

    const quote = data.chart.result[0].indicators.quote[0];
    const lastIndex = quote.close.length - 1;
    const rate = quote.close[lastIndex];

    if (!rate) {
      throw new Error('No exchange rate available');
    }

    return amount * rate;
  } catch (error) {
    console.error('Error converting currency:', error);
    // Return a fallback rate for IDR to USD if the API call fails
    if (from === 'IDR' && to === 'USD') {
      const fallbackRate = 0.000064;
      return amount * fallbackRate;
    }
    throw new Error('Failed to convert currency');
  }
}

// Helper function to try multiple CORS proxies
async function tryWithProxies(url: string, retries: number = 3): Promise<Response> {
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    try {
      const proxyUrl = `${CORS_PROXIES[i]}${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl, {
        headers: {
          'Origin': window.location.origin
        }
      });
      
      if (response.ok) {
        return response;
      }
    } catch (error) {
      console.log(`Proxy ${i + 1} failed, trying next...`);
    }
  }
  throw new Error('All proxies failed');
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  try {
    console.log('Searching stocks for query:', query);
    const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=3&newsCount=0`;

    const response = await retryFetch(async () => {
      return await tryWithProxies(url);
    });

    const data = await response.json();
    
    if (!data.quotes) {
      return [];
    }

    return data.quotes.map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: quote.exchange,
      type: quote.quoteType
    }));
  } catch (error) {
    console.error('Error searching stocks:', error);
    // Return empty array instead of throwing error to prevent UI from breaking
    return [];
  }
} 