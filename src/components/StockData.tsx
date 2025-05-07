'use client';

import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface StockData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockInfo {
  companyName: string;
  currentPrice: number;
  marketCap: number;
  peRatio: number;
  dividendYield: number;
  beta: number;
  eps: number;
  sector: string;
  industry: string;
}

interface StockResponse {
  symbol: string;
  data: StockData[];
  info: StockInfo;
  options: any;
}

export default function StockData() {
  const [symbol, setSymbol] = useState('AAPL');
  const [period, setPeriod] = useState('1d');
  const [interval, setInterval] = useState('1m');
  const [stockData, setStockData] = useState<StockResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStockData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/stocks?symbol=${symbol}&period=${period}&interval=${interval}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch stock data');
      }
      const data = await response.json();
      setStockData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, [symbol, period, interval]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            className="border p-2 rounded"
            placeholder="Stock Symbol"
          />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="1d">1 Day</option>
            <option value="5d">5 Days</option>
            <option value="1mo">1 Month</option>
            <option value="3mo">3 Months</option>
            <option value="6mo">6 Months</option>
            <option value="1y">1 Year</option>
          </select>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="1m">1 Minute</option>
            <option value="5m">5 Minutes</option>
            <option value="15m">15 Minutes</option>
            <option value="1h">1 Hour</option>
            <option value="1d">1 Day</option>
          </select>
        </div>
      </div>

      {stockData && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-2">{stockData.info.companyName} ({stockData.symbol})</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600">Current Price</p>
                <p className="text-xl font-semibold">${stockData.info.currentPrice?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Market Cap</p>
                <p className="text-xl font-semibold">${(stockData.info.marketCap / 1e9).toFixed(2)}B</p>
              </div>
              <div>
                <p className="text-gray-600">P/E Ratio</p>
                <p className="text-xl font-semibold">{stockData.info.peRatio?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-600">Dividend Yield</p>
                <p className="text-xl font-semibold">{(stockData.info.dividendYield * 100)?.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-xl font-bold mb-4">Price Chart</h3>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockData.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="close"
                    stroke="#2563eb"
                    dot={false}
                    name="Price"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 