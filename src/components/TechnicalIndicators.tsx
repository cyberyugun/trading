'use client'

import { useState } from 'react'
import { FiCheck } from 'react-icons/fi'

interface TechnicalIndicatorsProps {
  selected?: string[]
  onChange?: (indicators: string[]) => void
}

const TechnicalIndicators: React.FC<TechnicalIndicatorsProps> = ({
  selected = [],
  onChange = () => {}
}) => {
  const [indicators, setIndicators] = useState<string[]>(selected)

  const toggleIndicator = (indicator: string) => {
    const newIndicators = indicators.includes(indicator)
      ? indicators.filter(i => i !== indicator)
      : [...indicators, indicator]
    
    setIndicators(newIndicators)
    onChange(newIndicators)
  }

  const indicatorGroups = {
    'Trend': ['MA', 'EMA', 'MACD', 'ADX'],
    'Momentum': ['RSI', 'Stochastic', 'CCI', 'Williams %R'],
    'Volatility': ['Bollinger Bands', 'ATR', 'Keltner Channels'],
    'Volume': ['OBV', 'Volume MA', 'Chaikin Money Flow']
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Technical Indicators</h2>
      
      <div className="grid grid-cols-2 gap-4">
        {Object.entries(indicatorGroups).map(([group, groupIndicators]) => (
          <div key={group} className="space-y-2">
            <h3 className="text-sm font-medium text-gray-400">{group}</h3>
            <div className="space-y-1">
              {groupIndicators.map(indicator => (
                <button
                  key={indicator}
                  onClick={() => toggleIndicator(indicator)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded ${
                    indicators.includes(indicator)
                      ? 'bg-accent text-white'
                      : 'bg-secondary text-gray-300 hover:bg-secondary-hover'
                  }`}
                >
                  <span>{indicator}</span>
                  {indicators.includes(indicator) && (
                    <FiCheck className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TechnicalIndicators 