'use client'

import { useState, useEffect } from 'react'
import { getHistoricalData } from '@/lib/yahooFinance'
import { TimeInterval, TimeRange } from '@/types/timeframe'
import TimeframeSelector from './TimeframeSelector'
import { formatIDR } from '@/lib/utils'
import { FiInfo, FiRefreshCw } from 'react-icons/fi'

interface SupportResistanceProps {
  symbol: string
}

export default function SupportResistance({ symbol }: SupportResistanceProps) {
  const [interval, setInterval] = useState<TimeInterval>('1d')
  const [range, setRange] = useState<TimeRange>('3mo')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [levels, setLevels] = useState<{ support: number[]; resistance: number[] }>({
    support: [],
    resistance: []
  })
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const historicalData = await getHistoricalData(symbol, interval, range)
      setData(historicalData)
      
      // Set current price
      if (historicalData.length > 0) {
        setCurrentPrice(historicalData[historicalData.length - 1].close)
      }
      
      // Calculate support and resistance levels
      const levels = calculateLevels(historicalData)
      setLevels(levels)
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [symbol, interval, range])

  const calculateLevels = (data: any[]) => {
    const prices = data.map(d => d.close)
    const levels = new Set<number>()
    
    // Find local minima and maxima
    for (let i = 2; i < prices.length - 2; i++) {
      // Check for local minima (support)
      if (prices[i] < prices[i-1] && prices[i] < prices[i-2] &&
          prices[i] < prices[i+1] && prices[i] < prices[i+2]) {
        levels.add(prices[i])
      }
      
      // Check for local maxima (resistance)
      if (prices[i] > prices[i-1] && prices[i] > prices[i-2] &&
          prices[i] > prices[i+1] && prices[i] > prices[i+2]) {
        levels.add(prices[i])
      }
    }
    
    // Convert to arrays and sort
    const sortedLevels = Array.from(levels).sort((a, b) => a - b)
    const currentPrice = prices[prices.length - 1]
    
    // Split into support and resistance
    const support = sortedLevels.filter(level => level < currentPrice)
    const resistance = sortedLevels.filter(level => level > currentPrice)
    
    // Take top 3 levels
    return {
      support: support.slice(-3),
      resistance: resistance.slice(0, 3)
    }
  }

  const refreshData = () => {
    setLoading(true)
    fetchData()
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Support & Resistance</h2>
          <p className="text-sm text-gray-500 mt-1">Key price levels for {symbol}</p>
        </div>
        <button
          onClick={refreshData}
          disabled={loading}
          className="p-2 text-gray-600 hover:text-accent transition-colors"
          title="Refresh data"
        >
          <FiRefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mb-6">
        <TimeframeSelector
          selected={interval}
          range={range}
          onChange={setInterval}
          onRangeChange={setRange}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {currentPrice && (
            <div className="bg-accent/10 p-4 rounded-lg">
              <div className="text-sm text-gray-600">Current Price</div>
              <div className="text-xl font-bold text-accent">{formatIDR(currentPrice)}</div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-green-600">Support Levels</h3>
                <div className="group relative">
                  <FiInfo className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Price levels where buying pressure may increase
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {levels.support.map((level, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100"
                  >
                    <span className="text-sm text-gray-600">S{index + 1}</span>
                    <span className="font-semibold text-green-600">{formatIDR(level)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-red-600">Resistance Levels</h3>
                <div className="group relative">
                  <FiInfo className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Price levels where selling pressure may increase
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {levels.resistance.map((level, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                  >
                    <span className="text-sm text-gray-600">R{index + 1}</span>
                    <span className="font-semibold text-red-600">{formatIDR(level)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 