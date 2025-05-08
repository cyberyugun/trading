// Using a more reliable CORS proxy
const CORS_PROXY = 'https://api.allorigins.win/raw?url='

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
    console.log('Fetching quote for symbol:', symbol)
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${symbol}`
    )}`
    console.log('Request URL:', url)

    const response = await fetch(url)
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const text = await response.text()
    console.log('Response text:', text.substring(0, 200) + '...') // Log first 200 chars
    
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('Invalid JSON response:', text)
      throw new Error('Invalid response from server')
    }
    
    if (!data.quoteResponse?.result?.[0]) {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format')
    }

    const quote = data.quoteResponse.result[0]
    console.log('Parsed quote:', quote)
    
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
    console.log('Fetching historical data for symbol:', symbol, 'interval:', interval, 'range:', range)
    const url = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
    )}`
    console.log('Request URL:', url)

    const response = await fetch(url)
    console.log('Response status:', response.status)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const text = await response.text()
    console.log('Response text:', text.substring(0, 200) + '...') // Log first 200 chars
    
    let data
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.error('Invalid JSON response:', text)
      throw new Error('Invalid response from server')
    }
    
    if (!data.chart?.result?.[0]?.timestamp || !data.chart?.result?.[0]?.indicators?.quote?.[0]) {
      console.error('Invalid response format:', data)
      throw new Error('Invalid response format')
    }

    const timestamps = data.chart.result[0].timestamp
    const quotes = data.chart.result[0].indicators.quote[0]
    console.log('Parsed data points:', timestamps.length)

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