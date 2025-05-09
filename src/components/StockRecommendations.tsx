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
        return 'text-green-600';
      case 'buy':
        return 'text-green-500';
      case 'hold':
        return 'text-yellow-500';
      case 'sell':
        return 'text-red-500';
      case 'strong sell':
        return 'text-red-600';
      default:
        return 'text-gray-500';
    }
  };

  const renderMetrics = (metrics: StockAnalysis['metrics'], type: 'investment' | 'swing') => {
    if (type === 'investment') {
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">P/E Ratio</p>
            <p className="font-medium">{metrics.peRatio?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dividend Yield</p>
            <p className="font-medium">{metrics.dividendYield?.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Market Cap</p>
            <p className="font-medium">${formatMarketCap(metrics.marketCap || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Profit Margin</p>
            <p className="font-medium">{metrics.profitMargin?.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Debt to Equity</p>
            <p className="font-medium">{metrics.debtToEquity?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Current Ratio</p>
            <p className="font-medium">{metrics.currentRatio?.toFixed(2)}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-500">RSI</p>
          <p className="font-medium">{metrics.rsi?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">MACD</p>
          <p className="font-medium">{metrics.macd?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Volume Change</p>
          <p className="font-medium">{metrics.volumeChange?.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Volatility</p>
          <p className="font-medium">{metrics.volatility?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Momentum</p>
          <p className="font-medium">{metrics.momentum?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">ATR</p>
          <p className="font-medium">{metrics.atr?.toFixed(2)}</p>
        </div>
      </div>
    );
  };

  const renderAnalysis = (analysis: StockAnalysis['analysis']) => {
    return (
      <div className="mt-4 space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Technical Analysis</h4>
          <p className="text-sm text-gray-600">{analysis.technical}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700">Fundamental Analysis</h4>
          <p className="text-sm text-gray-600">{analysis.fundamental}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700">Market Sentiment</h4>
          <p className="text-sm text-gray-600">{analysis.sentiment}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700">Risk Assessment</h4>
          <p className="text-sm text-gray-600">{analysis.risk}</p>
        </div>
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">AI Stock Recommendations</h2>
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{stock.symbol}</h3>
                        <p className="text-sm text-gray-500">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">${stock.price.toFixed(2)}</p>
                        <p className={`text-sm font-medium ${getRecommendationColor(stock.recommendation)}`}>
                          {stock.recommendation}
                        </p>
                        <p className="text-xs text-gray-500">Confidence: {stock.confidence}%</p>
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