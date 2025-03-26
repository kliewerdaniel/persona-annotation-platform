// src/lib/config.ts
export const config = {
    database: {
      url: process.env.DATABASE_URL || 'file:./dev.db',
    },
    ollama: {
      baseUrl: process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || 'http://localhost:11434',
      defaultModel: process.env.NEXT_PUBLIC_OLLAMA_DEFAULT_MODEL || 'llama2',
    },
    chromaDb: {
      dir: process.env.CHROMA_DB_DIR || './chroma_db',
    },
  };
  