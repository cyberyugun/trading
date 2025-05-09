'use client'

import { TimeInterval, TimeRange, timeIntervalOptions, timeRangeOptions } from '@/types/timeframe';

interface TimeframeSelectorProps {
  selected: TimeInterval;
  range: TimeRange;
  onChange: (timeframe: TimeInterval) => void;
  onRangeChange: (range: TimeRange) => void;
}

export default function TimeframeSelector({
  selected,
  range,
  onChange,
  onRangeChange,
}: TimeframeSelectorProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="flex flex-col">
        <label htmlFor="interval" className="text-sm font-medium text-gray-300 mb-1">
          Interval
        </label>
        <select
          id="interval"
          value={selected}
          onChange={(e) => onChange(e.target.value as TimeInterval)}
          className="block w-full rounded-lg bg-primary border border-gray-700 text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 transition-colors"
        >
          {timeIntervalOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-primary">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col">
        <label htmlFor="range" className="text-sm font-medium text-gray-300 mb-1">
          Range
        </label>
        <select
          id="range"
          value={range}
          onChange={(e) => onRangeChange(e.target.value as TimeRange)}
          className="block w-full rounded-lg bg-primary border border-gray-700 text-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 transition-colors"
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-primary">
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 