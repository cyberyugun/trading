'use client'

import { useState, useEffect } from 'react'
import { getQuote, getHistoricalData } from '@/lib/yahooFinance'
import { formatIDR } from '@/lib/utils'
import { TimeInterval, TimeRange } from '@/types/timeframe'
import TimeframeSelector from './TimeframeSelector'

interface RiskManagementProps {
  symbol: string
}

export default function RiskManagement({ symbol }: RiskManagementProps) {
  const [entry, setEntry] = useState<number | null>(null)
  const [takeProfit, setTakeProfit] = useState<number | null>(null)
  const [stopLoss, setStopLoss] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [interval, setInterval] = useState<TimeInterval>('1d')
  const [range, setRange] = useState<TimeRange>('1mo')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])

  const calculateLevels = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Get current price
      const quote = await getQuote(symbol)
      const currentPrice = quote.regularMarketPrice

      // Get historical data for volatility calculation
      const historicalData = await getHistoricalData(symbol, interval, range)
      
      if (!historicalData || historicalData.length === 0) {
        throw new Error('No historical data available')
      }

      // Calculate average true range (ATR) for volatility
      const atr = calculateATR(historicalData)
      
      // Set entry price as current price
      setEntry(currentPrice)
      
      // Set take profit at 2x ATR above entry
      setTakeProfit(currentPrice + (2 * atr))
      
      // Set stop loss at 1x ATR below entry
      setStopLoss(currentPrice - atr)
    } catch (err) {
      console.error('Error calculating risk levels:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate risk levels')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateATR = (data: any[]) => {
    const trueRanges = data.slice(1).map((d, i) => {
      const high = d.high
      const low = d.low
      const prevClose = data[i].close
      return Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )
    })
    
    // Calculate 14-period ATR
    const period = 14
    const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period
    return atr
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const historicalData = await getHistoricalData(symbol, interval, range)
        setData(historicalData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [symbol, interval, range])

  useEffect(() => {
    if (symbol) {
      calculateLevels()
    }
  }, [symbol])

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Risk Management Analysis</h2>
        <TimeframeSelector
          interval={interval}
          range={range}
          onIntervalChange={setInterval}
          onRangeChange={setRange}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-500">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300">Entry Price</label>
            <div className="mt-1 text-lg font-semibold">
              {isLoading ? 'Calculating...' : entry ? formatIDR(entry) : '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Take Profit</label>
            <div className="mt-1 text-lg font-semibold text-green-500">
              {isLoading ? 'Calculating...' : takeProfit ? formatIDR(takeProfit) : '-'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">Stop Loss</label>
            <div className="mt-1 text-lg font-semibold text-red-500">
              {isLoading ? 'Calculating...' : stopLoss ? formatIDR(stopLoss) : '-'}
            </div>
          </div>

          <button
            onClick={calculateLevels}
            disabled={isLoading}
            className="w-full px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
          >
            {isLoading ? 'Calculating...' : 'Recalculate'}
          </button>
        </div>
      )}
    </div>
  )
} 