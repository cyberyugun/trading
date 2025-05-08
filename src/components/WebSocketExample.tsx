'use client';

import { useEffect, useState } from 'react';
import { useWebSocket } from './WebSocketProvider';

export default function WebSocketExample() {
  const { isConnected, messages, send, subscribe, unsubscribe } = useWebSocket();
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Subscribe to the 'chat' channel when component mounts
    subscribe('chat', (data) => {
      console.log('Received message:', data);
    });

    // Cleanup subscription when component unmounts
    return () => {
      unsubscribe('chat');
    };
  }, []);

  const handleSendMessage = () => {
    if (message.trim()) {
      send('chat', {
        text: message,
        timestamp: new Date().toISOString(),
      });
      setMessage('');
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700">
          Connection Status: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!isConnected}
            className="px-4 py-2 text-white bg-blue-500 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-medium">Messages:</h3>
        {messages['chat']?.map((msg, index) => (
          <div
            key={index}
            className="p-3 bg-white rounded-md shadow-sm"
          >
            <div className="text-sm text-gray-600">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </div>
            <div className="mt-1">{msg.data.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
} 