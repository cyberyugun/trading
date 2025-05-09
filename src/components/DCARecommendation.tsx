'use client'

import { useState, useEffect } from 'react'
import { StockData } from '@/lib/api'
import { FiInfo, FiDollarSign, FiTrendingDown, FiLayers } from 'react-icons/fi'
import { formatIDR } from '@/lib/utils'

interface DCARecommendationProps {
  data: StockData[]
}

interface DCALevel {
  price: number
  quantity: number
  totalCost: number
  averagePrice: number
}

export default function DCARecommendation({ data }: DCARecommendationProps) {
  const [currentPosition, setCurrentPosition] = useState<{ price: number; quantity: number }>({
    price: 0,
    quantity: 0
  })
  const [dcaLevels, setDCALevels] = useState<DCALevel[]>([])
  const [availableFunds, setAvailableFunds] = useState<number>(1000000) // Default 1M IDR
  const [targetAveragePrice, setTargetAveragePrice] = useState<number>(0)
  const [numberOfLevels, setNumberOfLevels] = useState<number>(3)

  useEffect(() => {
    if (!data || data.length === 0) return

    // Calculate support levels for DCA points
    const prices = data.map(d => d.close)
    const windowSize = Math.floor(prices.length * 0.1) // 10% of data points

    const findLocalMinima = (prices: number[], windowSize: number) => {
      const minima: number[] = []
      for (let i = windowSize; i < prices.length - windowSize; i++) {
        const window = prices.slice(i - windowSize, i + windowSize + 1)
        const current = prices[i]
        if (Math.min(...window) === current) {
          minima.push(current)
        }
      }
      return minima
    }

    const supportLevels = findLocalMinima(prices, windowSize)
    const priceRange = Math.max(...prices) - Math.min(...prices)
    const threshold = priceRange * 0.02 // 2% of price range

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

    const groupedLevels = groupLevels(supportLevels, threshold)
    const currentPrice = data[data.length - 1].close

    // Calculate DCA levels
    if (currentPosition.quantity > 0 && currentPosition.price > 0) {
      const levels: DCALevel[] = []
      const totalFunds = availableFunds
      const fundsPerLevel = totalFunds / numberOfLevels

      for (let i = 0; i < numberOfLevels; i++) {
        const price = groupedLevels[i] || currentPrice * (1 - (i + 1) * 0.05) // Fallback to 5% decrements
        const quantity = Math.floor(fundsPerLevel / price)
        const totalCost = quantity * price
        const totalQuantity = currentPosition.quantity + quantity
        const averagePrice = (currentPosition.price * currentPosition.quantity + totalCost) / totalQuantity

        levels.push({
          price,
          quantity,
          totalCost,
          averagePrice
        })
      }

      setDCALevels(levels)
      setTargetAveragePrice(levels[levels.length - 1].averagePrice)
    }
  }, [data, currentPosition, availableFunds, numberOfLevels])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">DCA Recommendation</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FiInfo className="w-4 h-4" />
          <span>Based on support levels</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Current Position</label>
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={currentPosition.price}
                  onChange={(e) => setCurrentPosition(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                  className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Entry Price"
                />
              </div>
              <div className="flex-1">
                <input
                  type="number"
                  value={currentPosition.quantity}
                  onChange={(e) => setCurrentPosition(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                  className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="Quantity"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Available Funds</label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={availableFunds}
                onChange={(e) => setAvailableFunds(parseFloat(e.target.value))}
                className="w-full pl-10 p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Available Funds"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400">Number of DCA Levels</label>
          <div className="relative">
            <FiLayers className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="number"
              value={numberOfLevels}
              onChange={(e) => setNumberOfLevels(parseInt(e.target.value))}
              min="1"
              max="5"
              className="w-full pl-10 p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {dcaLevels.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">DCA Levels</h3>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <FiTrendingDown className="w-4 h-4" />
                <span>Price targets</span>
              </div>
            </div>
            <div className="space-y-3">
              {dcaLevels.map((level, index) => (
                <div key={index} className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Level {index + 1}</span>
                      <span className="px-2 py-1 text-xs bg-blue-500/20 text-blue-500 rounded">
                        {((level.price - currentPosition.price) / currentPosition.price * 100).toFixed(1)}% from entry
                      </span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatIDR(level.price)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-2 bg-background rounded">
                      <p className="text-xs text-gray-400">Quantity</p>
                      <p className="font-medium">{level.quantity.toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <p className="text-xs text-gray-400">Total Cost</p>
                      <p className="font-medium">{formatIDR(level.totalCost)}</p>
                    </div>
                    <div className="p-2 bg-background rounded">
                      <p className="text-xs text-gray-400">New Average</p>
                      <p className="font-medium">{formatIDR(level.averagePrice)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-medium text-green-500">Target Average Price</h3>
                <span className="text-sm text-green-500">
                  {((targetAveragePrice - currentPosition.price) / currentPosition.price * 100).toFixed(1)}% from current
                </span>
              </div>
              <p className="text-2xl font-bold">{formatIDR(targetAveragePrice)}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                <FiInfo className="w-4 h-4" />
                <span>Final average after all DCA levels</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 