'use client'

import { useState, useEffect } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { getQuote, getHistoricalData, StockData } from '@/lib/yahooFinance'

interface TradeLevels {
  entry: number
  takeProfit: number
  stopLoss: number
  riskRewardRatio: number
}

interface RiskManagementProps {
  symbol: string
}

const RiskManagement: React.FC<RiskManagementProps> = ({ symbol }) => {
  const [tradeLevels, setTradeLevels] = useState<TradeLevels>({
    entry: 0,
    takeProfit: 0,
    stopLoss: 0,
    riskRewardRatio: 0
  })
  const [isLoading, setIsLoading] = useState(false)
  const [position, setPosition] = useState<'long' | 'short'>('long')
  const [error, setError] = useState<string | null>(null)

  const calculateRRR = (entry: number, tp: number, sl: number, pos: 'long' | 'short') => {
    if (pos === 'long') {
      const risk = entry - sl
      const reward = tp - entry
      return risk !== 0 ? (reward / risk).toFixed(2) : '0'
    } else {
      const risk = sl - entry
      const reward = entry - tp
      return risk !== 0 ? (reward / risk).toFixed(2) : '0'
    }
  }

  const calculateTradeLevels = (stockData: StockData[], currentPrice: number) => {
    const recentData = stockData.slice(-20) // Get last 20 days of data
    const volatility = calculateVolatility(recentData)
    
    let entry = currentPrice
    let takeProfit, stopLoss

    if (position === 'long') {
      takeProfit = entry + (volatility * 2) // 2x volatility for TP
      stopLoss = entry - volatility // 1x volatility for SL
    } else {
      takeProfit = entry - (volatility * 2) // 2x volatility for TP
      stopLoss = entry + volatility // 1x volatility for SL
    }

    const rrr = calculateRRR(entry, takeProfit, stopLoss, position)

    return {
      entry,
      takeProfit,
      stopLoss,
      riskRewardRatio: parseFloat(rrr)
    }
  }

  const calculateVolatility = (data: StockData[]): number => {
    const returns = data.slice(1).map((d, i) => 
      Math.log(d.close / data[i].close)
    )
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length
    const variance = returns.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / returns.length
    return Math.sqrt(variance) * data[data.length - 1].close
  }

  const fetchTradeLevels = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [quote, historicalData] = await Promise.all([
        getQuote(symbol),
        getHistoricalData(symbol, '1d', '1mo')
      ])

      const levels = calculateTradeLevels(historicalData, quote.regularMarketPrice)
      setTradeLevels(levels)
    } catch (error) {
      console.error('Error fetching trade levels:', error)
      setError('Failed to fetch stock data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (symbol) {
      fetchTradeLevels()
    }
  }, [symbol, position])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Risk Management</h2>
        <button
          onClick={fetchTradeLevels}
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

      <div className="flex space-x-4 mb-4">
        <button
          onClick={() => setPosition('long')}
          className={`px-4 py-2 rounded ${
            position === 'long'
              ? 'bg-green-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Long
        </button>
        <button
          onClick={() => setPosition('short')}
          className={`px-4 py-2 rounded ${
            position === 'short'
              ? 'bg-red-500 text-white'
              : 'bg-gray-700 text-gray-300'
          }`}
        >
          Short
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-secondary rounded p-4">
          <div className="text-sm text-gray-400">Entry Price</div>
          <div className="text-lg font-medium text-accent">
            ${tradeLevels.entry.toFixed(2)}
          </div>
        </div>

        <div className="bg-secondary rounded p-4">
          <div className="text-sm text-gray-400">Take Profit</div>
          <div className="text-lg font-medium text-green-400">
            ${tradeLevels.takeProfit.toFixed(2)}
          </div>
        </div>

        <div className="bg-secondary rounded p-4">
          <div className="text-sm text-gray-400">Stop Loss</div>
          <div className="text-lg font-medium text-red-400">
            ${tradeLevels.stopLoss.toFixed(2)}
          </div>
        </div>

        <div className="bg-secondary rounded p-4">
          <div className="text-sm text-gray-400">Risk/Reward Ratio</div>
          <div className="text-lg font-medium text-accent">
            {tradeLevels.riskRewardRatio.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RiskManagement 