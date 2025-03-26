// scripts/setup-local-environment.js
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const os = require('os');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) => new Promise(resolve => rl.question(question, resolve));

const configFile = path.join(process.cwd(), '.env.local');

async function main() {
  console.log('=== Local Annotation Platform Setup ===');
  console.log('This script will help you set up a local development environment.\n');
  
  // Check for required software
  checkRequirements();
  
  // Database configuration
  const dbType = await ask('Which database would you like to use? (sqlite/postgres) [sqlite]: ');
  
  let databaseConfig = '';
  
  if (dbType.toLowerCase() === 'postgres') {
    console.log('\nConfiguring PostgreSQL:');
    
    const pgHost = await ask('PostgreSQL host [localhost]: ');
    const pgPort = await ask('PostgreSQL port [5432]: ');
    const pgUser = await ask('PostgreSQL username [postgres]: ');
    const pgPassword = await ask('PostgreSQL password: ');
    const pgDatabase = await ask('PostgreSQL database name [annotation_platform]: ');
    
    databaseConfig = `
# Database Configuration
DATABASE_TYPE=postgres
POSTGRES_HOST=${pgHost || 'localhost'}
POSTGRES_PORT=${pgPort || '5432'}
POSTGRES_USER=${pgUser || 'postgres'}
POSTGRES_PASSWORD=${pgPassword}
POSTGRES_DB=${pgDatabase || 'annotation_platform'}
DATABASE_URL="postgresql://${pgUser || 'postgres'}:${pgPassword}@${pgHost || 'localhost'}:${pgPort || '5432'}/${pgDatabase || 'annotation_platform'}?schema=public"
`;
  } else {
    databaseConfig = `
# Database Configuration
DATABASE_TYPE=sqlite
SQLITE_PATH="./prisma/dev.db"
DATABASE_URL="file:./dev.db"
`;
  }
  
  // Ollama configuration
  console.log('\nConfiguring Ollama:');
  
  const ollamaUrl = await ask('Ollama API URL [http://localhost:11434]: ');
  const ollamaModel = await ask('Default Ollama model [llama2]: ');
  const ollmaMaxConcurrent = await ask('Maximum concurrent Ollama requests [2]: ');
  
  const ollamaConfig = `
# Ollama Configuration
OLLAMA_URL=${ollamaUrl || 'http://localhost:11434'}
OLLAMA_DEFAULT_MODEL=${ollamaModel || 'llama2'}
OLLAMA_MAX_CONCURRENT=${ollmaMaxConcurrent || '2'}
NEXT_PUBLIC_OLLAMA_BASE_URL=${ollamaUrl || 'http://localhost:11434'}
NEXT_PUBLIC_OLLAMA_DEFAULT_MODEL=${ollamaModel || 'llama2'}
`;
  
  // ChromaDB configuration
  console.log('\nConfiguring ChromaDB:');
  
  const chromaDir = await ask(`ChromaDB directory [${path.join(process.cwd(), 'chroma_db')}]: `);
  const pythonPath = await ask('Python executable path [python]: ');
  
  const chromaConfig = `
# ChromaDB Configuration
CHROMADB_DIR=${chromaDir || path.join(process.cwd(), 'chroma_db')}
PYTHON_PATH=${pythonPath || 'python'}
`;
  
  // System configuration
  console.log('\nConfiguring system parameters:');
  
  const tempDir = await ask(`Temporary directory [${os.tmpdir()}]: `);
  const cacheDir = await ask(`Cache directory [${path.join(process.cwd(), '.cache')}]: `);
  const dataDir = await ask(`Data directory [${path.join(process.cwd(), 'data')}]: `);
  const maxConcurrency = await ask(`Maximum concurrency [${Math.max(1, Math.floor(os.cpus().length / 2))}]: `);
  
  const systemConfig = `
# System Configuration
TEMP_DIR=${tempDir || os.tmpdir()}
CACHE_DIR=${cacheDir || path.join(process.cwd(), '.cache')}
DATA_DIR=${dataDir || path.join(process.cwd(), 'data')}
MAX_CONCURRENCY=${maxConcurrency || Math.max(1, Math.floor(os.cpus().length / 2))}
`;
  
  // Write configuration to .env.local
  fs.writeFileSync(configFile, `${databaseConfig}${ollamaConfig}${chromaConfig}${systemConfig}`);
  
  console.log('\nConfiguration saved to .env.local');
  
  // Setup database
  if (dbType.toLowerCase() === 'postgres') {
    console.log('\nSetting up PostgreSQL database...');
    try {
      execSync('npx prisma migrate dev --name init');
      console.log('Database migrations applied successfully.');
    } catch (error) {
      console.error('\nError setting up PostgreSQL database:');
      console.error(error.message);
      console.log('\nMake sure your PostgreSQL server is running and accessible.');
    }
  } else {
    console.log('\nSetting up SQLite database...');
    try {
      execSync('npx prisma migrate dev --name init');
      console.log('Database migrations applied successfully.');
    } catch (error) {
      console.error('\nError setting up SQLite database:');
      console.error(error.message);
    }
  }
  
  // Create required directories
  createDirectories([
    chromaDir || path.join(process.cwd(), 'chroma_db'),
    cacheDir || path.join(process.cwd(), '.cache'),
    dataDir || path.join(process.cwd(), 'data'),
    path.join(process.cwd(), 'scripts', 'chromadb'),
    path.join(process.cwd(), 'scripts', 'system'),
  ]);
  
  // Check Ollama installation
  checkOllama(ollamaUrl || 'http://localhost:11434', ollamaModel || 'llama2');
  
  // Check ChromaDB installation
  checkChromaDB(pythonPath || 'python');
  
  console.log('\n=== Setup Complete ===');
  console.log('You can now start the application with:');
  console.log('  npm run dev');
  console.log('\nMake sure Ollama is running with your preferred model.');
  
  rl.close();
}

