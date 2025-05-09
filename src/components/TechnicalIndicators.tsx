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
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Technical Indicators</h2>
      
      <div className="grid grid-cols-2 gap-6">
        {Object.entries(indicatorGroups).map(([group, groupIndicators]) => (
          <div key={group} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">{group}</h3>
            <div className="space-y-2">
              {groupIndicators.map(indicator => (
                <button
                  key={indicator}
                  onClick={() => toggleIndicator(indicator)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    indicators.includes(indicator)
                      ? 'bg-accent text-white hover:bg-accent-hover'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  <span className="font-medium">{indicator}</span>
                  {indicators.includes(indicator) && (
                    <FiCheck className="w-5 h-5" />
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