'use client'

import React from 'react'

interface TimeframeSelectorProps {
  selected: string
  range: string
  onChange: (timeframe: string) => void
  onRangeChange: (range: string) => void
}

const timeframes = [
  { label: '1 Minute', value: '1m' },
  { label: '5 Minutes', value: '5m' },
  { label: '15 Minutes', value: '15m' },
  { label: '30 Minutes', value: '30m' },
  { label: '1 Hour', value: '1h' },
  { label: '4 Hours', value: '4h' },
  { label: '1 Day', value: '1d' },
  { label: '1 Week', value: '1wk' },
  { label: '1 Month', value: '1mo' },
  { label: '3 Months', value: '3mo' }
]

const ranges = [
  { label: '1 Day', value: '1d' },
  { label: '5 Days', value: '5d' },
  { label: '1 Month', value: '1mo' },
  { label: '3 Months', value: '3mo' },
  { label: '6 Months', value: '6mo' },
  { label: '1 Year', value: '1y' },
  { label: '2 Years', value: '2y' },
  { label: '5 Years', value: '5y' },
  { label: '10 Years', value: '10y' },
  { label: 'YTD', value: 'ytd' },
  { label: 'Max', value: 'max' }
]

export default function TimeframeSelector({ selected, range, onChange, onRangeChange }: TimeframeSelectorProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {timeframes.map((timeframe) => (
          <button
            key={timeframe.value}
            onClick={() => onChange(timeframe.value)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
              ${selected === timeframe.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {timeframe.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {ranges.map((rangeItem) => (
          <button
            key={rangeItem.value}
            onClick={() => onRangeChange(rangeItem.value)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors
              ${range === rangeItem.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {rangeItem.label}
          </button>
        ))}
      </div>
    </div>
  )
} 