'use client'

import { useState, useEffect } from 'react'
import { StockData } from '@/lib/api'
import { FiInfo, FiRefreshCw } from 'react-icons/fi'

interface SupportResistanceProps {
  data: StockData[]
}

export default function SupportResistance({ data }: SupportResistanceProps) {
  const [supportLevels, setSupportLevels] = useState<number[]>([])
  const [resistanceLevels, setResistanceLevels] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!data || data.length === 0) return

    // Simple support and resistance calculation based on local minima and maxima
    const prices = data.map(d => d.close)
    const windowSize = Math.floor(prices.length * 0.1) // 10% of data points

    const findLocalExtrema = (prices: number[], windowSize: number, isMin: boolean) => {
      const extrema: number[] = []
      for (let i = windowSize; i < prices.length - windowSize; i++) {
        const window = prices.slice(i - windowSize, i + windowSize + 1)
        const current = prices[i]
        if (isMin ? Math.min(...window) === current : Math.max(...window) === current) {
          extrema.push(current)
        }
      }
      return extrema
    }

    const supports = findLocalExtrema(prices, windowSize, true)
    const resistances = findLocalExtrema(prices, windowSize, false)

    // Group nearby levels
    const groupLevels = (levels: number[], threshold: number) => {
      const groups: number[][] = []
      levels.sort((a, b) => a - b)

      let currentGroup: number[] = []
      for (const level of levels) {
        if (currentGroup.length === 0 || Math.abs(level - currentGroup[0]) <= threshold) {
          currentGroup.push(level)
        } else {
          groups.push(currentGroup)
          currentGroup = [level]
        }
      }
      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }

      return groups.map(group => group.reduce((a, b) => a + b, 0) / group.length)
    }

    const priceRange = Math.max(...prices) - Math.min(...prices)
    const threshold = priceRange * 0.02 // 2% of price range

    setSupportLevels(groupLevels(supports, threshold))
    setResistanceLevels(groupLevels(resistances, threshold))
  }, [data])

  const refreshData = () => {
    setLoading(true)
    // Implementation of refreshData function
    setLoading(false)
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Support & Resistance</h2>
          <p className="text-sm text-gray-500 mt-1">Key price levels for the stock</p>
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

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Support & Resistance Levels</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-green-500">Support Levels</h3>
                <div className="mt-2 space-y-2">
                  {supportLevels.map((level, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-500/10 rounded">
                      <span>Level {index + 1}</span>
                      <span className="font-medium">{level.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-red-500">Resistance Levels</h3>
                <div className="mt-2 space-y-2">
                  {resistanceLevels.map((level, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-red-500/10 rounded">
                      <span>Level {index + 1}</span>
                      <span className="font-medium">{level.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 