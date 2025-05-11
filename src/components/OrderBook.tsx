import React, { useEffect, useState } from 'react';
import { OrderBook, OrderBookAnalysis } from '../types/orderbook';
import { OrderBookService } from '../services/orderbookService';

interface OrderBookProps {
  symbol: string;
}

export const OrderBookComponent: React.FC<OrderBookProps> = ({ symbol }) => {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [analysis, setAnalysis] = useState<OrderBookAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const orderBookService = OrderBookService.getInstance();
    setIsLoading(true);
    setError(null);

    try {
      orderBookService.connect(symbol);

      const unsubscribe = orderBookService.subscribe((data) => {
        setOrderBook(data);
        setAnalysis(orderBookService.analyzeOrderBook(data));
        setIsLoading(false);
      });

      return () => {
        unsubscribe();
        orderBookService.disconnect();
      };
    } catch (err) {
      setError('Failed to connect to orderbook');
      setIsLoading(false);
    }
  }, [symbol]);

  if (isLoading) {
    return (
      <div className="bg-gray-900 text-white p-4 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-900 text-white p-4 rounded-lg">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!orderBook || !analysis) {
    return null;
  }

  return (
    <div className="bg-[rgb(var(--card-bg))] text-white p-4 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        {/* Analysis Section */}
        <div className="col-span-2 bg-[rgb(var(--card-bg))] p-4 rounded-lg mb-4 border border-[rgb(var(--card-border))]">
          <h3 className="text-lg font-semibold mb-2">Market Analysis</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[rgb(var(--card-bg))] p-3 rounded border border-[rgb(var(--card-border))]">
              <div className="text-sm text-gray-400">Price Pressure</div>
              <div className={`text-lg font-bold ${
                analysis.pricePressure === 'bullish' ? 'text-green-500' :
                analysis.pricePressure === 'bearish' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
                {analysis.pricePressure.toUpperCase()}
              </div>
            </div>
            <div className="bg-[rgb(var(--card-bg))] p-3 rounded border border-[rgb(var(--card-border))]">
              <div className="text-sm text-gray-400">Liquidity</div>
              <div className={`text-lg font-bold ${
                analysis.liquidityLevel === 'high' ? 'text-green-500' :
                analysis.liquidityLevel === 'low' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
                {analysis.liquidityLevel.toUpperCase()}
              </div>
            </div>
            <div className="bg-[rgb(var(--card-bg))] p-3 rounded border border-[rgb(var(--card-border))]">
              <div className="text-sm text-gray-400">Spread</div>
              <div className="text-lg font-bold">{analysis.bidAskSpread.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Order Book Section */}
        <div className="grid grid-cols-2 gap-4">
          {/* Bids */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-green-500">Bids</h3>
            <div className="space-y-1">
              {orderBook.bids.map((bid, index) => (
                <div key={index} className="flex justify-between bg-[rgb(var(--card-bg))] p-2 rounded border border-[rgb(var(--card-border))]">
                  <span className="text-green-500">{bid.price.toFixed(2)}</span>
                  <span>{bid.quantity.toLocaleString()}</span>
                  <span className="text-gray-400">{bid.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Asks */}
          <div>
            <h3 className="text-lg font-semibold mb-2 text-red-500">Asks</h3>
            <div className="space-y-1">
              {orderBook.asks.map((ask, index) => (
                <div key={index} className="flex justify-between bg-[rgb(var(--card-bg))] p-2 rounded border border-[rgb(var(--card-border))]">
                  <span className="text-red-500">{ask.price.toFixed(2)}</span>
                  <span>{ask.quantity.toLocaleString()}</span>
                  <span className="text-gray-400">{ask.total.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 