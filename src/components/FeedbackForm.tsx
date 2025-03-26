// src/components/FeedbackForm.tsx
'use client';

import { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';

interface FeedbackFormProps {
  annotationId: string;
  userId: string;
  onSubmitSuccess?: () => void;
  className?: string;
}

export default function FeedbackForm({
  annotationId,
  userId,
  onSubmitSuccess,
  className = '',
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === null) {
      setError('Please provide a rating');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          annotationId,
          userId,
          rating,
          comment: comment.trim() || undefined,
        }),
      });
      
      if (response.ok) {
        setSuccess(true);
        setRating(null);
        setComment('');
        
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className={`border rounded p-4 ${className}`}>
      <h3 className="font-medium mb-3">Provide Feedback</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-800 rounded text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-800 rounded text-sm">
          Thank you for your feedback!
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2 text-sm">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="text-yellow-400 focus:outline-none"
              >
                {rating !== null && star <= rating ? (
                  <StarIcon className="h-6 w-6" />
                ) : (
                  <StarOutlineIcon className="h-6 w-6" />
                )}
              </button>
            ))}
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block mb-2 text-sm">Comments (Optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full p-2 border rounded h-24 text-sm"
            placeholder="What did you like or dislike about this annotation?"
          />
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting || rating === null}
          className="px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:bg-blue-300"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>
    </div>
  );
}
