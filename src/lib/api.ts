import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface StockData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalIndicator {
  name: string
  values: number[]
}

export const fetchStockData = async (
  symbol: string,
  timeframe: string,
  startDate: string,
  endDate: string
): Promise<StockData[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/stock-data`, {
      params: {
        symbol,
        timeframe,
        startDate,
        endDate,
      },
    })
    return response.data
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return []
  }
}

export const calculateTechnicalIndicator = async (
  data: StockData[],
  indicator: string,
  params: Record<string, number>
): Promise<TechnicalIndicator> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/calculate-indicator`, {
      data,
      indicator,
      params,
    })
    return response.data
  } catch (error) {
    console.error('Error calculating technical indicator:', error)
    return { name: indicator, values: [] }
  }
}

export const getSupportResistanceLevels = async (
  data: StockData[]
): Promise<{ support: number[]; resistance: number[] }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/support-resistance`, {
      data,
    })
    return response.data
  } catch (error) {
    console.error('Error calculating support/resistance levels:', error)
    return { support: [], resistance: [] }
  }
}

export const calculateFibonacciLevels = (
  high: number,
  low: number
): number[] => {
  const diff = high - low
  return [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1].map(
    level => low + diff * level
  )
} 