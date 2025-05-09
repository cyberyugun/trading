'use client'

import { useState, useEffect } from 'react'
import { StockData } from '@/lib/api'
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import { formatIDR } from '@/lib/utils'

interface SupportResistanceProps {
  data: StockData[]
}

interface PriceLevel {
  price: number
  strength: number
  type: 'support' | 'resistance'
}

export default function SupportResistance({ data }: SupportResistanceProps) {
  const [supportLevels, setSupportLevels] = useState<PriceLevel[]>([])
  const [resistanceLevels, setResistanceLevels] = useState<PriceLevel[]>([])

  useEffect(() => {
    if (!data || data.length === 0) return

    // Find local minima and maxima
    const findLocalExtrema = (data: StockData[]) => {
      const minima: number[] = []
      const maxima: number[] = []
      const windowSize = 5 // Look at 5 candles before and after

      for (let i = windowSize; i < data.length - windowSize; i++) {
        const current = data[i]
        const before = data.slice(i - windowSize, i)
        const after = data.slice(i + 1, i + windowSize + 1)

        // Check for local minimum
        const isMin = before.every(candle => candle.low >= current.low) &&
                     after.every(candle => candle.low >= current.low)
        if (isMin) {
          minima.push(current.low)
        }

        // Check for local maximum
        const isMax = before.every(candle => candle.high <= current.high) &&
                     after.every(candle => candle.high <= current.high)
        if (isMax) {
          maxima.push(current.high)
        }
      }

      return { minima, maxima }
    }

    // Group nearby levels
    const groupLevels = (levels: number[], threshold: number) => {
      const groups: number[][] = []
      let currentGroup: number[] = []

      levels.sort((a, b) => a - b)

      for (const level of levels) {
        if (currentGroup.length === 0) {
          currentGroup.push(level)
        } else {
          const avg = currentGroup.reduce((a, b) => a + b, 0) / currentGroup.length
          if (Math.abs(level - avg) <= threshold) {
            currentGroup.push(level)
          } else {
            groups.push(currentGroup)
            currentGroup = [level]
          }
        }
      }

      if (currentGroup.length > 0) {
        groups.push(currentGroup)
      }

      return groups.map(group => ({
        price: group.reduce((a, b) => a + b, 0) / group.length,
        strength: group.length
      }))
    }

    const { minima, maxima } = findLocalExtrema(data)
    const priceRange = Math.max(...data.map(d => d.high)) - Math.min(...data.map(d => d.low))
    const threshold = priceRange * 0.02 // 2% of price range

    const supportGroups = groupLevels(minima, threshold)
    const resistanceGroups = groupLevels(maxima, threshold)

    // Sort by strength and take top 3
    const sortedSupport = supportGroups
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .map(level => ({ ...level, type: 'support' as const }))

    const sortedResistance = resistanceGroups
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 3)
      .map(level => ({ ...level, type: 'resistance' as const }))

    setSupportLevels(sortedSupport)
    setResistanceLevels(sortedResistance)
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Support & Resistance</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Top 3 levels</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-green-500">Support Levels</h3>
              <FiTrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="space-y-4">
              {supportLevels.map((level, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400">S{index + 1}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(level.strength)].map((_, i) => (
                        <div key={i} className="w-1 h-4 bg-green-500/50 rounded-full" />
                      ))}
                    </div>
                  </div>
                  <span className="font-medium">{formatIDR(level.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-red-500">Resistance Levels</h3>
              <FiTrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div className="space-y-4">
              {resistanceLevels.map((level, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-400">R{index + 1}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(level.strength)].map((_, i) => (
                        <div key={i} className="w-1 h-4 bg-red-500/50 rounded-full" />
                      ))}
                    </div>
                  </div>
                  <span className="font-medium">{formatIDR(level.price)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 