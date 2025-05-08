import Link from 'next/link';
import WebSocketExample from '@/components/WebSocketExample'

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">WebSocket Example</h1>
      <WebSocketExample />
    </div>
  );
} 