// src/app/projects/[projectId]/collaborative/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useWebSocket } from '@/hooks/useWebSocket';
import { MessageType } from '@/lib/websocket';
import FeedbackForm from '@/components/FeedbackForm';

interface Annotation {
  id: string;
  annotation: string;
  personaId: string;
  personaName?: string;
  confidence: number;
  createdAt: string;
}

interface CollaboratorActivity {
  userId: string;
  name: string;
  action: string;
  timestamp: number;
}

export default function CollaborativeAnnotationPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [content, setContent] = useState('');
  const [itemId, setItemId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Record<string, { name: string; isActive: boolean }>>({});
  const [activities, setActivities] = useState<CollaboratorActivity[]>([]);
  
  // Setup WebSocket
  const { isConnected, sendMessage } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case MessageType.ANNOTATION_CREATED:
          // Add new annotation to the list
          setAnnotations(prev => [message.payload, ...prev]);
          
          // Add activity
          addActivity(message.sender!, 'created an annotation', message.timestamp!);
          break;
          
        case MessageType.FEEDBACK_SUBMITTED:
          // Add activity
          addActivity(message.sender!, 'provided feedback', message.timestamp!);
          break;
          
        case MessageType.USER_JOINED:
          // Add user to collaborators
          setCollaborators(prev => ({
            ...prev,
            [message.payload.id]: {
              name: message.payload.name || `User ${message.payload.id.substring(0, 5)}`,
              isActive: true,
            },
          }));
          
          // Add activity
          addActivity(message.payload.id, 'joined', message.timestamp!);
          break;
          
        case MessageType.USER_LEFT:
          // Mark user as inactive
          setCollaborators(prev => ({
            ...prev,
            [message.payload.id]: {
              ...prev[message.payload.id],
              isActive: false,
            },
          }));
          
          // Add activity
          addActivity(message.payload.id, 'left', message.timestamp!);
          break;
      }
    },
  });
  
  // Helper to add activity
  const addActivity = useCallback((userId: string, action: string, timestamp: number) => {
    const name = collaborators[userId]?.name || `User ${userId.substring(0, 5)}`;
    
    setActivities(prev => [
      { userId, name, action, timestamp },
      ...prev.slice(0, 19), // Keep only the last 20 activities
    ]);
  }, [collaborators]);
  
  // Fetch initial annotations
  useEffect(() => {
    if (!itemId) return;
    
    const fetchAnnotations = async () => {
      try {
        const response = await fetch(`/api/items/${itemId}/annotations`);
        
        if (response.ok) {
          const data = await response.json();
          setAnnotations(data);
        }
      } catch (error) {
        console.error('Error fetching annotations:', error);
      }
    };
    
    fetchAnnotations();
  }, [itemId]);
  
  // Generate annotation
  const generateAnnotation = async (personaId: string) => {
    if (!content) return;
    
    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaId,
          content,
          itemId,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add to local state
        setAnnotations(prev => [data, ...prev]);
        
        // Notify collaborators
        sendMessage({
          type: MessageType.ANNOTATION_CREATED,
          payload: data,
        });
      }
    } catch (error) {
      console.error('Error generating annotation:', error);
    }
  };
  
  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Collaborative Annotation</h1>
        <div className={`px-3 py-1 rounded-full text-sm ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main annotation area */}
        <div className="md:col-span-2 space-y-6">
          {/* Content to annotate */}
          <div className="border rounded p-4">
            <h2 className="text-lg font-bold mb-3">Content</h2>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-40 p-3 border rounded"
              placeholder="Enter or paste content to annotate..."
            />
            
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => generateAnnotation('persona1')} // Use a real persona ID
                className="px-3 py-1 bg-blue-600 text-white rounded"
              >
                Annotate as Persona 1
              </button>
              <button
                onClick={() => generateAnnotation('persona2')} // Use a real persona ID
                className="px-3 py-1 bg-green-600 text-white rounded"
              >
                Annotate as Persona 2
              </button>
            </div>
          </div>
          
          {/* Annotations */}
          <div className="border rounded p-4">
            <h2 className="text-lg font-bold mb-3">Annotations</h2>
            
            {annotations.length === 0 ? (
              <p className="text-gray-500">No annotations yet</p>
            ) : (
              <div className="space-y-4">
                {annotations.map((annotation) => (
                  <div key={annotation.id} className="border rounded p-3">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Persona: {annotation.personaName || annotation.personaId}</span>
                      <span>Confidence: {(annotation.confidence * 100).toFixed(1)}%</span>
                    </div>
                    
                    <div className="p-3 bg-gray-50 rounded">
                      <p>{annotation.annotation}</p>
                    </div>
                    
                    <div className="mt-3">
                      <FeedbackForm
                        annotationId={annotation.id}
                        userId="current-user" // In a real app, use actual user ID
                        onSubmitSuccess={() => {
                          // Notify collaborators about feedback
                          sendMessage({
                            type: MessageType.FEEDBACK_SUBMITTED,
                            payload: {
                              annotationId: annotation.id,
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Collaboration sidebar */}
        <div className="space-y-6">
          {/* Active collaborators */}
          <div className="border rounded p-4">
            <h2 className="text-lg font-bold mb-3">Collaborators</h2>
            
            {Object.keys(collaborators).length === 0 ? (
              <p className="text-gray-500">No one else is here</p>
            ) : (
              <ul className="space-y-2">
                {Object.entries(collaborators).map(([id, { name, isActive }]) => (
                  <li key={id} className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-2 ${isActive ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className={isActive ? '' : 'text-gray-400'}>{name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          {/* Activity feed */}
          <div className="border rounded p-4">
            <h2 className="text-lg font-bold mb-3">Activity</h2>
            
            {activities.length === 0 ? (
              <p className="text-gray-500">No activity yet</p>
            ) : (
              <ul className="space-y-2">
                {activities.map((activity, index) => (
                  <li key={index} className="text-sm">
                    <span className="text-gray-400">{formatTime(activity.timestamp)}</span>
                    <span className="mx-1">-</span>
                    <span className="font-medium">{activity.name}</span>
                    <span className="ml-1">{activity.action}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
