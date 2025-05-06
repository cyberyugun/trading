import axios from 'axios'

const CORS_PROXY = 'https://corsproxy.io/?'

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

export async function getQuote(symbol: string): Promise<StockQuote> {
  try {
    const response = await fetch(
      `${CORS_PROXY}${encodeURIComponent(
        `https://query1.finance.yahoo.com/v8/finance/quote?symbols=${symbol}`
      )}`
    )
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch quote')
    }

    const quote = data.quoteResponse.result[0]
    return {
      symbol: quote.symbol,
      regularMarketPrice: quote.regularMarketPrice,
      regularMarketChange: quote.regularMarketChange,
      regularMarketChangePercent: quote.regularMarketChangePercent,
      regularMarketVolume: quote.regularMarketVolume,
      regularMarketTime: quote.regularMarketTime
    }
  } catch (error) {
    console.error('Error fetching quote:', error)
    throw error
  }
}

export async function getHistoricalData(
  symbol: string,
  interval: string = '1d',
  range: string = '1mo'
): Promise<StockData[]> {
  try {
    const response = await fetch(
      `${CORS_PROXY}${encodeURIComponent(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
      )}`
    )
    const data = await response.json()
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch historical data')
    }

    const timestamps = data.chart.result[0].timestamp
    const quotes = data.chart.result[0].indicators.quote[0]

    return timestamps.map((timestamp: number, index: number) => ({
      timestamp,
      open: quotes.open[index],
      high: quotes.high[index],
      low: quotes.low[index],
      close: quotes.close[index],
      volume: quotes.volume[index]
    }))
  } catch (error) {
    console.error('Error fetching historical data:', error)
    throw error
  }
} 