import { NextResponse } from 'next/server';

export const runtime = 'edge';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

// Add this line to prevent static generation
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';
  const interval = searchParams.get('interval') || '1m';
  const range = searchParams.get('period') || '1d';

  try {
    // Fetch quote data
    const quoteUrl = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v8/finance/quote?symbols=${symbol}`
    )}`;
    const quoteResponse = await fetch(quoteUrl);
    const quoteData = await quoteResponse.json();

    // Fetch historical data
    const chartUrl = `${CORS_PROXY}${encodeURIComponent(
      `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`
    )}`;
    const chartResponse = await fetch(chartUrl);
    const chartData = await chartResponse.json();

    if (!quoteData.quoteResponse?.result?.[0] || !chartData.chart?.result?.[0]) {
      throw new Error('Invalid response format');
    }

    const quote = quoteData.quoteResponse.result[0];
    const chart = chartData.chart.result[0];
    const timestamps = chart.timestamp;
    const quotes = chart.indicators.quote[0];

    // Format the response
    const response = {
      symbol,
      data: timestamps.map((timestamp: number, index: number) => ({
        date: new Date(timestamp * 1000).toISOString(),
        open: quotes.open[index] || 0,
        high: quotes.high[index] || 0,
        low: quotes.low[index] || 0,
        close: quotes.close[index] || 0,
        volume: quotes.volume[index] || 0
      })),
      info: {
        companyName: quote.longName,
        currentPrice: quote.regularMarketPrice,
        marketCap: quote.marketCap,
        peRatio: quote.trailingPE,
        dividendYield: quote.dividendYield,
        beta: quote.beta,
        eps: quote.epsTrailingTwelveMonths,
        sector: quote.sector,
        industry: quote.industry
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock data' },
      { status: 500 }
    );
  }
} 