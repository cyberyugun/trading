import { create } from 'zustand';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketStore {
  isConnected: boolean;
  messages: Record<string, WebSocketMessage[]>;
  connect: (url: string) => void;
  disconnect: () => void;
  subscribe: (channel: string, callback?: (data: any) => void) => void;
  unsubscribe: (channel: string) => void;
  send: (channel: string, data: any) => void;
}

const useWebSocketStore = create<WebSocketStore>((set, get) => {
  let ws: WebSocket | null = null;
  let reconnectTimeout: NodeJS.Timeout | null = null;
  const RECONNECT_DELAY = 5000;
  const MAX_MESSAGES_PER_CHANNEL = 100;
  const callbacks: Record<string, ((data: any) => void)[]> = {};

  const connect = (url: string) => {
    if (ws?.readyState === WebSocket.OPEN) return;

    ws = new WebSocket(url);

    ws.onopen = () => {
      console.log('WebSocket connected');
      set({ isConnected: true });
      // Resubscribe to any active channels
      const { messages } = get();
      if (Object.keys(messages).length > 0) {
        Object.keys(messages).forEach(channel => {
          get().subscribe(channel);
        });
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      set({ isConnected: false });
      // Attempt to reconnect
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      reconnectTimeout = setTimeout(() => connect(url), RECONNECT_DELAY);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { channel, data } = message;

        // Update messages store
        set((state) => {
          const channelMessages = state.messages[channel] || [];
          const newMessages = [
            ...channelMessages,
            {
              type: message.type || 'message',
              data,
              timestamp: Date.now()
            }
          ].slice(-MAX_MESSAGES_PER_CHANNEL);

          return {
            messages: {
              ...state.messages,
              [channel]: newMessages
            }
          };
        });

        // Execute callbacks
        if (callbacks[channel]) {
          callbacks[channel].forEach(callback => callback(data));
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
  };

  const subscribe = (channel: string, callback?: (data: any) => void) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({ type: 'subscribe', channel }));
    
    if (callback) {
      if (!callbacks[channel]) {
        callbacks[channel] = [];
      }
      callbacks[channel].push(callback);
    }
  };

  const unsubscribe = (channel: string) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({ type: 'unsubscribe', channel }));
    delete callbacks[channel];
  };

  const send = (channel: string, data: any) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    ws.send(JSON.stringify({
      type: 'message',
      channel,
      data
    }));
  };

  return {
    isConnected: false,
    messages: {},
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    send
  };
});

export default useWebSocketStore; 