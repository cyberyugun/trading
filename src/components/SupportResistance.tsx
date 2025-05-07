'use client'

import { useState, useEffect } from 'react'
import { getHistoricalData } from '@/lib/yahooFinance'

interface SupportResistanceProps {
  symbol: string
}

export default function SupportResistance({ symbol }: SupportResistanceProps) {
  const [supportLevels, setSupportLevels] = useState<number[]>([])
  const [resistanceLevels, setResistanceLevels] = useState<number[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const calculateLevels = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Get historical data
      const data = await getHistoricalData(symbol, '1d', '3mo')
      
      if (!data || data.length === 0) {
        throw new Error('No historical data available')
      }

      // Calculate support and resistance levels
      const { support, resistance } = findSupportResistanceLevels(data)
      setSupportLevels(support)
      setResistanceLevels(resistance)
    } catch (err) {
      console.error('Error calculating support/resistance levels:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate support/resistance levels')
    } finally {
      setIsLoading(false)
    }
  }

  const findSupportResistanceLevels = (data: any[]) => {
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

  useEffect(() => {
    if (symbol) {
      calculateLevels()
    }
  }, [symbol])

  return (
    <div className="bg-primary rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4">Support & Resistance</h2>
      
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-500">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300">Support Levels</label>
          <div className="mt-1 space-y-1">
            {isLoading ? (
              <div className="text-gray-400">Calculating...</div>
            ) : supportLevels.length > 0 ? (
              supportLevels.map((level, index) => (
                <div key={index} className="text-lg font-semibold text-green-500">
                  ${level.toFixed(2)}
                </div>
              ))
            ) : (
              <div className="text-gray-400">No support levels found</div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">Resistance Levels</label>
          <div className="mt-1 space-y-1">
            {isLoading ? (
              <div className="text-gray-400">Calculating...</div>
            ) : resistanceLevels.length > 0 ? (
              resistanceLevels.map((level, index) => (
                <div key={index} className="text-lg font-semibold text-red-500">
                  ${level.toFixed(2)}
                </div>
              ))
            ) : (
              <div className="text-gray-400">No resistance levels found</div>
            )}
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
    </div>
  )
} 