import { NextResponse } from 'next/server';

// Static data for export
const staticData = {
  symbol: 'AAPL',
  data: [
    {
      date: new Date().toISOString(),
      open: 150.0,
      high: 155.0,
      low: 149.0,
      close: 153.0,
      volume: 1000000
    }
  ],
  info: {
    companyName: 'Apple Inc.',
    currentPrice: 153.0,
    marketCap: 2500000000000,
    peRatio: 25.0,
    dividendYield: 0.5,
    beta: 1.2,
    eps: 6.0,
    sector: 'Technology',
    industry: 'Consumer Electronics'
  }
};

export async function GET() {
  return NextResponse.json(staticData);
} 