// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';

interface SystemHealth {
  database: {
    connected: boolean;
    type: string;
    error?: string;
  };
  ollama: {
    connected: boolean;
    models?: string[];
    error?: string;
  };
  chromadb: {
    connected: boolean;
    error?: string;
  };
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskSpace: {
      total: number;
      free: number;
      used: number;
    };
  };
}

export default function SettingsPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshCounter, setRefreshCounter] = useState(0);
  
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/system/health');
        
        if (response.ok) {
          const data = await response.json();
          setHealth(data);
        } else {
          setError('Failed to fetch system health');
        }
      } catch (error) {
        console.error('Error fetching system health:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHealth();
    
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshCounter(prev => prev + 1);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [refreshCounter]);
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getStatusColor = (isConnected: boolean) => {
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">System Settings & Monitoring</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {isLoading && !health ? (
        <div className="text-center py-8">Loading system status...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Database Status */}
            <div className="border rounded p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Database</h2>
                <div className={`w-3 h-3 rounded-full ${health ? getStatusColor(health.database.connected) : 'bg-gray-300'}`}></div>
              </div>
              
              {health && (
                <>
                  <p className="mb-2">Type: {health.database.type}</p>
                  <p className="mb-2">Status: {health.database.connected ? 'Connected' : 'Disconnected'}</p>
                  {health.database.error && (
                    <p className="text-red-600 text-sm">{health.database.error}</p>
                  )}
                </>
              )}
            </div>
            
            {/* Ollama Status */}
            <div className="border rounded p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Ollama</h2>
                <div className={`w-3 h-3 rounded-full ${health ? getStatusColor(health.ollama.connected) : 'bg-gray-300'}`}></div>
              </div>
              
              {health && (
                <>
                  <p className="mb-2">Status: {health.ollama.connected ? 'Connected' : 'Disconnected'}</p>
                  
                  {health.ollama.models && health.ollama.models.length > 0 && (
                    <div className="mb-2">
                      <p className="font-medium">Available Models:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {health.ollama.models.map((model, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {health.ollama.error && (
                    <p className="text-red-600 text-sm">{health.ollama.error}</p>
                  )}
                </>
              )}
            </div>
            
            {/* ChromaDB Status */}
            <div className="border rounded p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">ChromaDB</h2>
                <div className={`w-3 h-3 rounded-full ${health ? getStatusColor(health.chromadb.connected) : 'bg-gray-300'}`}></div>
              </div>
              
              {health && (
                <>
                  <p className="mb-2">Status: {health.chromadb.connected ? 'Connected' : 'Disconnected'}</p>
                  
                  {health.chromadb.error && (
                    <p className="text-red-600 text-sm">{health.chromadb.error}</p>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* System Resources */}
          {health && (
            <div className="border rounded p-4 mb-8">
              <h2 className="text-lg font-bold mb-4">System Resources</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* CPU Usage */}
                <div>
                  <h3 className="font-medium mb-2">CPU Usage</h3>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${health.system.cpuUsage > 80 ? 'bg-red-500' : health.system.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${health.system.cpuUsage}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm mt-1">{health.system.cpuUsage.toFixed(1)}%</p>
                </div>
                
                {/* Memory Usage */}
                <div>
                  <h3 className="font-medium mb-2">Memory Usage</h3>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${health.system.memoryUsage > 80 ? 'bg-red-500' : health.system.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${health.system.memoryUsage}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm mt-1">{health.system.memoryUsage.toFixed(1)}%</p>
                </div>
                
                {/* Disk Usage */}
                <div>
                  <h3 className="font-medium mb-2">Disk Usage</h3>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${health.system.diskSpace.used > 80 ? 'bg-red-500' : health.system.diskSpace.used > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                      style={{ width: `${health.system.diskSpace.used}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span>Free: {formatBytes(health.system.diskSpace.free)}</span>
                    <span>{health.system.diskSpace.used.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Admin Actions */}
          <div className="border rounded p-4">
            <h2 className="text-lg font-bold mb-4">Administration</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setRefreshCounter(prev => prev + 1)}
                className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Refresh System Status
              </button>
              
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to clear the system cache?')) {
                    fetch('/api/system/cache/clear', { method: 'POST' })
                      .then(response => {
                        if (response.ok) {
                          alert('Cache cleared successfully');
                        } else {
                          alert('Failed to clear cache');
                        }
                      })
                      .catch(error => {
                        console.error('Error clearing cache:', error);
                        alert('Error clearing cache');
                      });
                  }
                }}
                className="px-4 py-2 bg-yellow-600 text-white rounded"
              >
                Clear System Cache
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
