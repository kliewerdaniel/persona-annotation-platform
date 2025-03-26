// src/app/personas/[personaId]/refine/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PersonaRefinementPage() {
  const params = useParams();
  const router = useRouter();
  const personaId = params.personaId as string;
  
  const [originalPersona, setOriginalPersona] = useState<any>(null);
  const [refinedPersona, setRefinedPersona] = useState<any>(null);
  const [changes, setChanges] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');
  
  const startRefinement = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/personas/${personaId}/refine`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOriginalPersona(data.originalPersona);
        setRefinedPersona(data.refinedPersona);
        setChanges(data.changes);
      } else {
        setError(data.error || 'Failed to refine persona');
      }
    } catch (error) {
      console.error('Error refining persona:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const applyRefinement = async () => {
    if (!refinedPersona) return;
    
    setIsApplying(true);
    setError('');
    
    try {
      const response = await fetch(`/api/personas/${personaId}/refine`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refinedPersona,
        }),
      });
      
      if (response.ok) {
        // Redirect to persona detail page
        router.push(`/personas/${personaId}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to apply refinement');
      }
    } catch (error) {
      console.error('Error applying refinement:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsApplying(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Persona Refinement</h1>
      
      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      {!refinedPersona && !isLoading && (
        <div className="mb-6 p-6 border rounded bg-gray-50 text-center">
          <p className="mb-4">
            This tool will analyze feedback data for this persona and suggest improvements
            based on user ratings and comments.
          </p>
          <button
            onClick={startRefinement}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Start Refinement Process
          </button>
        </div>
      )}
      
      {isLoading && (
        <div className="mb-6 p-6 border rounded bg-gray-50 text-center">
          <p>Analyzing feedback and generating refinements...</p>
          <div className="mt-4 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        </div>
      )}
      
      {refinedPersona && (
        <div>
          <div className="mb-6 p-4 border rounded bg-blue-50">
            <h2 className="text-lg font-bold mb-3">Suggested Changes</h2>
            <ul className="list-disc pl-5 space-y-2">
              {changes.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border rounded p-4">
              <h2 className="text-lg font-bold mb-3">Original Persona</h2>
              <div className="mb-3">
                <h3 className="font-medium text-sm text-gray-600">Traits</h3>
                <div className="mt-2 space-y-2">
                  {originalPersona.traits.map((trait: any, index: number) => (
                    <div key={index} className="flex justify-between">
                      <span>{trait.name}</span>
                      <span className="font-mono">{trait.value.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-gray-600">Examples</h3>
                <p className="text-sm text-gray-500">
                  {originalPersona.examples.length} examples
                </p>
              </div>
            </div>
            
            <div className="border rounded p-4 bg-green-50">
              <h2 className="text-lg font-bold mb-3">Refined Persona</h2>
              <div className="mb-3">
                <h3 className="font-medium text-sm text-gray-600">Traits</h3>
                <div className="mt-2 space-y-2">
                  {refinedPersona.traits.map((trait: any, index: number) => {
                    const originalTrait = originalPersona.traits.find(
                      (t: any) => t.name === trait.name
                    );
                    const changed = originalTrait && originalTrait.value !== trait.value;
                    
                    return (
                      <div key={index} className="flex justify-between">
                        <span>{trait.name}</span>
                        <span className={`font-mono ${changed ? 'text-green-700 font-bold' : ''}`}>
                          {trait.value.toFixed(2)}
                          {changed && ` (was ${originalTrait.value.toFixed(2)})`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-sm text-gray-600">Examples</h3>
                <p className="text-sm text-gray-500">
                  {refinedPersona.examples.length} examples 
                  {refinedPersona.examples.length > originalPersona.examples.length && 
                    ` (+${refinedPersona.examples.length - originalPersona.examples.length} new)`}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={applyRefinement}
              disabled={isApplying}
              className="px-4 py-2 bg-green-600 text-white rounded disabled:bg-green-300"
            >
              {isApplying ? 'Applying Changes...' : 'Apply Refinements'}
            </button>
            
            <Link href={`/personas/${personaId}`} className="px-4 py-2 border rounded text-gray-700">
              Cancel
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
