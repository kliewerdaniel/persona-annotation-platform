// src/app/annotation/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PersonaData } from '@/types/persona';

export default function AnnotationPage() {
  const searchParams = useSearchParams();
  const itemId = searchParams.get('itemId');
  
  const [content, setContent] = useState('');
  const [selectedPersonaId, setSelectedPersonaId] = useState('');
  const [personas, setPersonas] = useState<Array<{ id: string; name: string; score?: number }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [annotation, setAnnotation] = useState('');
  
  // Fetch available personas
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        // In a real app, you'd get the current project ID from context/state
        const projectId = 'default-project';
        const response = await fetch(`/api/projects/${projectId}/personas`);
        
        if (response.ok) {
          const data = await response.json();
          setPersonas(data.map((p: any) => ({ id: p.id, name: p.name })));
        }
      } catch (error) {
        console.error('Error fetching personas:', error);
      }
    };
    
    fetchPersonas();
  }, []);
  
  // If item ID is provided, fetch the item content
  useEffect(() => {
    if (itemId) {
      const fetchItem = async () => {
        try {
          const response = await fetch(`/api/items/${itemId}`);
          
          if (response.ok) {
            const data = await response.json();
            setContent(data.content);
          }
        } catch (error) {
          console.error('Error fetching item:', error);
        }
      };
      
      fetchItem();
    }
  }, [itemId]);
  
  // Function to select best personas
  const findBestPersonas = async () => {
    if (!content) return;
    
    setIsLoading(true);
    
    try {
      // In a real app, you'd get the current project ID from context/state
      const projectId = 'default-project';
      const response = await fetch(`/api/projects/${projectId}/select-personas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          taskDescription: 'Annotate the following content',
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersonas(data);
        
        // Auto-select the top persona
        if (data.length > 0) {
          setSelectedPersonaId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error finding best personas:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to generate annotation
  const generateAnnotation = async () => {
    if (!selectedPersonaId || !content) return;
    
    setIsLoading(true);
    setAnnotation('');
    
    try {
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaId: selectedPersonaId,
          content,
          itemId, // Include if we have an item ID
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnnotation(data.annotation);
      }
    } catch (error) {
      console.error('Error generating annotation:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Annotation Interface</h1>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">Content to Annotate</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-40 p-3 border rounded"
          placeholder="Enter or paste content to annotate..."
        />
      </div>
      
      <div className="flex gap-4 mb-6">
        <button
          onClick={findBestPersonas}
          disabled={!content || isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
        >
          Find Best Personas
        </button>
      </div>
      
      {personas.length > 0 && (
        <div className="mb-6">
          <label className="block mb-2 font-medium">Select Persona</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {personas.map((persona) => (
              <div
                key={persona.id}
                onClick={() => setSelectedPersonaId(persona.id)}
                className={`p-3 border rounded cursor-pointer ${
                  selectedPersonaId === persona.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="font-medium">{persona.name}</div>
                {persona.score !== undefined && (
                  <div className="text-sm text-gray-500">
                    Match score: {(persona.score * 100).toFixed(1)}%
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {selectedPersonaId && (
        <div className="mb-6">
          <button
            onClick={generateAnnotation}
            disabled={isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-green-300"
          >
            {isLoading ? 'Generating...' : 'Generate Annotation'}
          </button>
        </div>
      )}
      
      {annotation && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-3">Annotation Result</h2>
          <div className="p-4 bg-gray-50 border rounded">
            <pre className="whitespace-pre-wrap">{annotation}</pre>
          </div>
          
          {/* Feedback buttons would go here */}
          <div className="mt-4 flex gap-2">
            <button className="px-3 py-1 bg-green-100 text-green-800 rounded border border-green-300">
              Approve
            </button>
            <button className="px-3 py-1 bg-red-100 text-red-800 rounded border border-red-300">
              Reject
            </button>
            <button className="px-3 py-1 bg-gray-100 text-gray-800 rounded border border-gray-300">
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
