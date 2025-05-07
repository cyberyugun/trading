'use client'

import { useEffect, useRef, useState } from 'react'
import { createChart, ColorType, IChartApi } from 'lightweight-charts'
import { FiRefreshCw } from 'react-icons/fi'
import { getHistoricalData, StockData } from '@/lib/yahooFinance'
import { formatIDR, formatNumber } from '@/lib/utils'

interface ChartProps {
  timeframe: string
  range: string
  symbol: string
}

export default function Chart({ timeframe, range, symbol }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a1a' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2B2B43' },
        horzLines: { color: '#2B2B43' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 500,
      localization: {
        priceFormatter: (price: number) => formatIDR(price),
      },
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    const volumeSeries = chart.addHistogramSeries({
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    })

    chartRef.current = chart

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getHistoricalData(symbol, timeframe, range)
        
        if (!data || data.length === 0) {
          throw new Error('No data available')
        }

        const candleData = data.map(d => ({
          time: new Date(d.timestamp * 1000).toISOString().split('T')[0],
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close
        }))

        const volumeData = data.map(d => ({
          time: new Date(d.timestamp * 1000).toISOString().split('T')[0],
          value: d.volume,
          color: d.close >= d.open ? '#26a69a' : '#ef5350'
        }))

        candlestickSeries.setData(candleData)
        volumeSeries.setData(volumeData)

        chart.timeScale().fitContent()
      } catch (err) {
        console.error('Error in Chart component:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch stock data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth })
      }
    }

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      chart.remove()
    }
  }, [timeframe, range, symbol])

  return (
    <div className="bg-primary rounded-lg p-4">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => {
            // Implement the refresh logic here
          }}
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-accent text-white rounded hover:bg-accent-hover disabled:opacity-50"
        >
          <FiRefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-md text-red-500">
          {error}
        </div>
      )}

      <div ref={chartContainerRef} className="w-full" />
    </div>
  )
} 