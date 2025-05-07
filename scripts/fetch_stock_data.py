import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import argparse
import os
import json
from typing import Dict, List, Optional, Tuple

def calculate_technical_indicators(df):
    """Calculate technical indicators for the stock data"""
    # Calculate Moving Averages
    df['SMA_20'] = df['Close'].rolling(window=20).mean()
    df['SMA_50'] = df['Close'].rolling(window=50).mean()
    df['SMA_200'] = df['Close'].rolling(window=200).mean()
    
    # Calculate RSI (Relative Strength Index)
    delta = df['Close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['RSI'] = 100 - (100 / (1 + rs))
    
    # Calculate MACD (Moving Average Convergence Divergence)
    exp1 = df['Close'].ewm(span=12, adjust=False).mean()
    exp2 = df['Close'].ewm(span=26, adjust=False).mean()
    df['MACD'] = exp1 - exp2
    df['Signal_Line'] = df['MACD'].ewm(span=9, adjust=False).mean()
    df['MACD_Histogram'] = df['MACD'] - df['Signal_Line']
    
    # Calculate Bollinger Bands
    df['BB_Middle'] = df['Close'].rolling(window=20).mean()
    df['BB_Upper'] = df['BB_Middle'] + 2 * df['Close'].rolling(window=20).std()
    df['BB_Lower'] = df['BB_Middle'] - 2 * df['Close'].rolling(window=20).std()
    
    # Calculate Stochastic Oscillator
    low_min = df['Low'].rolling(window=14).min()
    high_max = df['High'].rolling(window=14).max()
    df['Stoch_K'] = 100 * ((df['Close'] - low_min) / (high_max - low_min))
    df['Stoch_D'] = df['Stoch_K'].rolling(window=3).mean()
    
    # Calculate Average True Range (ATR)
    high_low = df['High'] - df['Low']
    high_close = np.abs(df['High'] - df['Close'].shift())
    low_close = np.abs(df['Low'] - df['Close'].shift())
    ranges = pd.concat([high_low, high_close, low_close], axis=1)
    true_range = np.max(ranges, axis=1)
    df['ATR'] = true_range.rolling(window=14).mean()
    
    # Calculate On-Balance Volume (OBV)
    df['OBV'] = (np.sign(df['Close'].diff()) * df['Volume']).fillna(0).cumsum()
    
    return df

def get_options_data(ticker: yf.Ticker, expiration_date: Optional[str] = None) -> Dict:
    """Fetch options data for a given stock"""
    try:
        if expiration_date:
            options = ticker.option_chain(expiration_date)
        else:
            # Get the next expiration date
            expiration_dates = ticker.options
            if not expiration_dates:
                return None
            options = ticker.option_chain(expiration_dates[0])
        
        return {
            'calls': options.calls.to_dict('records'),
            'puts': options.puts.to_dict('records'),
            'expiration_date': expiration_date or expiration_dates[0]
        }
    except Exception as e:
        print(f"Error fetching options data: {str(e)}")
        return None

def get_stock_data(symbol: str, period: str = "1d", interval: str = "1m", include_options: bool = False) -> Tuple[Optional[pd.DataFrame], Optional[Dict], Optional[Dict]]:
    """
    Fetch stock data from Yahoo Finance
    
    Parameters:
    symbol (str): Stock symbol (e.g., 'AAPL' for Apple)
    period (str): Time period to fetch (e.g., '1d', '5d', '1mo', '1y')
    interval (str): Data interval (e.g., '1m', '5m', '15m', '1h', '1d')
    include_options (bool): Whether to include options data
    
    Returns:
    Tuple[pd.DataFrame, Dict, Dict]: Stock data, additional info, and options data
    """
    try:
        # Create a Ticker object
        ticker = yf.Ticker(symbol)
        
        # Get historical data
        data = ticker.history(period=period, interval=interval)
        
        # Calculate technical indicators
        data = calculate_technical_indicators(data)
        
        # Get additional info
        info = ticker.info
        additional_info = {
            'Company Name': info.get('longName', ''),
            'Current Price': info.get('currentPrice', ''),
            'Market Cap': info.get('marketCap', ''),
            '52 Week High': info.get('fiftyTwoWeekHigh', ''),
            '52 Week Low': info.get('fiftyTwoWeekLow', ''),
            'Volume': info.get('volume', ''),
            'PE Ratio': info.get('trailingPE', ''),
            'Dividend Yield': info.get('dividendYield', ''),
            'Beta': info.get('beta', ''),
            'EPS': info.get('trailingEps', ''),
            'Forward PE': info.get('forwardPE', ''),
            'PEG Ratio': info.get('pegRatio', ''),
            'Profit Margins': info.get('profitMargins', ''),
            'Operating Margins': info.get('operatingMargins', ''),
            'Return on Equity': info.get('returnOnEquity', ''),
            'Revenue Growth': info.get('revenueGrowth', ''),
            'Debt to Equity': info.get('debtToEquity', ''),
            'Quick Ratio': info.get('quickRatio', ''),
            'Current Ratio': info.get('currentRatio', ''),
            'Sector': info.get('sector', ''),
            'Industry': info.get('industry', ''),
            'Options Available': bool(ticker.options)
        }
        
        # Get options data if requested
        options_data = None
        if include_options and ticker.options:
            options_data = get_options_data(ticker)
        
        # Reset index to make Date a column
        data = data.reset_index()
        
        # Convert datetime to string format
        data['Date'] = data['Date'].dt.strftime('%Y-%m-%d %H:%M:%S')
        
        return data, additional_info, options_data
    except Exception as e:
        print(f"Error fetching data for {symbol}: {str(e)}")
        return None, None, None

def save_data(data: Optional[pd.DataFrame], additional_info: Optional[Dict], 
             options_data: Optional[Dict], symbol: str, output_dir: str = "stock_data"):
    """Save stock data and info to CSV files"""
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    # Save price data
    if data is not None:
        data_filename = os.path.join(output_dir, f"{symbol}_price_data_{timestamp}.csv")
        data.to_csv(data_filename, index=False)
        print(f"Price data saved to {data_filename}")
    
    # Save additional info
    if additional_info is not None:
        info_filename = os.path.join(output_dir, f"{symbol}_info_{timestamp}.csv")
        pd.DataFrame([additional_info]).to_csv(info_filename, index=False)
        print(f"Additional info saved to {info_filename}")
    
    # Save options data
    if options_data is not None:
        options_filename = os.path.join(output_dir, f"{symbol}_options_{timestamp}.json")
        with open(options_filename, 'w') as f:
            json.dump(options_data, f, indent=2)
        print(f"Options data saved to {options_filename}")

def main():
    parser = argparse.ArgumentParser(description='Fetch stock data from Yahoo Finance')
    parser.add_argument('--symbols', nargs='+', default=['AAPL'], help='Stock symbols to fetch (e.g., AAPL MSFT GOOGL)')
    parser.add_argument('--period', default='1d', help='Time period (e.g., 1d, 5d, 1mo, 1y)')
    parser.add_argument('--interval', default='1m', help='Data interval (e.g., 1m, 5m, 15m, 1h, 1d)')
    parser.add_argument('--output-dir', default='stock_data', help='Output directory for CSV files')
    parser.add_argument('--include-options', action='store_true', help='Include options data in the output')
    
    args = parser.parse_args()
    
    print(f"Fetching data for symbols: {', '.join(args.symbols)}")
    print(f"Period: {args.period}, Interval: {args.interval}")
    if args.include_options:
        print("Including options data")
    
    for symbol in args.symbols:
        print(f"\nProcessing {symbol}...")
        data, additional_info, options_data = get_stock_data(
            symbol, args.period, args.interval, args.include_options
        )
        
        if data is not None:
            print(f"\nStock data for {symbol}:")
            print(data.head())
            
            if additional_info:
                print("\nAdditional Information:")
                for key, value in additional_info.items():
                    print(f"{key}: {value}")
            
            if options_data:
                print("\nOptions Data Available:")
                print(f"Expiration Date: {options_data['expiration_date']}")
                print(f"Number of Calls: {len(options_data['calls'])}")
                print(f"Number of Puts: {len(options_data['puts'])}")
            
            save_data(data, additional_info, options_data, symbol, args.output_dir)

if __name__ == "__main__":
    main() 