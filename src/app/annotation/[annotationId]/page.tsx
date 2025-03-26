// src/app/annotation/[annotationId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import FeedbackForm from '@/components/FeedbackForm';

export default function AnnotationDetailPage() {
  const params = useParams();
  const annotationId = params.annotationId as string;
  
  const [annotation, setAnnotation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchAnnotation = async () => {
      try {
        const response = await fetch(`/api/annotations/${annotationId}`);
        
        if (response.ok) {
          const data = await response.json();
          setAnnotation(data);
        } else {
          setError('Failed to fetch annotation');
        }
      } catch (error) {
        console.error('Error fetching annotation:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchAnnotation();
  }, [annotationId]);
  
  if (isLoading) {
    return <div className="text-center py-8">Loading annotation...</div>;
  }
  
  if (error) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-red-100 text-red-800 rounded">
          {error}
        </div>
      </div>
    );
  }
  
  if (!annotation) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
          Annotation not found
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Annotation Details</h1>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-medium mb-3">Original Content</h2>
        <div className="p-3 bg-gray-50 rounded">
          <p>{annotation.item?.content || 'Content not available'}</p>
        </div>
      </div>
      
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-lg font-medium mb-3">Annotation</h2>
        <div className="p-3 bg-blue-50 rounded">
          <p>{annotation.annotation}</p>
        </div>
        <div className="mt-2 text-sm text-gray-600">
          <p>Confidence: {(annotation.confidence * 100).toFixed(1)}%</p>
          <p>Created: {new Date(annotation.createdAt).toLocaleString()}</p>
        </div>
      </div>
      
      <FeedbackForm
        annotationId={annotationId}
        userId="current-user" // In a real app, you'd get this from auth
        className="mb-8"
      />
    </div>
  );
}
