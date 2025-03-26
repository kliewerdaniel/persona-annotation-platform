// src/lib/config/deployment.ts
import path from 'path';
import os from 'os';

interface DeploymentConfig {
  database: {
    type: 'sqlite' | 'postgres';
    sqlitePath?: string;
    postgresConfig?: {
      host: string;
      port: number;
      user: string;
      password: string;
      database: string;
    };
  };
  ollama: {
    url: string;
    defaultModel: string;
    maxConcurrentRequests: number;
  };
  chromadb: {
    directory: string;
    pythonPath: string;
  };
  system: {
    tempDir: string;
    cacheDir: string;
    dataDir: string;
    maxConcurrency: number;
  };
}

// Default configuration for local development
const defaultConfig: DeploymentConfig = {
  database: {
    type: 'sqlite',
    sqlitePath: path.join(process.cwd(), 'prisma', 'dev.db'),
  },
  ollama: {
    url: 'http://localhost:11434',
    defaultModel: 'llama2',
    maxConcurrentRequests: 2, // Prevent overloading the local machine
  },
  chromadb: {
    directory: path.join(process.cwd(), 'chroma_db'),
    pythonPath: 'python', // Assumes Python is in PATH
  },
  system: {
    tempDir: path.join(os.tmpdir(), 'annotation-platform'),
    cacheDir: path.join(process.cwd(), '.cache'),
    dataDir: path.join(process.cwd(), 'data'),
    maxConcurrency: Math.max(1, Math.floor(os.cpus().length / 2)), // Use half of available CPU cores
  },
};

// Load configuration from environment variables if available
export const loadDeploymentConfig = (): DeploymentConfig => {
  const config = { ...defaultConfig };
  
  // Database configuration
  if (process.env.DATABASE_TYPE === 'postgres') {
    config.database = {
      type: 'postgres',
      postgresConfig: {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        database: process.env.POSTGRES_DB || 'annotation_platform',
      },
    };
  } else if (process.env.SQLITE_PATH) {
    config.database = {
      type: 'sqlite',
      sqlitePath: process.env.SQLITE_PATH,
    };
  }
  
  // Ollama configuration
  if (process.env.OLLAMA_URL) {
    config.ollama.url = process.env.OLLAMA_URL;
  }
  if (process.env.OLLAMA_DEFAULT_MODEL) {
    config.ollama.defaultModel = process.env.OLLAMA_DEFAULT_MODEL;
  }
  if (process.env.OLLAMA_MAX_CONCURRENT) {
    config.ollama.maxConcurrentRequests = parseInt(process.env.OLLAMA_MAX_CONCURRENT, 10);
  }
  
  // ChromaDB configuration
  if (process.env.CHROMADB_DIR) {
    config.chromadb.directory = process.env.CHROMADB_DIR;
  }
  if (process.env.PYTHON_PATH) {
    config.chromadb.pythonPath = process.env.PYTHON_PATH;
  }
  
  // System configuration
  if (process.env.TEMP_DIR) {
    config.system.tempDir = process.env.TEMP_DIR;
  }
  if (process.env.CACHE_DIR) {
    config.system.cacheDir = process.env.CACHE_DIR;
  }
  if (process.env.DATA_DIR) {
    config.system.dataDir = process.env.DATA_DIR;
  }
  if (process.env.MAX_CONCURRENCY) {
    config.system.maxConcurrency = parseInt(process.env.MAX_CONCURRENCY, 10);
  }
  
  return config;
};

export const deploymentConfig = loadDeploymentConfig();
