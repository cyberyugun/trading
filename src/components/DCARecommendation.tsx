'use client'

import { useState, useEffect } from 'react'
import { StockData } from '@/lib/api'
import { FiInfo, FiDollarSign, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import { formatIDR } from '@/lib/utils'

interface DCARecommendationProps {
  data: StockData[]
}

interface DCAStrategy {
  level: number
  amount: number
  totalInvestment: number
  averagePrice: number
}

export default function DCARecommendation({ data }: DCARecommendationProps) {
  const [totalInvestment, setTotalInvestment] = useState<number>(1000000) // Default 1M IDR
  const [numberOfLevels, setNumberOfLevels] = useState<number>(3)
  const [dcaStrategy, setDCAStrategy] = useState<DCAStrategy[]>([])
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [atr, setAtr] = useState<number>(0)

  useEffect(() => {
    if (!data || data.length === 0) return

    // Calculate ATR
    const calculateATR = (data: StockData[], period: number = 14) => {
      const trueRanges: number[] = []
      for (let i = 1; i < data.length; i++) {
        const high = data[i].high
        const low = data[i].low
        const prevClose = data[i - 1].close
        const tr = Math.max(
          high - low,
          Math.abs(high - prevClose),
          Math.abs(low - prevClose)
        )
        trueRanges.push(tr)
      }

      let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period
      for (let i = period; i < trueRanges.length; i++) {
        atr = (atr * (period - 1) + trueRanges[i]) / period
      }

      return atr
    }

    const currentATR = calculateATR(data)
    const latestPrice = data[data.length - 1].close
    
    setAtr(currentATR)
    setCurrentPrice(latestPrice)

    // Calculate DCA levels
    const levels: DCAStrategy[] = []
    const baseAmount = totalInvestment / numberOfLevels

    for (let i = 0; i < numberOfLevels; i++) {
      // Calculate price level using ATR with a more conservative approach
      const level = latestPrice - (currentATR * (i + 1) * 0.5) // Use 0.5 multiplier for more conservative levels
      
      // Calculate investment amount with decreasing allocation for lower prices
      const amount = baseAmount * (1 + (i * 0.1)) // More conservative 10% increase per level
      
      // Calculate shares that would be purchased at this level
      const shares = amount / level
      
      // Calculate total investment and average price based on actual shares
      const total = amount
      const avg = level // The entry price at this level

      levels.push({
        level,
        amount,
        totalInvestment: total,
        averagePrice: avg
      })
    }

    setDCAStrategy(levels)
  }, [data, totalInvestment, numberOfLevels])

  return (
    <div className="dca-recommendation space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">DCA Recommendation</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FiInfo className="w-4 h-4" />
          <span>Based on ATR: {formatIDR(atr)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-blue-500">Current Price</h3>
              <span className="text-sm text-blue-500">Latest</span>
            </div>
            <p className="text-2xl font-bold">{formatIDR(currentPrice)}</p>
          </div>

          <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-purple-500">Investment Settings</h3>
              <span className="text-sm text-purple-500">Customize</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Total Investment
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={totalInvestment}
                    onChange={(e) => setTotalInvestment(Number(e.target.value))}
                    className="w-full pl-10 p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Total Investment"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Number of Levels
                </label>
                <select
                  value={numberOfLevels}
                  onChange={(e) => setNumberOfLevels(Number(e.target.value))}
                  className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                >
                  <option value={3}>3 Levels</option>
                  <option value={4}>4 Levels</option>
                  <option value={5}>5 Levels</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-green-500">DCA Strategy</h3>
              <span className="text-sm text-green-500">{numberOfLevels} Levels</span>
            </div>
            <div className="space-y-4">
              {dcaStrategy.map((strategy, index) => (
                <div key={index} className="p-3 bg-background rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FiTrendingDown className="w-4 h-4 text-green-500" />
                      <span className="font-medium">Level {index + 1}</span>
                    </div>
                    <span className="text-sm text-gray-400">
                      {formatIDR(strategy.level)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-400">Amount:</span>
                      <span className="ml-2 font-medium">{formatIDR(strategy.amount)}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Total:</span>
                      <span className="ml-2 font-medium">{formatIDR(strategy.totalInvestment)}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-400">Avg Price:</span>
                      <span className="ml-2 font-medium">{formatIDR(strategy.averagePrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 