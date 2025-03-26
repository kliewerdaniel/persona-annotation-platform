// src/hooks/useWebSocket.ts
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { MessageType, WebSocketMessage } from '@/lib/websocket';

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    onMessage,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    debug = false,
  } = options;
  
  const connect = useCallback(() => {
    if (wsRef.current) {
      // Check if websocket is already in a good state
      if (wsRef.current.readyState === WebSocket.OPEN) {
        if (debug) console.log('WebSocket already connected and open');
        return;
      } else if (wsRef.current.readyState === WebSocket.CONNECTING) {
        if (debug) console.log('WebSocket already connecting, waiting...');
        return;
      }
      
      // Clean up any existing connection in bad state
      if (debug) console.log('Closing existing WebSocket connection in bad state');
      wsRef.current.close();
      wsRef.current = null;
    }
    
    // Connect to the WebSocket server through our Next.js endpoint
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Connect to the current server and port
    const wsUrl = `${protocol}//${window.location.host}/api/websocket`;
    
    if (debug) console.log(`Connecting to WebSocket at ${wsUrl}`);
    
    // First do a HTTP fetch to ensure the WebSocket server is initialized
    fetch('/api/websocket')
      .then(res => res.json())
      .then(data => {
        if (debug) console.log('WebSocket server status:', data);
        
        // Now create the actual WebSocket connection
        try {
          const ws = new WebSocket(wsUrl);
          
          if (debug) console.log('WebSocket connection created');
          
          // Track connection attempt time
          const connectionStart = Date.now();
    
          ws.onopen = () => {
            if (debug) console.log(`WebSocket connection opened after ${Date.now() - connectionStart}ms`);
            setIsConnected(true);
            reconnectAttemptsRef.current = 0;
            
            if (reconnectIntervalRef.current) {
              clearTimeout(reconnectIntervalRef.current);
              reconnectIntervalRef.current = null;
            }
          };
    
          ws.onmessage = (event) => {
            if (debug) console.log('WebSocket message received:', event.data);
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          setLastMessage(message);
          
          if (onMessage) {
            onMessage(message);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    
          ws.onclose = (event) => {
            if (debug) console.log('WebSocket connection closed', event.code, event.reason);
            setIsConnected(false);
            
            // Attempt to reconnect
            if (reconnectAttemptsRef.current < maxReconnectAttempts) {
              reconnectAttemptsRef.current++;
              
              const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current - 1);
              if (debug) console.log(`Scheduling reconnect attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);
              
              reconnectIntervalRef.current = setTimeout(() => {
                console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
                connect();
              }, delay);
            } else {
              console.error(`Maximum reconnect attempts (${maxReconnectAttempts}) reached.`);
            }
          };
          
          ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            if (debug) console.log('WebSocket error event:', error);
            // Don't close here, let the onclose handler handle reconnection
          };
          
          wsRef.current = ws;
        } catch (error) {
          console.error('Failed to create WebSocket connection:', error);
          
          // Schedule reconnection
          if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current++;
            
            const delay = reconnectInterval * Math.pow(1.5, reconnectAttemptsRef.current - 1);
            reconnectIntervalRef.current = setTimeout(() => {
              console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
              connect();
            }, delay);
          }
        }
      })
      .catch(error => {
        console.error('Failed to initialize WebSocket server:', error);
        
        // Schedule reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          
          reconnectIntervalRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
            connect();
          }, reconnectInterval);
        }
      });
  }, [onMessage, reconnectInterval, maxReconnectAttempts, debug]);
  
  const sendMessage = useCallback((message: Omit<WebSocketMessage, 'timestamp'>) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        ...message,
        timestamp: Date.now(),
      }));
      return true;
    }
    return false;
  }, []);
  
  // Connect when component mounts
  useEffect(() => {
    connect();
    
    // Cleanup
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      
      if (reconnectIntervalRef.current) {
        clearTimeout(reconnectIntervalRef.current);
      }
    };
  }, [connect]);
  
  return {
    isConnected,
    sendMessage,
    lastMessage,
  };
}
