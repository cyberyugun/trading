'use client'

import { useState, useEffect } from 'react'
import { StockData } from '@/lib/api'
import { FiInfo, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import { formatIDR } from '@/lib/utils'

interface RiskManagementProps {
  data: StockData[]
}

export default function RiskManagement({ data }: RiskManagementProps) {
  const [atr, setAtr] = useState<number>(0)
  const [currentPrice, setCurrentPrice] = useState<number>(0)
  const [stopLoss, setStopLoss] = useState<number>(0)
  const [takeProfit1, setTakeProfit1] = useState<number>(0)
  const [takeProfit2, setTakeProfit2] = useState<number>(0)
  const [takeProfit3, setTakeProfit3] = useState<number>(0)
  const [positionSize, setPositionSize] = useState<number>(0)
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(0)

  useEffect(() => {
    if (!data || data.length === 0) return

    // Calculate average true range (ATR)
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
    setStopLoss(latestPrice - currentATR * 2) // 2 ATR below current price
    setTakeProfit1(latestPrice + currentATR * 2) // 2 ATR above current price
    setTakeProfit2(latestPrice + currentATR * 3) // 3 ATR above current price
    setTakeProfit3(latestPrice + currentATR * 4) // 4 ATR above current price

    // Calculate position size based on 2% risk
    const accountSize = 1000000 // Default 1M IDR
    const riskAmount = accountSize * 0.02 // 2% risk
    const riskPerShare = currentATR * 2 // 2 ATR risk
    const calculatedSize = riskAmount / riskPerShare
    setPositionSize(calculatedSize)

    // Calculate risk/reward ratio
    const avgTakeProfit = (takeProfit1 + takeProfit2 + takeProfit3) / 3
    const reward = avgTakeProfit - latestPrice
    const risk = latestPrice - stopLoss
    setRiskRewardRatio(reward / risk)
  }, [data])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Risk Management</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FiInfo className="w-4 h-4" />
          <span>Automated risk calculations</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-blue-500">Current Price</h3>
              <span className="text-sm text-blue-500">Latest</span>
            </div>
            <p className="text-2xl font-bold">{formatIDR(currentPrice)}</p>
          </div>

          <div className="p-4 bg-red-500/10 rounded-lg border border-red-500/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-red-500">Stop Loss</h3>
              <span className="text-sm text-red-500">2 ATR below</span>
            </div>
            <p className="text-2xl font-bold">{formatIDR(stopLoss)}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
              <FiInfo className="w-4 h-4" />
              <span>Based on ATR: {formatIDR(atr)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-green-500">Take Profit Levels</h3>
              <span className="text-sm text-green-500">Multiple targets</span>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">TP1 (2 ATR)</span>
                <span className="font-medium">{formatIDR(takeProfit1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">TP2 (3 ATR)</span>
                <span className="font-medium">{formatIDR(takeProfit2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">TP3 (4 ATR)</span>
                <span className="font-medium">{formatIDR(takeProfit3)}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-purple-500">Position Size</h3>
              <span className="text-sm text-purple-500">2% risk</span>
            </div>
            <p className="text-2xl font-bold">{positionSize.toFixed(0)} shares</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
              <FiInfo className="w-4 h-4" />
              <span>Based on 1M IDR account</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-yellow-500">Risk/Reward Ratio</h3>
              <span className="text-sm text-yellow-500">
                {riskRewardRatio > 2 ? 'Good' : riskRewardRatio > 1 ? 'Acceptable' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold">{riskRewardRatio.toFixed(2)}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
              <FiInfo className="w-4 h-4" />
              <span>Based on average take profit</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 