// Using a more reliable CORS proxy
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const cache: { [key: string]: { data: any; timestamp: number } } = {};

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

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
  interval: string = '1d',
  range: string = '1mo'
): Promise<StockData[]> {
  try {
    const cacheKey = getCacheKey('historical', { symbol, interval, range });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      console.log('Using cached historical data for:', symbol);
      return cachedData;
    }

    console.log('Fetching historical data for symbol:', symbol, 'interval:', interval, 'range:', range);
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
    )}`;

    const data = await retryFetch(async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      return JSON.parse(text);
    });

    if (!data.chart?.result?.[0]?.timestamp || !data.chart?.result?.[0]?.indicators?.quote?.[0]) {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format')
    }

    const timestamps = data.chart.result[0].timestamp
    const quotes = data.chart.result[0].indicators.quote[0]
    console.log('Parsed data points:', timestamps.length)

    const result = timestamps.map((timestamp: number, index: number) => ({
      timestamp,
      open: quotes.open[index] || 0,
      high: quotes.high[index] || 0,
      low: quotes.low[index] || 0,
      close: quotes.close[index] || 0,
      volume: quotes.volume[index] || 0
    }))

    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error fetching historical data:', error);
    throw new Error('Failed to fetch historical data. Please try again later.');
  }
}

export async function convertCurrency(from: string, to: string, amount: number): Promise<number> {
  try {
    const symbol = `${from}${to}=X`
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${symbol}`
    )}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    if (!data.quoteResponse?.result?.[0]) {
      throw new Error('Invalid response format')
    }

    const rate = data.quoteResponse.result[0].regularMarketPrice
    return amount * rate
  } catch (error) {
    console.error('Error converting currency:', error)
    throw new Error('Failed to convert currency')
  }
}

export async function searchStocks(query: string): Promise<SearchResult[]> {
  try {
    console.log('Searching stocks for query:', query)
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v1/finance/search?q=${query}&quotesCount=3&newsCount=0`
    )}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.quotes) {
      return []
    }

    return data.quotes.map((quote: any) => ({
      symbol: quote.symbol,
      name: quote.shortname || quote.longname || quote.symbol,
      exchange: quote.exchange,
      type: quote.quoteType
    }))
  } catch (error) {
    console.error('Error searching stocks:', error)
    throw new Error('Failed to search stocks. Please try again later.')
  }
} 