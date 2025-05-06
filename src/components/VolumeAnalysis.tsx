'use client'

import { useState, useEffect } from 'react'
import { FiRefreshCw } from 'react-icons/fi'
import { getHistoricalData, StockData } from '@/lib/yahooFinance'

interface VolumeAnalysisProps {
  symbol: string
}

const VolumeAnalysis: React.FC<VolumeAnalysisProps> = ({ symbol }) => {
  const [volumeData, setVolumeData] = useState<{ time: string; volume: number }[]>([])
  const [averageVolume, setAverageVolume] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVolumeData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getHistoricalData(symbol, '1d', '1mo')
      
      const formattedData = data.map(d => ({
        time: new Date(d.timestamp * 1000).toISOString().split('T')[0],
        volume: d.volume
      }))

      setVolumeData(formattedData)
      
      // Calculate average volume
      const avg = formattedData.reduce((sum, item) => sum + item.volume, 0) / formattedData.length
      setAverageVolume(avg)
    } catch (error) {
      console.error('Error fetching volume data:', error)
      setError('Failed to fetch volume data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (symbol) {
      fetchVolumeData()
    }
  }, [symbol])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Volume Analysis</h2>
        <button
          onClick={fetchVolumeData}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-1 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded">
          {error}
        </div>
      )}
      
      <div className="bg-secondary rounded p-4 mb-4">
        <div className="text-lg font-medium text-accent">
          Average Volume: {averageVolume.toLocaleString()}
        </div>
      </div>

      <div className="space-y-2">
        {volumeData.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-secondary rounded"
          >
            <span className="text-gray-300">{item.time}</span>
            <span className={item.volume > averageVolume ? 'text-green-400' : 'text-red-400'}>
              {item.volume.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default VolumeAnalysis 