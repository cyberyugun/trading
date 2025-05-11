'use client';

import { createContext, useContext, useEffect, ReactNode, useState } from 'react';
import useWebSocketStore from '@/services/websocket';

interface WebSocketContextType {
  isConnected: boolean;
  messages: Record<string, any[]>;
  send: (channel: string, data: any) => void;
  subscribe: (channel: string, callback?: (data: any) => void) => void;
  unsubscribe: (channel: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
  wsUrl: string;
}

export function WebSocketProvider({ children, wsUrl }: WebSocketProviderProps) {
  const [isClient, setIsClient] = useState(false);
  const { connect, disconnect, isConnected, messages, send, subscribe, unsubscribe } = useWebSocketStore();

  useEffect(() => {
    setIsClient(true);
    // Connect to WebSocket when the provider mounts
    connect(wsUrl);

    // Disconnect when the provider unmounts
    return () => {
      disconnect();
    };
  }, [wsUrl]);

  // Don't render anything on the server
  if (!isClient) {
    return null;
  }

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        messages,
        send,
        subscribe,
        unsubscribe,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
} 