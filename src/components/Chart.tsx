'use client'

import { useEffect, useRef } from 'react'
import { createChart, ColorType, IChartApi, Time } from 'lightweight-charts'
import { StockData } from '@/lib/api'
import { calculateTechnicalIndicator } from '@/lib/api'

interface ChartProps {
  data: StockData[]
  selectedIndicators?: Array<{
    name: string
    params: Record<string, number>
  }>
}

export default function Chart({ data, selectedIndicators = [] }: ChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)

  useEffect(() => {
    if (!chartContainerRef.current) return

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1E1E1E' },
        textColor: '#DDD',
      },
      grid: {
        vertLines: { color: '#2B2B2B' },
        horzLines: { color: '#2B2B2B' },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
    })

    const candlestickSeries = chart.addCandlestickSeries({
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    })

    const chartData = data.map(d => ({
      time: new Date(d.timestamp * 1000).toISOString().split('T')[0] as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))

    candlestickSeries.setData(chartData)

    // Add technical indicators
    const getIndicatorColor = (indicator: string) => {
      const colors: Record<string, string> = {
        'SMA': '#2196F3',
        'EMA': '#4CAF50',
        'RSI': '#FF9800',
        'MACD': '#9C27B0',
        'BB': '#F44336',
      }
      return colors[indicator] || '#FFFFFF'
    }

    selectedIndicators.forEach(async (indicator) => {
      const result = await calculateTechnicalIndicator(data, indicator.name, indicator.params)
      if (result.values.length > 0) {
        const lineSeries = chart.addLineSeries({
          color: getIndicatorColor(indicator.name),
          lineWidth: 2,
        })

        const indicatorData = result.values.map((value, index) => ({
          time: new Date(data[index].timestamp * 1000).toISOString().split('T')[0] as Time,
          value,
        }))

        lineSeries.setData(indicatorData)
      }
    })

    chartRef.current = chart

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
  }, [data, selectedIndicators])

  const handleRefresh = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent()
    }
  }

  return (
    <div className="relative">
      <div ref={chartContainerRef} className="w-full" />
      <button
        onClick={handleRefresh}
        className="absolute top-2 right-2 p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Refresh
      </button>
    </div>
  )
} 