function checkRequirements() {
  console.log('Checking system requirements...');
  
  // Check Node.js
  try {
    const nodeVersion = execSync('node --version').toString().trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
  } catch (error) {
    console.error('❌ Node.js: Not found or not in PATH');
    console.error('Please install Node.js v18.17.0 or later');
    process.exit(1);
  }
  
  // Check npm
  try {
    const npmVersion = execSync('npm --version').toString().trim();
    console.log(`✅ npm: ${npmVersion}`);
  } catch (error) {
    console.error('❌ npm: Not found or not in PATH');
    console.error('Please ensure npm is installed with Node.js');
    process.exit(1);
  }
  
  // Check Python
  try {
    const pythonVersion = execSync('python --version').toString().trim();
    console.log(`✅ Python: ${pythonVersion}`);
  } catch (error) {
    try {
      const python3Version = execSync('python3 --version').toString().trim();
      console.log(`✅ Python: ${python3Version}`);
    } catch (error) {
      console.error('❌ Python: Not found or not in PATH');
      console.error('Please install Python 3.9 or later');
      process.exit(1);
    }
  }
  
  console.log('All system requirements met.\n');
}

function createDirectories(dirs) {
  console.log('\nCreating required directories...');
  
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } else {
        console.log(`✅ Directory already exists: ${dir}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create directory ${dir}: ${error.message}`);
    }
  }
}

async function checkOllama(ollamaUrl, defaultModel) {
  console.log('\nChecking Ollama installation...');
  
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`);
    
    if (response.ok) {
      console.log('✅ Ollama is running');
      
      const data = await response.json();
      const models = data.models ? data.models.map(model => model.name) : [];
      
      if (models.length > 0) {
        console.log(`Available models: ${models.join(', ')}`);
        
        if (models.includes(defaultModel)) {
          console.log(`✅ Default model "${defaultModel}" is available`);
        } else {
          console.log(`❌ Default model "${defaultModel}" is not available`);
          console.log(`You can pull it with: ollama pull ${defaultModel}`);
        }
      } else {
        console.log('No models found. You need to pull a model:');
        console.log(`  ollama pull ${defaultModel}`);
      }
    } else {
      console.log('❌ Ollama is not running or not accessible at the specified URL');
      console.log('Please start Ollama before running the application');
    }
  } catch (error) {
    console.error('❌ Ollama check failed:', error.message);
    console.log('Please ensure Ollama is installed and running:');
    console.log('  https://ollama.ai/download');
  }
}

async function checkChromaDB(pythonPath) {
  console.log('\nChecking ChromaDB installation...');
  
  try {
    execSync(`${pythonPath} -c "import chromadb"`);
    console.log('✅ ChromaDB Python package is installed');
  } catch (error) {
    console.error('❌ ChromaDB Python package is not installed');
    console.log('Installing ChromaDB and sentence-transformers...');
    
    try {
      execSync(`${pythonPath} -m pip install chromadb sentence-transformers`);
      console.log('✅ ChromaDB and sentence-transformers installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install ChromaDB:', installError.message);
      console.log('Please install manually with:');
      console.log('  pip install chromadb sentence-transformers');
    }
  }
}

main().catch(error => {
  console.error('Setup failed:', error);
  rl.close();
  process.exit(1);
});
