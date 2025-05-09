import React, { useState, useEffect } from 'react';
import { getInvestmentRecommendations, getSwingTradingRecommendations } from '@/services/stockRecommendation';
import { motion, AnimatePresence } from 'framer-motion';

interface StockRecommendation {
  symbol: string;
  name: string;
  price: number;
  recommendation: string;
  confidence: number;
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

const StockRecommendations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'investment' | 'swing'>('investment');
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
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
        setRetryCount(0); // Reset retry count on success
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch recommendations';
        setError(errorMessage);
        console.error('Error fetching recommendations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [activeTab, retryCount]); // Add retryCount to dependencies

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
    switch (recommendation) {
      case 'Strong Buy':
      case 'Swing Buy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Buy':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Neutral':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Avoid':
      case 'Swing Sell':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMetricColor = (value: number, type: 'positive' | 'negative' | 'neutral') => {
    if (type === 'positive') return value > 0 ? 'text-green-600' : 'text-red-600';
    if (type === 'negative') return value < 0 ? 'text-green-600' : 'text-red-600';
    return 'text-gray-600';
  };

  const renderMetrics = (metrics: StockRecommendation['metrics'], type: 'investment' | 'swing') => {
    if (type === 'investment') {
      return (
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">P/E Ratio:</span>
            <span className={getMetricColor(metrics.peRatio || 0, 'positive')}>
              {metrics.peRatio?.toFixed(2) || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Dividend Yield:</span>
            <span className={getMetricColor(metrics.dividendYield || 0, 'positive')}>
              {(metrics.dividendYield ? (metrics.dividendYield * 100).toFixed(2) + '%' : 'N/A')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Market Cap:</span>
            <span className="text-gray-700">${formatMarketCap(metrics.marketCap || 0)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Beta:</span>
            <span className={getMetricColor(metrics.beta || 0, 'neutral')}>
              {metrics.beta?.toFixed(2) || 'N/A'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Profit Margin:</span>
            <span className={getMetricColor(metrics.profitMargin || 0, 'positive')}>
              {(metrics.profitMargin ? (metrics.profitMargin * 100).toFixed(2) + '%' : 'N/A')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Debt/Equity:</span>
            <span className={getMetricColor(metrics.debtToEquity || 0, 'negative')}>
              {metrics.debtToEquity?.toFixed(2) || 'N/A'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">RSI:</span>
          <span className={getMetricColor(metrics.rsi || 0, 'neutral')}>
            {metrics.rsi?.toFixed(2) || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">MACD:</span>
          <span className={getMetricColor(metrics.macd || 0, 'positive')}>
            {metrics.macd?.toFixed(2) || 'N/A'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Volume Change:</span>
          <span className={getMetricColor(metrics.volumeChange || 0, 'positive')}>
            {(metrics.volumeChange ? (metrics.volumeChange * 100).toFixed(2) + '%' : 'N/A')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Volatility:</span>
          <span className={getMetricColor(metrics.volatility || 0, 'negative')}>
            {(metrics.volatility ? (metrics.volatility * 100).toFixed(2) + '%' : 'N/A')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Momentum:</span>
          <span className={getMetricColor(metrics.momentum || 0, 'positive')}>
            {(metrics.momentum ? (metrics.momentum * 100).toFixed(2) + '%' : 'N/A')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">ADX:</span>
          <span className={getMetricColor(metrics.adx || 0, 'positive')}>
            {metrics.adx?.toFixed(2) || 'N/A'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Stock Recommendations</h2>
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('investment')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'investment'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Investment
            </button>
            <button
              onClick={() => setActiveTab('swing')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'swing'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Swing Trading
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-center p-4">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
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
              className="space-y-4"
            >
              {recommendations.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No recommendations available at this time.
                </div>
              ) : (
                recommendations.map((stock) => (
                  <motion.div
                    key={stock.symbol}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{stock.symbol}</h3>
                        <p className="text-sm text-gray-500">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">${stock.price.toFixed(2)}</p>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getRecommendationColor(stock.recommendation)}`}>
                          {stock.recommendation}
                        </span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-500">Confidence</span>
                        <span className="text-sm font-medium text-gray-700">
                          {(stock.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${stock.confidence * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {renderMetrics(stock.metrics, activeTab)}
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