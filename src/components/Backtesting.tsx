'use client'

import { useState, useEffect } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { getHistoricalData, StockData } from '@/lib/yahooFinance'

interface Trade {
  entryDate: string
  exitDate: string
  entryPrice: number
  exitPrice: number
  profit: number
  profitPercentage: number
}

interface BacktestResult {
  trades: Trade[]
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalProfit: number
  averageProfit: number
  maxDrawdown: number
  profitFactor: number
}

interface BacktestingProps {
  symbol: string
}

const Backtesting: React.FC<BacktestingProps> = ({ symbol }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [strategy, setStrategy] = useState({
    entryCondition: 'crossover', // 'crossover' | 'breakout' | 'support'
    exitCondition: 'target', // 'target' | 'stop' | 'trailing'
    takeProfit: 2, // percentage
    stopLoss: 1, // percentage
    maPeriod: 20, // for moving average
  })

  const runBacktest = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getHistoricalData(symbol, '1d', '1y')
      const trades: Trade[] = []
      let inPosition = false
      let entryPrice = 0
      let entryDate = ''

      // Calculate moving averages
      const ma = calculateMA(data, strategy.maPeriod)

      for (let i = strategy.maPeriod; i < data.length - 1; i++) {
        const currentPrice = data[i].close
        const nextPrice = data[i + 1].close

        // Entry conditions
        if (!inPosition) {
          if (strategy.entryCondition === 'crossover' && 
              currentPrice > ma[i] && 
              data[i - 1].close <= ma[i - 1]) {
            inPosition = true
            entryPrice = nextPrice
            entryDate = new Date(data[i + 1].timestamp * 1000).toISOString().split('T')[0]
          }
        }
        // Exit conditions
        else {
          const profitPercentage = ((nextPrice - entryPrice) / entryPrice) * 100
          
          if (profitPercentage >= strategy.takeProfit || 
              profitPercentage <= -strategy.stopLoss) {
            trades.push({
              entryDate,
              exitDate: new Date(data[i + 1].timestamp * 1000).toISOString().split('T')[0],
              entryPrice,
              exitPrice: nextPrice,
              profit: nextPrice - entryPrice,
              profitPercentage
            })
            inPosition = false
          }
        }
      }

      // Calculate statistics
      const winningTrades = trades.filter(t => t.profit > 0).length
      const totalProfit = trades.reduce((sum, t) => sum + t.profit, 0)
      const maxDrawdown = calculateMaxDrawdown(trades)
      const profitFactor = calculateProfitFactor(trades)

      setResult({
        trades,
        totalTrades: trades.length,
        winningTrades,
        losingTrades: trades.length - winningTrades,
        winRate: (winningTrades / trades.length) * 100,
        totalProfit,
        averageProfit: totalProfit / trades.length,
        maxDrawdown,
        profitFactor
      })
    } catch (error) {
      console.error('Error running backtest:', error)
      setError('Failed to run backtest. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateMA = (data: StockData[], period: number): number[] => {
    const ma: number[] = []
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        ma.push(0)
        continue
      }
      const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b.close, 0)
      ma.push(sum / period)
    }
    return ma
  }

  const calculateMaxDrawdown = (trades: Trade[]): number => {
    let maxDrawdown = 0
    let peak = 0
    let currentValue = 0

    trades.forEach(trade => {
      currentValue += trade.profit
      if (currentValue > peak) {
        peak = currentValue
      }
      const drawdown = (peak - currentValue) / peak * 100
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown
      }
    })

    return maxDrawdown
  }

  const calculateProfitFactor = (trades: Trade[]): number => {
    const grossProfit = trades
      .filter(t => t.profit > 0)
      .reduce((sum, t) => sum + t.profit, 0)
    const grossLoss = Math.abs(trades
      .filter(t => t.profit < 0)
      .reduce((sum, t) => sum + t.profit, 0))
    return grossLoss === 0 ? grossProfit : grossProfit / grossLoss
  }

  useEffect(() => {
    if (symbol) {
      runBacktest()
    }
  }, [symbol])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Backtesting</h2>
        <button
          onClick={runBacktest}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Run Backtest</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Entry Condition</label>
          <select
            value={strategy.entryCondition}
            onChange={(e) => setStrategy({ ...strategy, entryCondition: e.target.value })}
            className="w-full px-3 py-2 bg-secondary rounded text-white"
          >
            <option value="crossover">MA Crossover</option>
            <option value="breakout">Price Breakout</option>
            <option value="support">Support Level</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Exit Condition</label>
          <select
            value={strategy.exitCondition}
            onChange={(e) => setStrategy({ ...strategy, exitCondition: e.target.value })}
            className="w-full px-3 py-2 bg-secondary rounded text-white"
          >
            <option value="target">Take Profit</option>
            <option value="stop">Stop Loss</option>
            <option value="trailing">Trailing Stop</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Take Profit (%)</label>
          <input
            type="number"
            value={strategy.takeProfit}
            onChange={(e) => setStrategy({ ...strategy, takeProfit: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-secondary rounded text-white"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm text-gray-400">Stop Loss (%)</label>
          <input
            type="number"
            value={strategy.stopLoss}
            onChange={(e) => setStrategy({ ...strategy, stopLoss: Number(e.target.value) })}
            className="w-full px-3 py-2 bg-secondary rounded text-white"
          />
        </div>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary rounded p-4">
              <div className="text-sm text-gray-400">Win Rate</div>
              <div className="text-lg font-medium text-accent">
                {result.winRate.toFixed(1)}%
              </div>
            </div>

            <div className="bg-secondary rounded p-4">
              <div className="text-sm text-gray-400">Total Profit</div>
              <div className="text-lg font-medium text-green-400">
                ${result.totalProfit.toFixed(2)}
              </div>
            </div>

            <div className="bg-secondary rounded p-4">
              <div className="text-sm text-gray-400">Max Drawdown</div>
              <div className="text-lg font-medium text-red-400">
                {result.maxDrawdown.toFixed(1)}%
              </div>
            </div>

            <div className="bg-secondary rounded p-4">
              <div className="text-sm text-gray-400">Profit Factor</div>
              <div className="text-lg font-medium text-accent">
                {result.profitFactor.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="bg-secondary rounded p-4">
            <h3 className="text-lg font-medium mb-4">Trade History</h3>
            <div className="space-y-2">
              {result.trades.map((trade, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-primary rounded"
                >
                  <div className="text-sm">
                    <span className="text-gray-400">{trade.entryDate}</span>
                    <span className="mx-2">→</span>
                    <span className="text-gray-400">{trade.exitDate}</span>
                  </div>
                  <div className="text-sm">
                    <span className={trade.profit > 0 ? 'text-green-400' : 'text-red-400'}>
                      {trade.profitPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Backtesting 