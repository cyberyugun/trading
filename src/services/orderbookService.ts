import { OrderBook, OrderBookAnalysis } from '../types/orderbook';

export class OrderBookService {
  private static instance: OrderBookService;
  private ws: WebSocket | null = null;
  private subscribers: ((data: OrderBook) => void)[] = [];

  private constructor() {}

  static getInstance(): OrderBookService {
    if (!OrderBookService.instance) {
      OrderBookService.instance = new OrderBookService();
    }
    return OrderBookService.instance;
  }

  connect(symbol: string) {
    // Replace with your actual WebSocket endpoint
    this.ws = new WebSocket(`wss://api.example.com/orderbook/${symbol}`);
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data) as OrderBook;
      this.subscribers.forEach(callback => callback(data));
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  subscribe(callback: (data: OrderBook) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  analyzeOrderBook(orderBook: OrderBook): OrderBookAnalysis {
    const totalBidVolume = orderBook.bids.reduce((sum, bid) => sum + bid.quantity, 0);
    const totalAskVolume = orderBook.asks.reduce((sum, ask) => sum + ask.quantity, 0);
    
    const bestBid = orderBook.bids[0]?.price || 0;
    const bestAsk = orderBook.asks[0]?.price || 0;
    const bidAskSpread = bestAsk - bestBid;
    
    const bidAskRatio = totalBidVolume / totalAskVolume;
    
    let pricePressure: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (bidAskRatio > 1.2) pricePressure = 'bullish';
    else if (bidAskRatio < 0.8) pricePressure = 'bearish';
    
    const totalVolume = totalBidVolume + totalAskVolume;
    let liquidityLevel: 'high' | 'medium' | 'low' = 'medium';
    if (totalVolume > 1000000) liquidityLevel = 'high';
    else if (totalVolume < 100000) liquidityLevel = 'low';

    return {
      bidAskSpread,
      totalBidVolume,
      totalAskVolume,
      bidAskRatio,
      pricePressure,
      liquidityLevel
    };
  }
} 