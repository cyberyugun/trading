'use client'

import { useState, useEffect } from 'react'
import { getQuote, getHistoricalData } from '@/lib/yahooFinance'
import { formatIDR } from '@/lib/utils'
import { TimeInterval, TimeRange } from '@/types/timeframe'
import TimeframeSelector from './TimeframeSelector'
import { FiInfo, FiRefreshCw, FiAlertCircle } from 'react-icons/fi'

interface RiskManagementProps {
  symbol: string
}

interface PriceLevel {
  price: number
  percentage: number
}

export default function RiskManagement({ symbol }: RiskManagementProps) {
  const [entries, setEntries] = useState<PriceLevel[]>([])
  const [takeProfits, setTakeProfits] = useState<PriceLevel[]>([])
  const [stopLosses, setStopLosses] = useState<PriceLevel[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [interval, setInterval] = useState<TimeInterval>('1d')
  const [range, setRange] = useState<TimeRange>('1mo')
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const [riskRewardRatio, setRiskRewardRatio] = useState<number | null>(null)

  const calculateLevels = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Get current price
      const quote = await getQuote(symbol)
      const currentPrice = quote.regularMarketPrice

      // Get historical data for volatility calculation
      const historicalData = await getHistoricalData(symbol, interval, range)
      
      if (!historicalData || historicalData.length === 0) {
        throw new Error('No historical data available')
      }

      // Calculate average true range (ATR) for volatility
      const atr = calculateATR(historicalData)
      
      // Calculate entry prices (current price and ±0.5 ATR)
      const entryPrices = [
        { price: currentPrice - atr * 0.5, percentage: -0.5 },
        { price: currentPrice, percentage: 0 },
        { price: currentPrice + atr * 0.5, percentage: 0.5 }
      ]
      setEntries(entryPrices)
      
      // Calculate take profit levels (1x, 2x, 3x ATR above entry)
      const takeProfitLevels = entryPrices.map(entry => ({
        price: entry.price + atr * 2,
        percentage: ((entry.price + atr * 2 - entry.price) / entry.price) * 100
      }))
      setTakeProfits(takeProfitLevels)
      
      // Calculate stop loss levels (0.5x, 1x, 1.5x ATR below entry)
      const stopLossLevels = entryPrices.map(entry => ({
        price: entry.price - atr,
        percentage: ((entry.price - atr - entry.price) / entry.price) * 100
      }))
      setStopLosses(stopLossLevels)

      // Calculate risk-reward ratio based on middle entry
      const middleEntry = entryPrices[1]
      const risk = middleEntry.price - stopLossLevels[1].price
      const reward = takeProfitLevels[1].price - middleEntry.price
      setRiskRewardRatio(reward / risk)
    } catch (err) {
      console.error('Error calculating risk levels:', err)
      setError(err instanceof Error ? err.message : 'Failed to calculate risk levels')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateATR = (data: any[]) => {
    const trueRanges = data.slice(1).map((d, i) => {
      const high = d.high
      const low = d.low
      const prevClose = data[i].close
      return Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )
    })
    
    // Calculate 14-period ATR
    const period = 14
    const atr = trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period
    return atr
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const historicalData = await getHistoricalData(symbol, interval, range)
        setData(historicalData)
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [symbol, interval, range])

  useEffect(() => {
    if (symbol) {
      calculateLevels()
    }
  }, [symbol])

  const renderPriceLevels = (levels: PriceLevel[], type: 'entry' | 'takeProfit' | 'stopLoss') => {
    const colors = {
      entry: 'gray',
      takeProfit: 'green',
      stopLoss: 'red'
    }
    const color = colors[type]
    const labels = {
      entry: 'Entry',
      takeProfit: 'Take Profit',
      stopLoss: 'Stop Loss'
    }

    return (
      <div className="space-y-3">
        {levels.map((level, index) => (
          <div
            key={index}
            className={`p-3 bg-${color}-50 rounded-lg border border-${color}-200`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{labels[type]} {index + 1}</span>
              <span className={`text-sm text-${color}-600`}>
                {level.percentage > 0 ? '+' : ''}{level.percentage.toFixed(2)}%
              </span>
            </div>
            <div className={`text-lg font-bold text-${color}-600 mt-1`}>
              {formatIDR(level.price)}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Risk Management</h2>
          <p className="text-sm text-gray-500 mt-1">Trading levels for {symbol}</p>
        </div>
        <button
          onClick={calculateLevels}
          disabled={isLoading}
          className="p-2 text-gray-600 hover:text-accent transition-colors"
          title="Recalculate levels"
        >
          <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mb-6">
        <TimeframeSelector
          selected={interval}
          range={range}
          onChange={setInterval}
          onRangeChange={setRange}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              <FiAlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-700">Entry Prices</h3>
                <div className="group relative">
                  <FiInfo className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Suggested entry price levels
                  </div>
                </div>
              </div>
              {renderPriceLevels(entries, 'entry')}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-green-600">Take Profit</h3>
                <div className="group relative">
                  <FiInfo className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Target prices for profit taking
                  </div>
                </div>
              </div>
              {renderPriceLevels(takeProfits, 'takeProfit')}
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-red-600">Stop Loss</h3>
                <div className="group relative">
                  <FiInfo className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Price levels to limit potential losses
                  </div>
                </div>
              </div>
              {renderPriceLevels(stopLosses, 'stopLoss')}
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Risk/Reward Ratio</span>
              <span className="text-lg font-bold text-gray-800">
                {isLoading ? 'Calculating...' : riskRewardRatio ? `${riskRewardRatio.toFixed(2)}:1` : '-'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 