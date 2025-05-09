'use client'

import { useState } from 'react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'

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
  params: Record<string, number>
}> = [
  { name: 'SMA', params: { period: 20 } },
  { name: 'EMA', params: { period: 20 } },
  { name: 'RSI', params: { period: 14 } },
  { name: 'MACD', params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } },
  { name: 'BB', params: { period: 20, stdDev: 2 } },
]

export default function TechnicalIndicators({ selectedIndicators, onChange }: TechnicalIndicatorsProps) {
  const [selectedIndicator, setSelectedIndicator] = useState('')
  const [params, setParams] = useState<Record<string, number>>({})

  const handleAddIndicator = () => {
    if (!selectedIndicator) return

    const indicator = AVAILABLE_INDICATORS.find(i => i.name === selectedIndicator)
    if (!indicator) return

    const newIndicators = [...selectedIndicators, { name: selectedIndicator, params: indicator.params }]
    onChange(newIndicators)
    setSelectedIndicator('')
    setParams({})
  }

  const handleRemoveIndicator = (index: number) => {
    const newIndicators = selectedIndicators.filter((_, i) => i !== index)
    onChange(newIndicators)
  }

  const handleParamChange = (name: string, value: string) => {
    setParams(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }))
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Technical Indicators</h2>
      <div className="flex gap-4">
        <select
          value={selectedIndicator}
          onChange={(e) => setSelectedIndicator(e.target.value)}
          className="flex-1 p-2 rounded bg-background border border-border"
        >
          <option value="">Select Indicator</option>
          {AVAILABLE_INDICATORS.map(indicator => (
            <option key={indicator.name} value={indicator.name}>
              {indicator.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAddIndicator}
          className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <FiPlus className="w-5 h-5" />
        </button>
      </div>

      {selectedIndicators.length > 0 && (
        <div className="space-y-2">
          {selectedIndicators.map((indicator, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-background rounded">
              <span className="flex-1">{indicator.name}</span>
              <button
                onClick={() => handleRemoveIndicator(index)}
                className="p-1 text-red-500 hover:text-red-600"
              >
                <FiTrash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 