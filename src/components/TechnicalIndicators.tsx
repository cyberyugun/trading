'use client'

import { useState } from 'react'
import { FiPlus, FiX, FiSettings, FiInfo } from 'react-icons/fi'

interface TechnicalIndicatorsProps {
  onChange: (indicators: Array<{ name: string; params: Record<string, number> }>) => void
  selectedIndicators: Array<{ name: string; params: Record<string, number> }>
}

const AVAILABLE_INDICATORS: Array<{ name: string; params: Record<string, number> }> = [
  { name: 'SMA', params: { period: 20 } },
  { name: 'EMA', params: { period: 20 } },
  { name: 'RSI', params: { period: 14 } },
  { name: 'MACD', params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } },
  { name: 'Bollinger Bands', params: { period: 20, stdDev: 2 } },
  { name: 'Stochastic', params: { kPeriod: 14, dPeriod: 3, slowing: 3 } },
  { name: 'ATR', params: { period: 14 } },
  { name: 'Ichimoku Cloud', params: { conversionPeriod: 9, basePeriod: 26, spanPeriod: 52, displacement: 26 } }
]

export default function TechnicalIndicators({ onChange, selectedIndicators }: TechnicalIndicatorsProps) {
  const [selectedIndicator, setSelectedIndicator] = useState('')
  const [params, setParams] = useState<Record<string, number>>({})

  const handleAddIndicator = () => {
    if (selectedIndicator) {
      const indicator = AVAILABLE_INDICATORS.find(i => i.name === selectedIndicator)
      if (indicator) {
        onChange([...selectedIndicators, { name: selectedIndicator, params: { ...indicator.params } }])
        setSelectedIndicator('')
        setParams({})
      }
    }
  }

  const handleRemoveIndicator = (index: number) => {
    const newIndicators = selectedIndicators.filter((_, i) => i !== index)
    onChange(newIndicators)
  }

  const handleParamChange = (index: number, param: string, value: number) => {
    const newIndicators = [...selectedIndicators]
    newIndicators[index].params[param] = value
    onChange(newIndicators)
  }

  const getIndicatorDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'SMA': 'Simple Moving Average - Average price over a period',
      'EMA': 'Exponential Moving Average - Weighted average price',
      'RSI': 'Relative Strength Index - Momentum oscillator',
      'MACD': 'Moving Average Convergence Divergence - Trend following momentum',
      'Bollinger Bands': 'Volatility bands around moving average',
      'Stochastic': 'Momentum indicator comparing closing price to price range',
      'ATR': 'Average True Range - Volatility indicator',
      'Ichimoku Cloud': 'Complete trading system with support/resistance'
    }
    return descriptions[name] || ''
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Technical Indicators</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <FiInfo className="w-4 h-4" />
          <span>Add indicators to chart</span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="flex-1">
            <select
              value={selectedIndicator}
              onChange={(e) => {
                setSelectedIndicator(e.target.value)
                const indicator = AVAILABLE_INDICATORS.find(i => i.name === e.target.value)
                if (indicator) {
                  setParams({ ...indicator.params })
                }
              }}
              className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select Indicator</option>
              {AVAILABLE_INDICATORS.map((indicator) => (
                <option key={indicator.name} value={indicator.name}>
                  {indicator.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddIndicator}
            disabled={!selectedIndicator}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" />
            Add
          </button>
        </div>

        {selectedIndicators.length > 0 && (
          <div className="space-y-3">
            {selectedIndicators.map((indicator, index) => (
              <div key={index} className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{indicator.name}</span>
                    <span className="text-sm text-gray-400">{getIndicatorDescription(indicator.name)}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveIndicator(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(indicator.params).map(([param, value]) => (
                    <div key={param} className="space-y-1">
                      <label className="text-xs text-gray-400 capitalize">{param}</label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => handleParamChange(index, param, parseFloat(e.target.value))}
                        className="w-full p-2 rounded bg-background border border-border focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 