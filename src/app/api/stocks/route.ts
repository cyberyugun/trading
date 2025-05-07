import { NextResponse } from 'next/server';
import yfinance from 'yfinance';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'AAPL';
  const period = searchParams.get('period') || '1d';
  const interval = searchParams.get('interval') || '1m';
  const includeOptions = searchParams.get('includeOptions') === 'true';

  try {
    // Create a Ticker object
    const ticker = yfinance.Ticker(symbol);
    
    // Get historical data
    const data = await ticker.history({ period, interval });
    
    // Get additional info
    const info = await ticker.info;
    
    // Get options data if requested
    let optionsData = null;
    if (includeOptions && ticker.options) {
      const expirationDates = await ticker.options;
      if (expirationDates.length > 0) {
        const options = await ticker.optionChain(expirationDates[0]);
        optionsData = {
          calls: options.calls,
          puts: options.puts,
          expirationDate: expirationDates[0]
        };
      }
    }

    // Format the response
    const response = {
      symbol,
      data: data.map(row => ({
        date: row.Date,
        open: row.Open,
        high: row.High,
        low: row.Low,
        close: row.Close,
        volume: row.Volume
      })),
      info: {
        companyName: info.longName,
        currentPrice: info.currentPrice,
        marketCap: info.marketCap,
        peRatio: info.trailingPE,
        dividendYield: info.dividendYield,
        beta: info.beta,
        eps: info.trailingEps,
        sector: info.sector,
        industry: info.industry
      },
      options: optionsData
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