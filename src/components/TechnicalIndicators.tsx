'use client'

import { useState } from 'react'
import { FiPlus, FiX, FiSettings } from 'react-icons/fi'

interface TechnicalIndicatorsProps {
  selectedIndicators: Array<{
    name: string
    params: Record<string, number>
  }>
  onChange: (indicators: Array<{
    name: string
    params: Record<string, number>
  }>) => void
}

const AVAILABLE_INDICATORS: Array<{
  name: string
  label: string
  params: Record<string, number>
  description: string
}> = [
  {
    name: 'sma',
    label: 'Simple Moving Average',
    params: { period: 20 },
    description: 'Average price over a period'
  },
  {
    name: 'ema',
    label: 'Exponential Moving Average',
    params: { period: 20 },
    description: 'Weighted average that gives more importance to recent prices'
  },
  {
    name: 'rsi',
    label: 'Relative Strength Index',
    params: { period: 14 },
    description: 'Momentum oscillator measuring speed and change of price movements'
  },
  {
    name: 'macd',
    label: 'MACD',
    params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
    description: 'Trend-following momentum indicator'
  },
  {
    name: 'bollinger',
    label: 'Bollinger Bands',
    params: { period: 20, stdDev: 2 },
    description: 'Volatility bands placed above and below a moving average'
  },
  {
    name: 'stochastic',
    label: 'Stochastic Oscillator',
    params: { kPeriod: 14, dPeriod: 3 },
    description: 'Momentum indicator comparing closing price to price range'
  }
]

export default function TechnicalIndicators({
  selectedIndicators,
  onChange
}: TechnicalIndicatorsProps) {
  const [selectedIndicator, setSelectedIndicator] = useState<string>('')
  const [params, setParams] = useState<Record<string, number>>({})

  const handleAddIndicator = () => {
    if (!selectedIndicator) return

    const indicator = AVAILABLE_INDICATORS.find(i => i.name === selectedIndicator)
    if (!indicator) return

    const newIndicators = [
      ...selectedIndicators,
      {
        name: selectedIndicator,
        params: { ...indicator.params, ...params }
      }
    ]

    onChange(newIndicators)
    setSelectedIndicator('')
    setParams({})
  }

  const handleRemoveIndicator = (index: number) => {
    const newIndicators = selectedIndicators.filter((_, i) => i !== index)
    onChange(newIndicators)
  }

  const handleParamChange = (key: string, value: string) => {
    setParams(prev => ({
      ...prev,
      [key]: Number(value)
    }))
  }

  return (
    <div className="technical-indicators">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-white">Technical Indicators</h2>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Add indicators to chart</span>
        </div>
      </div>

      <div className="space-y-4 mt-6">
        <div className="p-4 bg-[rgb(var(--accent-primary))]/10 rounded-lg border border-[rgb(var(--accent-primary))]/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-[rgb(var(--accent-primary))]">Add Indicator</h3>
            <FiSettings className="w-5 h-5 text-[rgb(var(--accent-primary))]" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Select Indicator
              </label>
              <select
                value={selectedIndicator}
                onChange={(e) => {
                  setSelectedIndicator(e.target.value)
                  const indicator = AVAILABLE_INDICATORS.find(i => i.name === e.target.value)
                  if (indicator) {
                    setParams(indicator.params)
                  }
                }}
                className="w-full"
              >
                <option value="">Choose an indicator</option>
                {AVAILABLE_INDICATORS.map(indicator => (
                  <option key={indicator.name} value={indicator.name}>
                    {indicator.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedIndicator && (
              <div className="space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(params).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </label>
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => setParams({ ...params, [key]: Number(e.target.value) })}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleAddIndicator}
                  className="w-full mt-4 px-4 py-2 bg-[rgb(var(--accent-primary))] text-white rounded-lg hover:bg-[rgb(var(--accent-hover))] transition-colors flex items-center justify-center gap-2"
                >
                  <FiPlus className="w-4 h-4" />
                  Add Indicator
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedIndicators.length > 0 && (
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-green-500">Active Indicators</h3>
              <span className="text-sm text-green-500">{selectedIndicators.length} selected</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {selectedIndicators.map((indicator, index) => (
                <div key={index} className="p-3 bg-[rgb(var(--card-bg))] rounded-lg border border-[rgb(var(--card-border))]">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-white">
                        {AVAILABLE_INDICATORS.find(i => i.name === indicator.name)?.label}
                      </span>
                      <div className="text-sm text-gray-400">
                        {Object.entries(indicator.params)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveIndicator(index)}
                      className="p-1 text-red-500 hover:text-red-600"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 