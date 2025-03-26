// src/app/personas/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PersonaTrait, PersonaExample } from '@/types/persona';

export default function NewPersonaPage() {
  const router = useRouter();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [traits, setTraits] = useState<PersonaTrait[]>([
    { name: 'Clarity', value: 0.5, description: 'How clear and concise the annotations should be' },
    { name: 'Detail', value: 0.5, description: 'Level of detail in annotations' },
    { name: 'Formality', value: 0.5, description: 'How formal the language should be' },
  ]);
  const [examples, setExamples] = useState<PersonaExample[]>([
    { input: '', output: '', explanation: '' },
  ]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const handleTraitChange = (index: number, field: keyof PersonaTrait, value: string | number) => {
    const updatedTraits = [...traits];
    updatedTraits[index] = { ...updatedTraits[index], [field]: value };
    setTraits(updatedTraits);
  };
  
  const addTrait = () => {
    setTraits([...traits, { name: '', value: 0.5, description: '' }]);
  };
  
  const removeTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };
  
  const handleExampleChange = (index: number, field: keyof PersonaExample, value: string) => {
    const updatedExamples = [...examples];
    updatedExamples[index] = { ...updatedExamples[index], [field]: value };
    setExamples(updatedExamples);
  };
  
  const addExample = () => {
    setExamples([...examples, { input: '', output: '', explanation: '' }]);
  };
  
  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name) {
      setError('Name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // In a real app, you'd get the current project ID from context/state
      const projectId = 'default-project';
      const response = await fetch(`/api/projects/${projectId}/personas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          traits,
          examples,
        }),
      });
      
      if (response.ok) {
        router.push('/personas');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create persona');
      }
    } catch (error) {
      console.error('Error creating persona:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Persona</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block mb-2 font-medium">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Technical Reviewer"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block mb-2 font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded h-24"
            placeholder="Describe this persona's purpose and characteristics..."
          />
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="font-medium">Persona Traits</label>
            <button
              type="button"
              onClick={addTrait}
              className="text-sm text-blue-600"
            >
              + Add Trait
            </button>
          </div>
          
          {traits.map((trait, index) => (
            <div key={index} className="mb-3 p-3 border rounded">
              <div className="flex gap-4 mb-3">
                <div className="flex-1">
                  <label className="text-sm text-gray-600 mb-1 block">Trait Name</label>
                  <input
                    type="text"
                    value={trait.name}
                    onChange={(e) => handleTraitChange(index, 'name', e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Clarity"
                  />
                </div>
                
                <div className="w-24">
                  <label className="text-sm text-gray-600 mb-1 block">Value (0-1)</label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={trait.value}
                    onChange={(e) => handleTraitChange(index, 'value', parseFloat(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
              
              <div className="mb-2">
                <label className="text-sm text-gray-600 mb-1 block">Description</label>
                <input
                  type="text"
                  value={trait.description || ''}
                  onChange={(e) => handleTraitChange(index, 'description', e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="What this trait means..."
                />
              </div>
              
              {traits.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTrait(index)}
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label className="font-medium">Example Annotations</label>
            <button
              type="button"
              onClick={addExample}
              className="text-sm text-blue-600"
            >
              + Add Example
            </button>
          </div>
          
          {examples.map((example, index) => (
            <div key={index} className="mb-3 p-3 border rounded">
              <div className="mb-3">
                <label className="text-sm text-gray-600 mb-1 block">Input Content</label>
                <textarea
                  value={example.input}
                  onChange={(e) => handleExampleChange(index, 'input', e.target.value)}
                  className="w-full p-2 border rounded h-24"
                  placeholder="Example content to be annotated..."
                />
              </div>
              
              <div className="mb-3">
                <label className="text-sm text-gray-600 mb-1 block">Expected Output</label>
                <textarea
                  value={example.output}
                  onChange={(e) => handleExampleChange(index, 'output', e.target.value)}
                  className="w-full p-2 border rounded h-24"
                  placeholder="How this persona should annotate the input..."
                />
              </div>
              
              <div className="mb-2">
                <label className="text-sm text-gray-600 mb-1 block">Explanation (Optional)</label>
                <textarea
                  value={example.explanation || ''}
                  onChange={(e) => handleExampleChange(index, 'explanation', e.target.value)}
                  className="w-full p-2 border rounded h-16"
                  placeholder="Why this is a good annotation..."
                />
              </div>
              
              {examples.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeExample(index)}
                  className="text-sm text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-blue-300"
          >
            {isSubmitting ? 'Creating...' : 'Create Persona'}
          </button>
          
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border rounded text-gray-700"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
