'use client'

import { useState, useEffect } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { getHistoricalData, StockData } from '@/lib/yahooFinance'

interface Level {
  price: number
  strength: number
  type: 'support' | 'resistance'
}

interface SupportResistanceProps {
  symbol: string
}

const SupportResistance: React.FC<SupportResistanceProps> = ({ symbol }) => {
  const [levels, setLevels] = useState<Level[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateLevels = (stockData: StockData[]) => {
    const levels: Level[] = []
    const windowSize = 20 // Lookback period for finding levels
    const prices = stockData.map(d => d.close)
    const volumes = stockData.map(d => d.volume)

    // Find potential support and resistance levels
    for (let i = windowSize; i < prices.length - windowSize; i++) {
      const currentPrice = prices[i]
      const leftPrices = prices.slice(i - windowSize, i)
      const rightPrices = prices.slice(i + 1, i + windowSize + 1)
      
      // Check if price is a local minimum (support)
      if (currentPrice === Math.min(...leftPrices, ...rightPrices)) {
        const strength = calculateStrength(prices, volumes, i, 'support')
        levels.push({
          price: currentPrice,
          strength,
          type: 'support'
        })
      }
      
      // Check if price is a local maximum (resistance)
      if (currentPrice === Math.max(...leftPrices, ...rightPrices)) {
        const strength = calculateStrength(prices, volumes, i, 'resistance')
        levels.push({
          price: currentPrice,
          strength,
          type: 'resistance'
        })
      }
    }

    // Sort levels by strength and remove duplicates
    return levels
      .sort((a, b) => b.strength - a.strength)
      .filter((level, index, self) =>
        index === self.findIndex(l => 
          Math.abs(l.price - level.price) < 0.01
        )
      )
  }

  const calculateStrength = (
    prices: number[],
    volumes: number[],
    index: number,
    type: 'support' | 'resistance'
  ): number => {
    const price = prices[index]
    const volume = volumes[index]
    const priceRange = Math.max(...prices) - Math.min(...prices)
    const volumeRange = Math.max(...volumes) - Math.min(...volumes)
    
    // Calculate strength based on price and volume
    const priceStrength = 1 - (Math.abs(price - prices[index - 1]) / priceRange)
    const volumeStrength = volume / volumeRange
    
    return (priceStrength + volumeStrength) / 2
  }

  const fetchLevels = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const stockData = await getHistoricalData(symbol, '1d', '3mo')
      const calculatedLevels = calculateLevels(stockData)
      setLevels(calculatedLevels)
    } catch (error) {
      console.error('Error calculating support/resistance levels:', error)
      setError('Failed to fetch stock data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (symbol) {
      fetchLevels()
    }
  }, [symbol])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Support & Resistance</h2>
        <button
          onClick={fetchLevels}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-green-400">Support Levels</h3>
          {levels
            .filter(level => level.type === 'support')
            .map((level, index) => (
              <div
                key={`support-${index}`}
                className="bg-secondary rounded p-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white">${level.price.toFixed(2)}</span>
                  <span className="text-gray-400">
                    Strength: {(level.strength * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium text-red-400">Resistance Levels</h3>
          {levels
            .filter(level => level.type === 'resistance')
            .map((level, index) => (
              <div
                key={`resistance-${index}`}
                className="bg-secondary rounded p-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-white">${level.price.toFixed(2)}</span>
                  <span className="text-gray-400">
                    Strength: {(level.strength * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}

export default SupportResistance 