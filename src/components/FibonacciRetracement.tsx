'use client'

import { useState } from 'react'

const FibonacciRetracement: React.FC = () => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPrice, setStartPrice] = useState<number | null>(null)
  const [endPrice, setEndPrice] = useState<number | null>(null)

  const fibonacciLevels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]

  const calculateLevels = () => {
    if (!startPrice || !endPrice) return []
    
    const diff = endPrice - startPrice
    return fibonacciLevels.map(level => ({
      level,
      price: startPrice + diff * level,
    }))
  }

  const startDrawing = () => {
    const price = parseFloat(prompt('Enter start price:') || '0')
    if (price > 0) {
      setStartPrice(price)
      setIsDrawing(true)
    }
  }

  const endDrawing = () => {
    const price = parseFloat(prompt('Enter end price:') || '0')
    if (price > 0) {
      setEndPrice(price)
      setIsDrawing(false)
    }
  }

  const levels = calculateLevels()

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">Fibonacci Retracement</h2>
      
      <div className="flex space-x-2 mb-4">
        <button
          onClick={startDrawing}
          className="px-3 py-1 bg-accent text-white rounded hover:bg-accent-hover"
        >
          Start Drawing
        </button>
        {isDrawing && (
          <button
            onClick={endDrawing}
            className="px-3 py-1 bg-accent text-white rounded hover:bg-accent-hover"
          >
            End Drawing
          </button>
        )}
      </div>

      {levels.length > 0 && (
        <div className="space-y-2">
          {levels.map(({ level, price }) => (
            <div
              key={level}
              className="flex items-center justify-between p-2 bg-secondary rounded"
            >
              <span className="text-gray-300">Level {level}:</span>
              <span className="text-accent">{price.toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FibonacciRetracement 