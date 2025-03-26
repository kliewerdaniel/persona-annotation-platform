// src/lib/rlhf/personaRefinement.ts
import { prisma } from '../db/prisma';
import { personaService } from '../services/personaService';
import { feedbackService } from '../services/feedbackService';
import { ollamaService } from '../ollama';
import { PersonaData, PersonaTrait } from '@/types/persona';

export class PersonaRefinementService {
  /**
   * Analyzes feedback and suggests improvements to a persona
   */
  async analyzeAndRefinePersona(personaId: string): Promise<{
    originalPersona: PersonaData;
    refinedPersona: PersonaData;
    changes: string[];
  }> {
    // Get the current persona
    const originalPersona = await personaService.getPersona(personaId);
    
    if (!originalPersona) {
      throw new Error(`Persona ${personaId} not found`);
    }
    
    // Get feedback for this persona
    const feedback = await feedbackService.getFeedbackForPersona(personaId);
    
    if (feedback.length === 0) {
      throw new Error('No feedback available for refinement');
    }
    
    // Get annotations with positive and negative feedback
    const annotations = await prisma.annotation.findMany({
      where: { personaId },
      include: {
        feedback: true,
        item: true,
      },
    });
    
    // Organize into positive and negative examples
    const positiveExamples = annotations
      .filter(a => {
        const avgRating = a.feedback.reduce((sum, f) => sum + f.rating, 0) / a.feedback.length;
        return avgRating >= 4 && a.feedback.length > 0;
      })
      .map(a => ({
        input: a.item.content,
        output: a.annotation,
      }));
    
    const negativeExamples = annotations
      .filter(a => {
        const avgRating = a.feedback.reduce((sum, f) => sum + f.rating, 0) / a.feedback.length;
        return avgRating <= 2 && a.feedback.length > 0;
      })
      .map(a => ({
        input: a.item.content,
        output: a.annotation,
        feedback: a.feedback.map(f => f.comment).filter(Boolean).join('. '),
      }));
    
    // If we have no examples, we can't refine
    if (positiveExamples.length === 0 && negativeExamples.length === 0) {
      throw new Error('Not enough quality feedback to perform refinement');
    }
    
    // Use Ollama to suggest improvements
    const refinementPrompt = this.createRefinementPrompt(
      originalPersona,
      positiveExamples,
      negativeExamples,
      feedback
    );
    
    const response = await ollamaService.generate({
      prompt: refinementPrompt,
      temperature: 0.7,
    });
    
    // Parse the response to extract suggested changes
    const { refinedTraits, newExamples, changes } = this.parseRefinementResponse(
      response.text,
      originalPersona
    );
    
    // Create the refined persona
    const refinedPersona: PersonaData = {
      ...originalPersona,
      traits: refinedTraits,
      examples: [...originalPersona.examples, ...newExamples],
    };
    
    // Return both the original and refined personas, plus changes
    return {
      originalPersona,
      refinedPersona,
      changes,
    };
  }
  
  /**
   * Apply the suggested refinements to the persona
   */
  async applyRefinement(personaId: string, refinedPersona: PersonaData): Promise<PersonaData> {
    // Update the persona with the refinements
    const updatedPersona = await personaService.updatePersona(personaId, refinedPersona);
    return updatedPersona;
  }
  
  /**
   * Create a prompt for refining the persona
   */
  private createRefinementPrompt(
    persona: PersonaData,
    positiveExamples: Array<{ input: string; output: string }>,
    negativeExamples: Array<{ input: string; output: string; feedback?: string }>,
    feedback: any[]
  ): string {
    // Format the traits
    const traitsText = persona.traits
      .map(trait => `- ${trait.name}: ${trait.value.toFixed(2)} (${trait.description || ''})`)
      .join('\n');
    
    // Format the existing examples
    const existingExamplesText = persona.examples
      .map(example => `Input: ${example.input}\nOutput: ${example.output}${example.explanation ? `\nExplanation: ${example.explanation}` : ''}`)
      .join('\n\n');
    
    // Format the positive examples
    const positiveExamplesText = positiveExamples
      .map(example => `Input: ${example.input}\nOutput: ${example.output}\nFeedback: Positive (high rating)`)
      .join('\n\n');
    
    // Format the negative examples
    const negativeExamplesText = negativeExamples
      .map(example => `Input: ${example.input}\nOutput: ${example.output}\nFeedback: Negative (low rating)${example.feedback ? `\nFeedback comments: ${example.feedback}` : ''}`)
      .join('\n\n');
    
    // Extract common feedback themes
    const feedbackComments = feedback
      .filter(f => f.comment)
      .map(f => f.comment);
    
    // Create the prompt
    return `
You are an expert at refining AI personas based on human feedback. I need your help to improve an existing annotation persona.

CURRENT PERSONA:
Name: ${persona.name}
Description: ${persona.description}

Traits:
${traitsText}

Current system prompt: ${persona.prompt}

Existing examples:
${existingExamplesText}

FEEDBACK DATA:
${feedback.length} pieces of feedback received

Examples with positive feedback:
${positiveExamplesText || "None available"}

Examples with negative feedback:
${negativeExamplesText || "None available"}

Common feedback themes:
${feedbackComments.length > 0 ? feedbackComments.join('\n') : "No textual feedback provided"}

INSTRUCTIONS:
Based on the feedback data, please provide the following:

1. REFINED_TRAITS: Suggest adjustments to the trait values to improve performance. Return the full list of traits with adjusted values.
2. NEW_EXAMPLES: Suggest 1-2 new examples that would help the persona improve based on the feedback.
3. CHANGES_SUMMARY: Summarize the key changes you're recommending and why.

Format your response using these exact section headers:
REFINED_TRAITS:
[trait adjustments here]

NEW_EXAMPLES:
[new examples here]

CHANGES_SUMMARY:
[summary of changes here]
`;
  }
  
