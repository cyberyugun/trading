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

export default function Home() {
  const [timeframe, setTimeframe] = useState<TimeInterval>('1d')
  const [range, setRange] = useState<TimeRange>('1mo')
  const [symbol, setSymbol] = useState('BBCA.JK') // Default to BCA stock
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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await getHistoricalData(symbol, timeframe, range)
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

    fetchData()
  }, [symbol, timeframe, range])

  const handleSearch = () => {
    if (searchQuery.length >= 2) {
      searchStocks(searchQuery)
        .then(results => {
          setSearchResults(results)
        })
        .catch(error => {
          console.error('Error searching stocks:', error)
          setError('Failed to search stocks')
        })
    }
  }

  const handleSelectResult = (result: SearchResult) => {
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

  return (
    <main className="min-h-screen bg-primary text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="bg-secondary rounded-lg p-6 shadow-lg">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <div className="flex items-center bg-primary rounded-lg border border-gray-700 focus-within:border-blue-500 transition-colors">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Enter stock symbol"
                    className="w-full px-4 py-3 bg-transparent text-white placeholder-gray-400 focus:outline-none"
                  />
                  <button
                    onClick={handleSearch}
                    className="px-4 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    <FiSearch className="w-5 h-5" />
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-secondary rounded-lg shadow-lg z-10 border border-gray-700">
                    {searchResults.map((result) => (
                      <button
                        key={result.symbol}
                        onClick={() => handleSelectResult(result)}
                        className="w-full px-4 py-3 text-left hover:bg-primary/50 flex flex-col border-b border-gray-700 last:border-0 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{result.symbol}</span>
                          <span className="text-xs text-gray-400">{result.exchange}</span>
                        </div>
                        <span className="text-sm text-gray-400">{result.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {error && (
                <div className="mt-2 text-red-500 text-sm">{error}</div>
              )}
            </div>
            <div className="w-full md:w-auto">
              <TimeframeSelector 
                selected={timeframe} 
                range={range}
                onChange={setTimeframe} 
                onRangeChange={setRange}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <Chart data={stockData} selectedIndicators={selectedIndicators} />
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <TechnicalIndicators
                onChange={handleIndicatorChange}
                selectedIndicators={selectedIndicators}
              />
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <VolumeAnalysis symbol={symbol} />
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <Backtesting symbol={symbol} />
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <StockRecommendations />
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <SupportResistance data={stockData} />
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <FibonacciRetracement />
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <RiskManagement data={stockData} />
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <DCARecommendation data={stockData} />
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <OrderBookComponent symbol={symbol} />
            </div>
            <div className="bg-secondary rounded-lg p-6 shadow-lg">
              <PriceAlert symbol={symbol} />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 