// src/app/personas/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';
import { PersonaData } from '@/types/persona';

export default function PersonasPage() {
  const [personas, setPersonas] = useState<PersonaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        // In a real app, you'd get the current project ID from context/state
        const projectId = 'default-project';
        const response = await fetch(`/api/projects/${projectId}/personas`);
        
        if (response.ok) {
          const data = await response.json();
          setPersonas(data);
        }
      } catch (error) {
        console.error('Error fetching personas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPersonas();
  }, []);
  
  const deletePersona = async (personaId: string) => {
    if (!confirm('Are you sure you want to delete this persona?')) return;
    
    try {
      const response = await fetch(`/api/personas/${personaId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setPersonas(personas.filter(p => p.id !== personaId));
      }
    } catch (error) {
      console.error('Error deleting persona:', error);
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Loading personas...</div>;
  }
  
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Personas</h1>
        <Link
          href="/personas/new"
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Persona
        </Link>
      </div>
      
      {personas.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded border">
          <p className="text-gray-500">No personas created yet.</p>
          <Link
            href="/personas/new"
            className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded"
          >
            Create your first persona
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map((persona) => (
            <div key={persona.id} className="border rounded overflow-hidden">
              <div className="p-4">
                <h2 className="text-lg font-bold mb-2">{persona.name}</h2>
                <p className="text-gray-600 text-sm mb-3">{persona.description}</p>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Traits:</h3>
                  <div className="flex flex-wrap gap-2">
                    {persona.traits.map((trait, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {trait.name}: {trait.value.toFixed(1)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="border-t px-4 py-3 bg-gray-50 flex justify-between">
                <Link
                  href={`/personas/${persona.id}`}
                  className="text-blue-600 hover:underline text-sm"
                >
                  View & Edit
                </Link>
                <button
                  onClick={() => deletePersona(persona.id)}
                  className="text-red-600 hover:underline text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
