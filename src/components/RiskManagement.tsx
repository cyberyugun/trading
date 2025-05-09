'use client'

import { useState, useEffect } from 'react'
import { StockData } from '@/lib/api'
import { FiInfo, FiDollarSign, FiTrendingUp, FiTrendingDown, FiAlertCircle } from 'react-icons/fi'
import { formatIDR } from '@/lib/utils'

interface RiskManagementProps {
  data: StockData[]
}

interface PriceLevel {
  price: number
  quantity: number
}

export default function RiskManagement({ data }: RiskManagementProps) {
  const [entryPrices, setEntryPrices] = useState<PriceLevel[]>([{ price: 0, quantity: 0 }])
  const [takeProfits, setTakeProfits] = useState<PriceLevel[]>([{ price: 0, quantity: 0 }])
  const [stopLoss, setStopLoss] = useState<number>(0)
  const [riskRewardRatio, setRiskRewardRatio] = useState<number>(0)
  const [positionSize, setPositionSize] = useState<number>(0)
  const [accountSize, setAccountSize] = useState<number>(1000000) // Default 1M IDR

  useEffect(() => {
    if (!data || data.length === 0) return

    // Calculate average true range (ATR) for stop loss
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

    const atr = calculateATR(data)
    const currentPrice = data[data.length - 1].close
    setStopLoss(currentPrice - atr * 2) // 2 ATR below current price
  }, [data])

  const addEntryPrice = () => {
    setEntryPrices([...entryPrices, { price: 0, quantity: 0 }])
  }

  const removeEntryPrice = (index: number) => {
    setEntryPrices(entryPrices.filter((_, i) => i !== index))
  }

  const updateEntryPrice = (index: number, field: keyof PriceLevel, value: number) => {
    const newEntryPrices = [...entryPrices]
    newEntryPrices[index] = { ...newEntryPrices[index], [field]: value }
    setEntryPrices(newEntryPrices)
  }

  const addTakeProfit = () => {
    setTakeProfits([...takeProfits, { price: 0, quantity: 0 }])
  }

  const removeTakeProfit = (index: number) => {
    setTakeProfits(takeProfits.filter((_, i) => i !== index))
  }

  const updateTakeProfit = (index: number, field: keyof PriceLevel, value: number) => {
    const newTakeProfits = [...takeProfits]
    newTakeProfits[index] = { ...newTakeProfits[index], [field]: value }
    setTakeProfits(newTakeProfits)
  }

  const calculatePositionSize = () => {
    const totalRisk = entryPrices.reduce((sum, entry) => {
      const riskPerShare = entry.price - stopLoss
      return sum + (riskPerShare * entry.quantity)
    }, 0)

    const maxRiskAmount = accountSize * 0.02 // 2% risk per trade
    const calculatedSize = maxRiskAmount / totalRisk

    setPositionSize(calculatedSize)
  }

  const calculateRiskReward = () => {
    const totalRisk = entryPrices.reduce((sum, entry) => {
      const riskPerShare = entry.price - stopLoss
      return sum + (riskPerShare * entry.quantity)
    }, 0)

    const totalReward = takeProfits.reduce((sum, tp) => {
      const rewardPerShare = tp.price - entryPrices[0].price
      return sum + (rewardPerShare * tp.quantity)
    }, 0)

    setRiskRewardRatio(totalReward / totalRisk)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Risk Management</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FiInfo className="w-4 h-4" />
          <span>Manage your trade risk</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Entry Prices</label>
            <div className="space-y-3">
              {entryPrices.map((entry, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={entry.price}
                      onChange={(e) => updateEntryPrice(index, 'price', parseFloat(e.target.value))}
                      className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Price"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={entry.quantity}
                      onChange={(e) => updateEntryPrice(index, 'quantity', parseFloat(e.target.value))}
                      className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Quantity"
                    />
                  </div>
                  {index > 0 && (
                    <button
                      onClick={() => removeEntryPrice(index)}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <FiAlertCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addEntryPrice}
                className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <FiTrendingUp className="w-4 h-4" />
                Add Entry Price
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Take Profit Levels</label>
            <div className="space-y-3">
              {takeProfits.map((tp, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tp.price}
                      onChange={(e) => updateTakeProfit(index, 'price', parseFloat(e.target.value))}
                      className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Price"
                    />
                  </div>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={tp.quantity}
                      onChange={(e) => updateTakeProfit(index, 'quantity', parseFloat(e.target.value))}
                      className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Quantity"
                    />
                  </div>
                  {index > 0 && (
                    <button
                      onClick={() => removeTakeProfit(index)}
                      className="p-2 text-red-500 hover:text-red-600"
                    >
                      <FiAlertCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addTakeProfit}
                className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <FiTrendingUp className="w-4 h-4" />
                Add Take Profit
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Stop Loss</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value))}
              className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="Stop Loss Price"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Account Size</label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={accountSize}
                onChange={(e) => setAccountSize(parseFloat(e.target.value))}
                className="w-full pl-10 p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="Account Size"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={calculatePositionSize}
            className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center gap-2"
          >
            <FiTrendingUp className="w-4 h-4" />
            Calculate Position Size
          </button>
          <button
            onClick={calculateRiskReward}
            className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <FiTrendingDown className="w-4 h-4" />
            Calculate Risk/Reward
          </button>
        </div>

        {positionSize > 0 && (
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-green-500">Position Size</h3>
              <span className="text-sm text-green-500">2% risk per trade</span>
            </div>
            <p className="text-2xl font-bold">{positionSize.toFixed(2)} shares</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
              <FiInfo className="w-4 h-4" />
              <span>Based on your risk tolerance</span>
            </div>
          </div>
        )}

        {riskRewardRatio > 0 && (
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium text-blue-500">Risk/Reward Ratio</h3>
              <span className="text-sm text-blue-500">
                {riskRewardRatio > 2 ? 'Good' : riskRewardRatio > 1 ? 'Acceptable' : 'Poor'}
              </span>
            </div>
            <p className="text-2xl font-bold">{riskRewardRatio.toFixed(2)}</p>
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
              <FiInfo className="w-4 h-4" />
              <span>Target: 2.0 or higher</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 