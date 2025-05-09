import React, { useState, useEffect } from 'react';
import { getInvestmentRecommendations, getSwingTradingRecommendations } from '../services/stockRecommendation';

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
  };
}

const StockRecommendations: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'investment' | 'swing'>('investment');
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = activeTab === 'investment'
          ? await getInvestmentRecommendations()
          : await getSwingTradingRecommendations();
        setRecommendations(data);
      } catch (err) {
        setError('Failed to fetch recommendations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [activeTab]);

  const formatMarketCap = (marketCap: number) => {
    if (marketCap >= 1e12) return `${(marketCap / 1e12).toFixed(2)}T`;
    if (marketCap >= 1e9) return `${(marketCap / 1e9).toFixed(2)}B`;
    if (marketCap >= 1e6) return `${(marketCap / 1e6).toFixed(2)}M`;
    return marketCap.toString();
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg">
      <div className="flex space-x-4 mb-6">
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'investment'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setActiveTab('investment')}
        >
          Investment Recommendations
        </button>
        <button
          className={`px-4 py-2 rounded-lg ${
            activeTab === 'swing'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700'
          }`}
          onClick={() => setActiveTab('swing')}
        >
          Swing Trading Recommendations
        </button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-center py-4">{error}</div>
      )}

      {!loading && !error && (
        <div className="grid gap-4">
          {recommendations.map((stock) => (
            <div key={stock.symbol} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{stock.symbol}</h3>
                  <p className="text-gray-600">{stock.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${stock.price.toFixed(2)}</p>
                  <p className={`font-medium ${
                    stock.recommendation.includes('Buy') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.recommendation}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                {activeTab === 'investment' ? (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">P/E Ratio</p>
                      <p className="font-medium">{stock.metrics.peRatio?.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Dividend Yield</p>
                      <p className="font-medium">{(stock.metrics.dividendYield || 0).toFixed(2)}%</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Volatility</p>
                      <p className="font-medium">{(stock.metrics.volatility || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Momentum</p>
                      <p className="font-medium">{(stock.metrics.momentum || 0).toFixed(2)}</p>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Market Cap</p>
                  <p className="font-medium">${formatMarketCap(stock.metrics.marketCap || 0)}</p>
                </div>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">Confidence</p>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${stock.confidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockRecommendations; 