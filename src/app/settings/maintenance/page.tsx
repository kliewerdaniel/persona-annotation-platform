// src/app/settings/maintenance/page.tsx
'use client';

import { useState } from 'react';

export default function MaintenancePage() {
  const [isWorking, setIsWorking] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const performMaintenance = async (type: string, operation: string, data = {}) => {
    setIsWorking(true);
    setResult(null);
    setError('');
    
    try {
      const response = await fetch(`/api/system/${type}/maintenance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operation,
          ...data,
        }),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        setResult(responseData);
      } else {
        setError(responseData.error || 'Operation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsWorking(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">System Maintenance</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {result && (
        <div className="mb-6 p-4 bg-green-100 text-green-800 rounded">
          <p className="font-bold">{result.message || 'Operation completed successfully'}</p>
          {result.deletedAnnotations !== undefined && (
            <p>Deleted annotations: {result.deletedAnnotations}</p>
          )}
          {result.deletedFeedback !== undefined && (
            <p>Deleted feedback: {result.deletedFeedback}</p>
          )}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Database Maintenance */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-bold mb-3">Database Maintenance</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => performMaintenance('system', 'create-indices')}
              disabled={isWorking}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
            >
              Create/Update Indices
            </button>
            
            <button
              onClick={() => performMaintenance('system', 'optimize-database')}
              disabled={isWorking}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
            >
              Optimize Database
            </button>
            
            <div>
              <button
                onClick={() => {
                  const days = prompt('How many days of data to keep?', '30');
                  if (days !== null) {
                    const daysNumber = parseInt(days, 10);
                    if (!isNaN(daysNumber) && daysNumber > 0) {
                      performMaintenance('system', 'cleanup-old-data', { daysToKeep: daysNumber });
                    } else {
                      alert('Please enter a valid number of days');
                    }
                  }
                }}
                disabled={isWorking}
                className="w-full px-4 py-2 bg-yellow-600 text-white rounded disabled:bg-yellow-300"
              >
                Clean Up Old Data
              </button>
              <p className="text-sm text-gray-500 mt-1">
                Removes old annotations and feedback to improve performance.
              </p>
            </div>
          </div>
        </div>
        
        {/* ChromaDB Maintenance */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-bold mb-3">ChromaDB Maintenance</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                if (confirm('This will compact the ChromaDB database. A backup will be created before compacting. Continue?')) {
                  performMaintenance('chromadb', 'compact');
                }
              }}
              disabled={isWorking}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
            >
              Compact ChromaDB
            </button>
            <p className="text-sm text-gray-500 mt-1">
              Reduces database size and improves query performance.
            </p>
            
            <button
              onClick={() => {
                if (confirm('This will reindex all embeddings in ChromaDB. This may take some time for large databases. Continue?')) {
                  performMaintenance('chromadb', 'reindex');
                }
              }}
              disabled={isWorking}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
            >
              Reindex ChromaDB
            </button>
            <p className="text-sm text-gray-500 mt-1">
              Rebuilds all embeddings to ensure consistency and optimal performance.
            </p>
          </div>
        </div>
        
        {/* Cache Management */}
        <div className="border rounded p-4">
          <h2 className="text-lg font-bold mb-3">Cache Management</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                if (confirm('This will clear all cached results. Continue?')) {
                  fetch('/api/system/cache/clear', { method: 'POST' })
                    .then(response => response.json())
                    .then(data => {
                      if (data.success) {
                        setResult({ message: 'Cache cleared successfully' });
                      } else {
                        setError('Failed to clear cache');
                      }
                    })
                    .catch(err => {
                      console.error('Error clearing cache:', err);
                      setError('Error clearing cache');
                    });
                }
              }}
              disabled={isWorking}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
            >
              Clear All Cache
            </button>
            <p className="text-sm text-gray-500 mt-1">
              Removes all cached results to free up disk space.
            </p>
          </div>
        </div>
      </div>
      
      {isWorking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-medium">Operation in progress...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
}
