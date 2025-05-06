'use client'

interface TimeframeSelectorProps {
  timeframe: string
  onTimeframeChange: (timeframe: string) => void
}

const TimeframeSelector: React.FC<TimeframeSelectorProps> = ({
  timeframe,
  onTimeframeChange,
}) => {
  const timeframes = [
    { value: '1m', label: '1 Minute' },
    { value: '5m', label: '5 Minutes' },
    { value: '15m', label: '15 Minutes' },
    { value: '1h', label: '1 Hour' },
    { value: '4h', label: '4 Hours' },
    { value: '1d', label: '1 Day' },
    { value: '1w', label: '1 Week' },
  ]

  return (
    <div className="flex space-x-2 mb-4">
      {timeframes.map(tf => (
        <button
          key={tf.value}
          onClick={() => onTimeframeChange(tf.value)}
          className={`px-3 py-1 rounded ${
            timeframe === tf.value
              ? 'bg-accent text-white'
              : 'bg-secondary hover:bg-accent-hover text-gray-300'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  )
}

export default TimeframeSelector 