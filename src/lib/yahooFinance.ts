// Using a more reliable CORS proxy
const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/'

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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('Invalid JSON response:', text)
      throw new Error('Invalid response from server')
    }
    
    if (!data.quoteResponse?.result?.[0]) {
      throw new Error('Invalid response format')
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
    throw new Error('Failed to fetch quote data. Please try again later.')
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
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const text = await response.text()
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('Invalid JSON response:', text)
      throw new Error('Invalid response from server')
    }
    
    if (!data.chart?.result?.[0]?.timestamp || !data.chart?.result?.[0]?.indicators?.quote?.[0]) {
      throw new Error('Invalid response format')
    }

    const timestamps = data.chart.result[0].timestamp
    const quotes = data.chart.result[0].indicators.quote[0]

    return timestamps.map((timestamp: number, index: number) => ({
      timestamp,
      open: quotes.open[index] || 0,
      high: quotes.high[index] || 0,
      low: quotes.low[index] || 0,
      close: quotes.close[index] || 0,
      volume: quotes.volume[index] || 0
    }))
  } catch (error) {
    console.error('Error fetching historical data:', error)
    throw new Error('Failed to fetch historical data. Please try again later.')
  }
} 