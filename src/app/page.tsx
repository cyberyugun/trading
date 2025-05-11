'use client'

import { useState, useEffect, useRef } from 'react'
import Chart from '@/components/Chart'
import TechnicalIndicators from '@/components/TechnicalIndicators'
import TimeframeSelector from '@/components/TimeframeSelector'
import SupportResistance from '@/components/SupportResistance'
import FibonacciRetracement from '@/components/FibonacciRetracement'
import VolumeAnalysis from '@/components/VolumeAnalysis'
import RiskManagement from '@/components/RiskManagement'
import Backtesting from '@/components/Backtesting'
import PriceAlert from '@/components/PriceAlert'
import DCARecommendation from '@/components/DCARecommendation'
import { OrderBookComponent } from '@/components/OrderBook'
import StockRecommendations from '@/components/StockRecommendations'
import { FiSearch, FiRefreshCw } from 'react-icons/fi'
import { searchStocks, SearchResult, getHistoricalData, StockData } from '@/lib/yahooFinance'
import { TimeInterval, TimeRange } from '@/types/timeframe'
import SectionNav from '@/components/SectionNav'

export default function Home() {
  const [timeframe, setTimeframe] = useState<TimeInterval>('1d')
  const [range, setRange] = useState<TimeRange>('1mo')
  const [symbol, setSymbol] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndicators, setSelectedIndicators] = useState<Array<{
    name: string
    params: Record<string, number>
  }>>([])
  const [stockData, setStockData] = useState<StockData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const [activeSection, setActiveSection] = useState<string>('chart')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (searchQuery.length >= 2) {
      setIsSearching(true)
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await searchStocks(searchQuery)
          setSearchResults(results)
        } catch (error) {
          console.error('Error searching stocks:', error)
          setError('Failed to search stocks')
        } finally {
          setIsSearching(false)
        }
      }, 300)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const fetchData = async (forceRefresh: boolean = false) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await getHistoricalData(symbol, timeframe, range, forceRefresh)
      if (!data || data.length === 0) {
        throw new Error('No data available')
      }
      setStockData(data)
    } catch (err) {
      console.error('Error fetching stock data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stock data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (symbol) {
      fetchData()
    }
  }, [symbol, timeframe, range])

  const handleSelectStock = (result: SearchResult) => {
    setSymbol(result.symbol)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleIndicatorChange = (indicators: Array<{
    name: string
    params: Record<string, number>
  }>) => {
    setSelectedIndicators(indicators)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchData(true)
    setIsRefreshing(false)
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--background))] text-[rgb(var(--foreground))]">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] mb-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-bold text-white">Stock Analysis</h1>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks by symbol or company name..."
                className="w-full px-4 py-3 pr-12 bg-[rgb(var(--card-bg))] border border-[rgb(var(--card-border))] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-gray-400"
              />
              <FiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold mb-4 text-white">Search Results</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectStock(result)}
                    className="p-4 bg-[rgb(var(--card-bg))] border border-[rgb(var(--card-border))] rounded-lg hover:bg-[rgb(var(--card-hover))] transition-colors text-left group"
                  >
                    <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">{result.symbol}</div>
                    <div className="text-sm text-gray-400">{result.name}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {symbol && (
          <>
            <SectionNav activeSection={activeSection} onSectionChange={setActiveSection} />
            <div className="space-y-8">
              <div id="chart" className={`bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] ${activeSection !== 'chart' ? 'hidden' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                  <h2 className="text-xl font-semibold text-white">{symbol}</h2>
                  <div className="flex items-center gap-4">
                    <TimeframeSelector
                      selected={timeframe}
                      range={range}
                      onChange={setTimeframe}
                      onRangeChange={setRange}
                    />
                    <button
                      onClick={handleRefresh}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                      title="Refresh data"
                    >
                      <FiRefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <Chart data={stockData} selectedIndicators={selectedIndicators} />
                  </div>
                  <div className="bg-[rgb(var(--card-bg))] rounded-lg p-4 border border-[rgb(var(--card-border))]">
                    <h3 className="text-lg font-semibold mb-4 text-white">Technical Indicators</h3>
                    <TechnicalIndicators
                      selectedIndicators={selectedIndicators}
                      onChange={handleIndicatorChange}
                    />
                  </div>
                </div>
              </div>

              <div id="backtesting" className={`bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] ${activeSection !== 'backtesting' ? 'hidden' : ''}`}>
                <Backtesting symbol={symbol} />
              </div>

              <div id="recommendations" className={`bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] ${activeSection !== 'recommendations' ? 'hidden' : ''}`}>
                <StockRecommendations />
              </div>

              <div id="support-resistance" className={`bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] ${activeSection !== 'support-resistance' ? 'hidden' : ''}`}>
                <SupportResistance data={stockData} />
              </div>

              <div id="fibonacci" className={`bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] ${activeSection !== 'fibonacci' ? 'hidden' : ''}`}>
                <FibonacciRetracement />
              </div>

              <div id="risk" className={`bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] ${activeSection !== 'risk' ? 'hidden' : ''}`}>
                <RiskManagement data={stockData} />
              </div>

              <div id="dca" className={`bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] ${activeSection !== 'dca' ? 'hidden' : ''}`}>
                <DCARecommendation data={stockData} />
              </div>

              <div id="orderbook" className={`bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] ${activeSection !== 'orderbook' ? 'hidden' : ''}`}>
                <OrderBookComponent symbol={symbol} />
              </div>

              <div id="alerts" className={`bg-[rgb(var(--card-bg))] rounded-xl p-6 shadow-lg border border-[rgb(var(--card-border))] ${activeSection !== 'alerts' ? 'hidden' : ''}`}>
                <PriceAlert symbol={symbol} />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  )
} 