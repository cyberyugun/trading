export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
}

export interface OrderBookAnalysis {
  bidAskSpread: number;
  totalBidVolume: number;
  totalAskVolume: number;
  bidAskRatio: number;
  pricePressure: 'bullish' | 'bearish' | 'neutral';
  liquidityLevel: 'high' | 'medium' | 'low';
} 