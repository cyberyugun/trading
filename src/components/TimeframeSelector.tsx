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
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-2">
        <label htmlFor="interval" className="text-sm font-medium text-gray-300 whitespace-nowrap">
          Interval:
        </label>
        <select
          id="interval"
          value={selected}
          onChange={(e) => onChange(e.target.value as TimeInterval)}
          className="w-32"
        >
          {timeIntervalOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <label htmlFor="range" className="text-sm font-medium text-gray-300 whitespace-nowrap">
          Range:
        </label>
        <select
          id="range"
          value={range}
          onChange={(e) => onRangeChange(e.target.value as TimeRange)}
          className="w-32"
        >
          {timeRangeOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 