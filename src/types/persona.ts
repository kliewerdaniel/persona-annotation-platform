// src/types/persona.ts
export interface PersonaTrait {
    name: string;
    value: number; // 0-1 scale, representing trait intensity
    description?: string;
  }
  
  export interface PersonaExample {
    input: string;
    output: string;
    explanation?: string;
  }
  
  export interface PersonaData {
    id: string;
    name: string;
    description: string;
    traits: PersonaTrait[];
    examples: PersonaExample[];
    prompt?: string; // Generated system prompt
  }
  