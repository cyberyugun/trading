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
import { FiSearch } from 'react-icons/fi'
import { searchStocks, SearchResult } from '@/lib/yahooFinance'
import { TimeInterval, TimeRange } from '@/types/timeframe'

export default function Home() {
  const [timeframe, setTimeframe] = useState<TimeInterval>('1d')
  const [range, setRange] = useState<TimeRange>('1mo')
  const [symbol, setSymbol] = useState('AAPL') // Default to Apple stock
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([])
        return
      }

      try {
        setIsSearching(true)
        const results = await searchStocks(searchQuery)
        setSearchResults(results)
        setError(null)
      } catch (err) {
        setError('Failed to search stocks')
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }

    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(fetchSearchResults, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchQuery])

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setError('Please enter a stock symbol')
      return
    }
    setSymbol(searchQuery.trim().toUpperCase())
    setError(null)
    setSearchResults([])
  }

  const handleSelectResult = (result: SearchResult) => {
    setSearchQuery(result.symbol)
    setSymbol(result.symbol)
    setSearchResults([])
    setError(null)
  }

  return (
    <main className="min-h-screen bg-primary text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold">Stock Analysis</h1>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search stock symbol or name"
                className="px-4 py-2 bg-secondary rounded text-white pr-10"
              />
              <button
                onClick={handleSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <FiSearch className="w-5 h-5" />
              </button>
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-secondary rounded shadow-lg z-10">
                  {searchResults.map((result) => (
                    <button
                      key={result.symbol}
                      onClick={() => handleSelectResult(result)}
                      className="w-full px-4 py-2 text-left hover:bg-secondary-hover flex flex-col border-b border-gray-700 last:border-0"
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
              <div className="text-red-500 text-sm">{error}</div>
            )}
            <TimeframeSelector 
              selected={timeframe} 
              range={range}
              onChange={setTimeframe} 
              onRangeChange={setRange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Chart timeframe={timeframe} range={range} symbol={symbol} />
            <TechnicalIndicators
              selected={selectedIndicators}
              onChange={setSelectedIndicators}
            />
            <VolumeAnalysis symbol={symbol} />
            <Backtesting symbol={symbol} />
          </div>

          <div className="space-y-8">
            <SupportResistance symbol={symbol} />
            <FibonacciRetracement />
            <RiskManagement symbol={symbol} />
            <PriceAlert symbol={symbol} />
          </div>
        </div>
      </div>
    </main>
  )
} 