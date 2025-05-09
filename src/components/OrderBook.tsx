import React, { useEffect, useState } from 'react';
import { OrderBook, OrderBookAnalysis } from '../types/orderbook';
import { OrderBookService } from '../services/orderbookService';

interface OrderBookProps {
  symbol: string;
}

export const OrderBookComponent: React.FC<OrderBookProps> = ({ symbol }) => {
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [analysis, setAnalysis] = useState<OrderBookAnalysis | null>(null);

  useEffect(() => {
    const orderBookService = OrderBookService.getInstance();
    orderBookService.connect(symbol);

    const unsubscribe = orderBookService.subscribe((data) => {
      setOrderBook(data);
      setAnalysis(orderBookService.analyzeOrderBook(data));
    });

    return () => {
      unsubscribe();
      orderBookService.disconnect();
    };
  }, [symbol]);

  if (!orderBook || !analysis) {
    return <div className="p-4">Loading orderbook...</div>;
  }

  return (
    <div className="bg-gray-900 text-white p-4 rounded-lg">
      <div className="grid grid-cols-2 gap-4">
        {/* Analysis Section */}
        <div className="col-span-2 bg-gray-800 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-semibold mb-2">Market Analysis</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Price Pressure</div>
              <div className={`text-lg font-bold ${
                analysis.pricePressure === 'bullish' ? 'text-green-500' :
                analysis.pricePressure === 'bearish' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
                {analysis.pricePressure.toUpperCase()}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Liquidity</div>
              <div className={`text-lg font-bold ${
                analysis.liquidityLevel === 'high' ? 'text-green-500' :
                analysis.liquidityLevel === 'low' ? 'text-red-500' :
                'text-yellow-500'
              }`}>
                {analysis.liquidityLevel.toUpperCase()}
              </div>
            </div>
            <div className="bg-gray-700 p-3 rounded">
              <div className="text-sm text-gray-400">Spread</div>
              <div className="text-lg font-bold">{analysis.bidAskSpread.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Order Book Section */}
        <div className="col-span-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Bids */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-green-500">Bids</h3>
              <div className="space-y-1">
                {orderBook.bids.slice(0, 10).map((bid, index) => (
                  <div key={index} className="flex justify-between bg-gray-800 p-2 rounded">
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
                {orderBook.asks.slice(0, 10).map((ask, index) => (
                  <div key={index} className="flex justify-between bg-gray-800 p-2 rounded">
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
    </div>
  );
}; 