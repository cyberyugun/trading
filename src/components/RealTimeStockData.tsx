'use client';

import { useEffect } from 'react';
import { useWebSocket } from './WebSocketProvider';

interface RealTimeStockDataProps {
  symbols: string[];
}

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: number;
}

export default function RealTimeStockData({ symbols }: RealTimeStockDataProps) {
  const { isConnected, messages, subscribe, unsubscribe } = useWebSocket();

  useEffect(() => {
    // Subscribe to each symbol's channel
    symbols.forEach(symbol => {
      subscribe(`stock-${symbol}`, (data) => {
        console.log(`Received data for ${symbol}:`, data);
      });
    });

    return () => {
      // Unsubscribe from all symbol channels
      symbols.forEach(symbol => {
        unsubscribe(`stock-${symbol}`);
      });
    };
  }, [symbols]);

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-gray-600">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {symbols.map((symbol) => {
          const channelMessages = messages[`stock-${symbol}`] || [];
          const latestMessage = channelMessages[channelMessages.length - 1];
          const data = latestMessage?.data as StockData | undefined;

          if (!data) return null;

          return (
            <div
              key={symbol}
              className="p-4 bg-white rounded-lg shadow-md border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{symbol}</h3>
                  <p className="text-2xl font-bold">${data.price.toFixed(2)}</p>
                </div>
                <div className={`text-right ${data.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  <p className="font-medium">
                    {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}
                  </p>
                  <p className="text-sm">
                    {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                <p>Volume: {data.volume.toLocaleString()}</p>
                <p>Last Update: {new Date(data.timestamp).toLocaleTimeString()}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 