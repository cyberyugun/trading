'use client'

import { useState, useEffect } from 'react'
import { StockData } from '@/lib/api'
import { formatIDR } from '@/lib/utils'
import { FiInfo, FiAlertCircle } from 'react-icons/fi'

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
      <h2 className="text-xl font-semibold">Risk Management</h2>

      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">Entry Prices</h3>
          {entryPrices.map((entry, index) => (
            <div key={index} className="flex gap-4 mt-2">
              <input
                type="number"
                value={entry.price}
                onChange={(e) => updateEntryPrice(index, 'price', parseFloat(e.target.value))}
                className="flex-1 p-2 rounded bg-background border border-border"
                placeholder="Price"
              />
              <input
                type="number"
                value={entry.quantity}
                onChange={(e) => updateEntryPrice(index, 'quantity', parseFloat(e.target.value))}
                className="flex-1 p-2 rounded bg-background border border-border"
                placeholder="Quantity"
              />
              {index > 0 && (
                <button
                  onClick={() => removeEntryPrice(index)}
                  className="p-2 text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addEntryPrice}
            className="mt-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Entry Price
          </button>
        </div>

        <div>
          <h3 className="text-lg font-medium">Take Profit Levels</h3>
          {takeProfits.map((tp, index) => (
            <div key={index} className="flex gap-4 mt-2">
              <input
                type="number"
                value={tp.price}
                onChange={(e) => updateTakeProfit(index, 'price', parseFloat(e.target.value))}
                className="flex-1 p-2 rounded bg-background border border-border"
                placeholder="Price"
              />
              <input
                type="number"
                value={tp.quantity}
                onChange={(e) => updateTakeProfit(index, 'quantity', parseFloat(e.target.value))}
                className="flex-1 p-2 rounded bg-background border border-border"
                placeholder="Quantity"
              />
              {index > 0 && (
                <button
                  onClick={() => removeTakeProfit(index)}
                  className="p-2 text-red-500 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            onClick={addTakeProfit}
            className="mt-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Take Profit
          </button>
        </div>

        <div>
          <h3 className="text-lg font-medium">Stop Loss</h3>
          <input
            type="number"
            value={stopLoss}
            onChange={(e) => setStopLoss(parseFloat(e.target.value))}
            className="w-full p-2 rounded bg-background border border-border"
            placeholder="Stop Loss Price"
          />
        </div>

        <div>
          <h3 className="text-lg font-medium">Account Size</h3>
          <input
            type="number"
            value={accountSize}
            onChange={(e) => setAccountSize(parseFloat(e.target.value))}
            className="w-full p-2 rounded bg-background border border-border"
            placeholder="Account Size"
          />
        </div>

        <div className="flex gap-4">
          <button
            onClick={calculatePositionSize}
            className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Calculate Position Size
          </button>
          <button
            onClick={calculateRiskReward}
            className="flex-1 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Calculate Risk/Reward
          </button>
        </div>

        {positionSize > 0 && (
          <div className="p-4 bg-green-500/10 rounded">
            <h3 className="text-lg font-medium text-green-500">Position Size</h3>
            <p className="text-2xl font-bold">{positionSize.toFixed(2)} shares</p>
          </div>
        )}

        {riskRewardRatio > 0 && (
          <div className="p-4 bg-blue-500/10 rounded">
            <h3 className="text-lg font-medium text-blue-500">Risk/Reward Ratio</h3>
            <p className="text-2xl font-bold">{riskRewardRatio.toFixed(2)}</p>
          </div>
        )}
      </div>
    </div>
  )
} 