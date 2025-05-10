import React, { useState, useEffect } from 'react';
import { getInvestmentRecommendations, getSwingTradingRecommendations } from '@/services/geminiAI';
import { motion, AnimatePresence } from 'framer-motion';

interface StockAnalysis {
  symbol: string;
  name: string;
  price: number;
  recommendation: string;
  confidence: number;
  analysis: {
    technical: string;
    fundamental: string;
    sentiment: string;
    risk: string;
  };
  metrics: {
    peRatio?: number;
    dividendYield?: number;
    marketCap?: number;
    volatility?: number;
    momentum?: number;
    rsi?: number;
    macd?: number;
    volumeChange?: number;
    beta?: number;
    bollingerUpper?: number;
    bollingerLower?: number;
    atr?: number;
    profitMargin?: number;
    debtToEquity?: number;
    currentRatio?: number;
    stochK?: number;
    stochD?: number;
    ichimokuCloud?: {
      conversionLine: number;
      baseLine: number;
      leadingSpanA: number;
      leadingSpanB: number;
    };
    obv?: number;
    roc?: number;
    eps?: number;
    revenueGrowth?: number;
    freeCashFlow?: number;
    williamsR?: number;
    mfi?: number;
    adx?: number;
    parabolicSAR?: number;
    keltnerUpper?: number;
    keltnerMiddle?: number;
    keltnerLower?: number;
    cmf?: number;
    rvi?: number;
    forceIndex?: number;
    bullPower?: number;
    bearPower?: number;
  };
}

// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800">Something went wrong</h3>
          <p className="mt-2 text-sm text-red-700">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Helper function to format price in Indonesian Rupiah
function formatIDR(price: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

const StockRecommendations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'investment' | 'swing'>('investment');
  const [recommendations, setRecommendations] = useState<StockAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = activeTab === 'investment' 
          ? await getInvestmentRecommendations()
          : await getSwingTradingRecommendations();
        setRecommendations(data);
        setRetryCount(0);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recommendations';
        setError(errorMessage);
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [activeTab, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `${(marketCap / 1e6).toFixed(2)}M`;
    return marketCap.toLocaleString();
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation.toLowerCase()) {
      case 'strong buy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'buy':
        return 'bg-green-50 text-green-700 border-green-100';
      case 'hold':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'sell':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'strong sell':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderMetrics = (metrics: StockAnalysis['metrics'], type: 'investment' | 'swing') => {
    if (type === 'investment') {
      return (
        <div className="space-y-6">
          <div>
            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Fundamental Metrics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">P/E Ratio</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.peRatio?.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">Dividend Yield</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.dividendYield?.toFixed(2)}%</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">Market Cap</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{formatIDR(metrics.marketCap || 0)}</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">Profit Margin</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.profitMargin?.toFixed(2)}%</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">Debt to Equity</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.debtToEquity?.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">Current Ratio</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.currentRatio?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Technical Indicators
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">RSI</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.rsi?.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">MACD</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.macd?.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">Volume Change</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.volumeChange?.toFixed(2)}%</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">Volatility</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.volatility?.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">Momentum</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.momentum?.toFixed(2)}</span>
              </div>
              <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <span className="text-xs md:text-sm text-gray-600 block mb-1">ATR</span>
                <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.atr?.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h4 className="text-base md:text-lg font-semibold text-gray-900 mb-3 flex items-center">
          <svg className="w-4 h-4 md:w-5 md:h-5 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          Technical Indicators
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
          <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <span className="text-xs md:text-sm text-gray-600 block mb-1">RSI</span>
            <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.rsi?.toFixed(2)}</span>
          </div>
          <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <span className="text-xs md:text-sm text-gray-600 block mb-1">MACD</span>
            <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.macd?.toFixed(2)}</span>
          </div>
          <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <span className="text-xs md:text-sm text-gray-600 block mb-1">Volume Change</span>
            <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.volumeChange?.toFixed(2)}%</span>
          </div>
          <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <span className="text-xs md:text-sm text-gray-600 block mb-1">Volatility</span>
            <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.volatility?.toFixed(2)}</span>
          </div>
          <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <span className="text-xs md:text-sm text-gray-600 block mb-1">Momentum</span>
            <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.momentum?.toFixed(2)}</span>
          </div>
          <div className="bg-white p-2 md:p-3 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <span className="text-xs md:text-sm text-gray-600 block mb-1">ATR</span>
            <span className="text-base md:text-lg font-semibold text-gray-900">{metrics.atr?.toFixed(2)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderAnalysis = (analysis: StockAnalysis['analysis']) => {
    return (
      <div className="mt-4 md:mt-6 space-y-3 md:space-y-4">
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-3 h-3 md:w-4 md:h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Technical Analysis
          </h4>
          <p className="text-xs md:text-sm text-gray-600">{analysis.technical}</p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-3 h-3 md:w-4 md:h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Fundamental Analysis
          </h4>
          <p className="text-xs md:text-sm text-gray-600">{analysis.fundamental}</p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-3 h-3 md:w-4 md:h-4 mr-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Market Sentiment
          </h4>
          <p className="text-xs md:text-sm text-gray-600">{analysis.sentiment}</p>
        </div>
        <div className="bg-white p-3 md:p-4 rounded-lg shadow-sm border border-gray-100">
          <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <svg className="w-3 h-3 md:w-4 md:h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Risk Assessment
          </h4>
          <p className="text-xs md:text-sm text-gray-600">{analysis.risk}</p>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="bg-white rounded-xl shadow-lg p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center">
            <svg className="w-5 h-5 md:w-6 md:h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            AI Stock Recommendations
          </h2>
          <div className="w-full md:w-auto flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('investment')}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                activeTab === 'investment'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Investment
            </button>
            <button
              onClick={() => setActiveTab('swing')}
              className={`flex-1 md:flex-none px-3 md:px-4 py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-200 ${
                activeTab === 'swing'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              Swing Trading
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-48 md:h-64">
            <div className="animate-spin rounded-full h-8 w-8 md:h-12 md:w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center p-6 md:p-8 bg-red-50 rounded-lg">
            <svg className="w-8 h-8 md:w-12 md:h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm md:text-base text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-3 md:px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm md:text-base"
            >
              Retry
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 md:space-y-6"
            >
              {recommendations.length === 0 ? (
                <div className="text-center text-gray-500 py-8 md:py-12 bg-gray-50 rounded-lg">
                  <svg className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-base md:text-lg">No recommendations available at this time.</p>
                </div>
              ) : (
                recommendations.map((stock) => (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 md:mb-6">
                      <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900">{stock.symbol}</h3>
                        <p className="text-xs md:text-sm text-gray-600">{stock.name}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xl md:text-2xl font-bold text-gray-900">{formatIDR(stock.price)}</p>
                        <span className={`inline-block px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium border ${getRecommendationColor(stock.recommendation)}`}>
                          {stock.recommendation}
                        </span>
                        <p className="text-xs text-gray-500 mt-1">Confidence: {stock.confidence}%</p>
                      </div>
                    </div>

                    {renderMetrics(stock.metrics, activeTab)}
                    {renderAnalysis(stock.analysis)}
                  </motion.div>
                ))
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default StockRecommendations; 