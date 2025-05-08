'use client'

import { useState, useEffect } from 'react'
import { getHistoricalData } from '@/lib/yahooFinance'
import { TimeInterval, TimeRange } from '@/types/timeframe'
import TimeframeSelector from './TimeframeSelector'
import { formatIDR } from '@/lib/utils'

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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const historicalData = await getHistoricalData(symbol, interval, range)
        setData(historicalData)
        
        // Calculate support and resistance levels
        const levels = calculateLevels(historicalData)
        setLevels(levels)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }

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

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Support & Resistance Levels</h2>
        <TimeframeSelector
          selected={interval}
          range={range}
          onChange={setInterval}
          onRangeChange={setRange}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Support Levels</h3>
            <div className="space-y-1">
              {levels.support.map((level, index) => (
                <div key={index} className="text-green-600">
                  {formatIDR(level)}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Resistance Levels</h3>
            <div className="space-y-1">
              {levels.resistance.map((level, index) => (
                <div key={index} className="text-red-600">
                  {formatIDR(level)}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 