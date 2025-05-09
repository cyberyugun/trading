'use client'

import { useState, useEffect } from 'react'
import { StockData } from '@/lib/api'
import { FiInfo } from 'react-icons/fi'

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
      <h2 className="text-xl font-semibold">DCA Recommendation</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Current Position</h3>
          <div className="flex gap-4 mt-2">
            <input
              type="number"
              value={currentPosition.price}
              onChange={(e) => setCurrentPosition(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
              className="flex-1 p-2 rounded bg-background border border-border"
              placeholder="Entry Price"
            />
            <input
              type="number"
              value={currentPosition.quantity}
              onChange={(e) => setCurrentPosition(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
              className="flex-1 p-2 rounded bg-background border border-border"
              placeholder="Quantity"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium">Available Funds</h3>
          <input
            type="number"
            value={availableFunds}
            onChange={(e) => setAvailableFunds(parseFloat(e.target.value))}
            className="w-full p-2 rounded bg-background border border-border"
            placeholder="Available Funds"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium">Number of DCA Levels</h3>
          <input
            type="number"
            value={numberOfLevels}
            onChange={(e) => setNumberOfLevels(parseInt(e.target.value))}
            min="1"
            max="5"
            className="w-full p-2 rounded bg-background border border-border"
          />
        </div>

        {dcaLevels.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">DCA Levels</h3>
            <div className="space-y-2">
              {dcaLevels.map((level, index) => (
                <div key={index} className="p-4 bg-blue-500/10 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Level {index + 1}</span>
                    <span className="text-sm text-blue-500">
                      {((level.price - currentPosition.price) / currentPosition.price * 100).toFixed(1)}% from entry
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-sm text-gray-500">Price</p>
                      <p className="font-medium">{level.price.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Quantity</p>
                      <p className="font-medium">{level.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Cost</p>
                      <p className="font-medium">{level.totalCost.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">New Average</p>
                      <p className="font-medium">{level.averagePrice.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-green-500/10 rounded">
              <h3 className="text-lg font-medium text-green-500">Target Average Price</h3>
              <p className="text-2xl font-bold">{targetAveragePrice.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-1">
                {((targetAveragePrice - currentPosition.price) / currentPosition.price * 100).toFixed(1)}% from current average
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 