  /**
   * Parse the LLM response to extract refined traits, new examples, and changes
   */
  private parseRefinementResponse(
    response: string,
    originalPersona: PersonaData
  ): {
    refinedTraits: PersonaTrait[];
    newExamples: Array<{ input: string; output: string; explanation?: string }>;
    changes: string[];
  } {
    // Initialize with defaults
    let refinedTraits = [...originalPersona.traits];
    let newExamples: Array<{ input: string; output: string; explanation?: string }> = [];
    let changes: string[] = [];
    
    // Extract refined traits
    const traitsMatch = response.match(/REFINED_TRAITS:\s*([\s\S]*?)(?=NEW_EXAMPLES:|$)/);
    if (traitsMatch && traitsMatch[1]) {
      const traitsText = traitsMatch[1].trim();
      
      // Try to parse the traits
      try {
        // Look for patterns like "- Name: 0.8 (Description)" or "Name: 0.8"
        const traitRegex = /[-\s]*([^:]+):\s*([\d.]+)(?:\s*\(([^)]+)\))?/g;
        let match;
        
        const extractedTraits: PersonaTrait[] = [];
        
        while ((match = traitRegex.exec(traitsText)) !== null) {
          const name = match[1].trim();
          const value = parseFloat(match[2]);
          const description = match[3] ? match[3].trim() : undefined;
          
          // Find the original trait to preserve its description if not provided
          const originalTrait = originalPersona.traits.find(t => t.name.toLowerCase() === name.toLowerCase());
          
          extractedTraits.push({
            name,
            value: isNaN(value) ? 0.5 : Math.max(0, Math.min(1, value)), // Ensure value is between 0 and 1
            description: description || (originalTrait ? originalTrait.description : undefined),
          });
        }
        
        if (extractedTraits.length > 0) {
          refinedTraits = extractedTraits;
        }
      } catch (error) {
        console.error('Error parsing refined traits:', error);
      }
    }
    
    // Extract new examples
    const examplesMatch = response.match(/NEW_EXAMPLES:\s*([\s\S]*?)(?=CHANGES_SUMMARY:|$)/);
    if (examplesMatch && examplesMatch[1]) {
      const examplesText = examplesMatch[1].trim();
      
      // Try to parse the examples
      try {
        // Split by obvious example boundaries
        const exampleBlocks = examplesText.split(/(?:Example \d+:|Input:)/).filter(Boolean);
        
        for (const block of exampleBlocks) {
          const inputMatch = block.match(/Input:\s*([\s\S]*?)(?=Output:|$)/i) || 
                           block.match(/([\s\S]*?)(?=Output:|$)/i);
          const outputMatch = block.match(/Output:\s*([\s\S]*?)(?=Explanation:|$)/i);
          const explanationMatch = block.match(/Explanation:\s*([\s\S]*?)(?=$)/i);
          
          if (inputMatch && outputMatch) {
            newExamples.push({
              input: inputMatch[1].trim(),
              output: outputMatch[1].trim(),
              explanation: explanationMatch ? explanationMatch[1].trim() : undefined,
            });
          }
        }
      } catch (error) {
        console.error('Error parsing new examples:', error);
      }
    }
    
    // Extract changes summary
    const changesMatch = response.match(/CHANGES_SUMMARY:\s*([\s\S]*?)(?=$)/);
    if (changesMatch && changesMatch[1]) {
      const changesText = changesMatch[1].trim();
      
      // Split by bullet points or paragraphs
      changes = changesText
        .split(/\n+/)
        .map(line => line.replace(/^[-*•]\s*/, '').trim())
        .filter(Boolean);
    }
    
    return {
      refinedTraits,
      newExamples,
      changes,
    };
  }
}

export const personaRefinementService = new PersonaRefinementService();
