import { OrderBook, OrderBookAnalysis } from '../types/orderbook';
import useWebSocketStore from './websocket';

export class OrderBookService {
  private static instance: OrderBookService;
  private subscribers: ((data: OrderBook) => void)[] = [];
  private mockData: OrderBook = {
    bids: [
      { price: 100.50, quantity: 1000, total: 100500 },
      { price: 100.45, quantity: 2000, total: 200900 },
      { price: 100.40, quantity: 1500, total: 150600 },
      { price: 100.35, quantity: 3000, total: 301050 },
      { price: 100.30, quantity: 2500, total: 250750 }
    ],
    asks: [
      { price: 100.55, quantity: 1200, total: 120660 },
      { price: 100.60, quantity: 1800, total: 181080 },
      { price: 100.65, quantity: 2200, total: 221430 },
      { price: 100.70, quantity: 1600, total: 161120 },
      { price: 100.75, quantity: 1900, total: 191425 }
    ],
    timestamp: Date.now()
  };

  private constructor() {}

  static getInstance(): OrderBookService {
    if (!OrderBookService.instance) {
      OrderBookService.instance = new OrderBookService();
    }
    return OrderBookService.instance;
  }

  connect(symbol: string) {
    const ws = useWebSocketStore.getState();
    
    // Connect to WebSocket if not already connected
    if (!ws.isConnected) {
      ws.connect('wss://api.example.com/ws'); // Replace with your actual WebSocket URL
    }

    // Subscribe to orderbook channel
    ws.subscribe(`orderbook.${symbol}`, (data) => {
      // For now, we'll use mock data and update it slightly
      this.updateMockData();
      this.subscribers.forEach(callback => callback(this.mockData));
    });
  }

  private updateMockData() {
    // Update mock data with small random variations
    this.mockData.bids = this.mockData.bids.map(bid => ({
      ...bid,
      quantity: Math.max(100, bid.quantity + Math.floor(Math.random() * 200 - 100)),
      price: bid.price + (Math.random() * 0.1 - 0.05)
    }));

    this.mockData.asks = this.mockData.asks.map(ask => ({
      ...ask,
      quantity: Math.max(100, ask.quantity + Math.floor(Math.random() * 200 - 100)),
      price: ask.price + (Math.random() * 0.1 - 0.05)
    }));

    // Update totals
    this.mockData.bids.forEach(bid => {
      bid.total = bid.price * bid.quantity;
    });
    this.mockData.asks.forEach(ask => {
      ask.total = ask.price * ask.quantity;
    });

    this.mockData.timestamp = Date.now();
  }

  subscribe(callback: (data: OrderBook) => void) {
    this.subscribers.push(callback);
    // Immediately send current data to new subscriber
    callback(this.mockData);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    const ws = useWebSocketStore.getState();
    ws.disconnect();
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