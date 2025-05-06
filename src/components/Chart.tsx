'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi } from 'lightweight-charts'
import { FiRefreshCw } from 'react-icons/fi'
import { getHistoricalData, StockData } from '@/lib/yahooFinance'

interface ChartProps {
  timeframe: string
  symbol: string
}

const Chart: React.FC<ChartProps> = ({ timeframe, symbol }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getHistoricalData(symbol, timeframe, '3mo')
      
      if (chartRef.current) {
        const candlestickSeries = chartRef.current.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        })
        
        const formattedData = data.map(d => ({
          time: new Date(d.timestamp * 1000).toISOString().split('T')[0],
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close
        }))
        
        candlestickSeries.setData(formattedData)
      }
    } catch (error) {
      console.error('Error fetching chart data:', error)
      setError('Failed to fetch chart data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#2d2d2d' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2d2d2d' },
        horzLines: { color: '#2d2d2d' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
    })

    chartRef.current = chart
    fetchData()

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [timeframe, symbol])

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
}

export default Chart 