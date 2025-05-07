import StockData from '@/components/StockData';

export default function StocksPage() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">Stock Market Data</h1>
        <StockData />
      </div>
    </main>
  );
} 