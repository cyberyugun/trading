import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="container mx-auto py-12 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">Welcome to Trading Analysis</h1>
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-lg mb-8">
          Your comprehensive platform for stock market analysis and trading insights.
        </p>
        <Link 
          href="/stocks"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          View Stock Data
        </Link>
      </div>
    </div>
  );
} 