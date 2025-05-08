'use client';

import { useState } from 'react';
import RealTimeStockData from '@/components/RealTimeStockData';

const DEFAULT_SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META'];

export default function StocksPage() {
  const [symbols, setSymbols] = useState(DEFAULT_SYMBOLS);
  const [newSymbol, setNewSymbol] = useState('');

  const handleAddSymbol = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSymbol && !symbols.includes(newSymbol.toUpperCase())) {
      setSymbols([...symbols, newSymbol.toUpperCase()]);
      setNewSymbol('');
    }
  };

  const handleRemoveSymbol = (symbolToRemove: string) => {
    setSymbols(symbols.filter(symbol => symbol !== symbolToRemove));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Real-Time Stock Data</h1>

      <form onSubmit={handleAddSymbol} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            placeholder="Enter stock symbol (e.g., AAPL)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add Stock
          </button>
        </div>
      </form>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Active Symbols</h2>
        <div className="flex flex-wrap gap-2">
          {symbols.map((symbol) => (
            <div
              key={symbol}
              className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full"
            >
              <span>{symbol}</span>
              <button
                onClick={() => handleRemoveSymbol(symbol)}
                className="text-gray-500 hover:text-red-500"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      <RealTimeStockData symbols={symbols} />
    </div>
  );
} 