// src/app/help/troubleshooting/page.tsx
export default function TroubleshootingPage() {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Troubleshooting Guide</h1>
        
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">Ollama Issues</h2>
            
            <div className="space-y-4">
              <div className="border rounded p-4">
                <h3 className="text-lg font-bold mb-2">Cannot connect to Ollama</h3>
                <p className="mb-3">If you see error messages about failing to connect to Ollama, try the following:</p>
                
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Ensure Ollama is installed and running on your machine.</li>
                  <li>Check if Ollama is accessible at <code>http://localhost:11434</code>.</li>
                  <li>Verify that the URL in your <code>.env.local</code> file matches your Ollama installation.</li>
                  <li>Restart both Ollama and the annotation platform.</li>
                </ol>
                
                <div className="mt-3 p-3 bg-gray-100 rounded">
                  <p className="font-bold">Command to check Ollama:</p>
                  <pre className="whitespace-pre-wrap overflow-x-auto">
                    curl http://localhost:11434/api/tags
                  </pre>
                </div>
              </div>
              
              <div className="border rounded p-4">
                <h3 className="text-lg font-bold mb-2">Model not found</h3>
                <p className="mb-3">If you get "model not found" errors, follow these steps:</p>
                
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Pull the required model with Ollama CLI: <code>ollama pull llama2</code> (replace llama2 with your model).</li>
                  <li>Verify available models: <code>ollama list</code></li>
                  <li>Ensure the model name in your configuration matches exactly (case-sensitive).</li>
                </ol>
              </div>
              
              <div className="border rounded p-4">
                <h3 className="text-lg font-bold mb-2">Slow Model Responses</h3>
                <p className="mb-3">If model responses are very slow, consider:</p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>Using a smaller model (e.g., Mistral 7B instead of larger models).</li>
                  <li>Reducing the maximum token length in your requests.</li>
                  <li>Checking if your machine has sufficient resources (CPU/RAM/GPU).</li>
                  <li>Closing other resource-intensive applications.</li>
                </ul>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-4">Database Issues</h2>
            
            <div className="space-y-4">
              <div className="border rounded p-4">
                <h3 className="text-lg font-bold mb-2">Failed Database Connection</h3>
                <p className="mb-3">If the application cannot connect to the database:</p>
                
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Verify that your database configuration in <code>.env.local</code> is correct.</li>
                  <li>For SQLite, ensure the directory is writable.</li>
                  <li>For PostgreSQL, ensure the server is running and accessible.</li>
                  <li>Try regenerating the Prisma client: <code>npx prisma generate</code></li>
                </ol>
              </div>
              
              <div className="border rounded p-4">
                <h3 className="text-lg font-bold mb-2">Migration Issues</h3>
                <p className="mb-3">If database migrations fail:</p>
                
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Reset the database if it's in development: <code>npx prisma migrate reset</code></li>
                  <li>Check for syntax errors in your schema.prisma file.</li>
                  <li>Ensure you have proper permissions to create/alter tables.</li>
                </ol>
                
                <div className="mt-3 p-3 bg-gray-100 rounded">
                  <p className="font-bold">Command to apply migrations:</p>
                  <pre className="whitespace-pre-wrap overflow-x-auto">
                    npx prisma migrate dev --name update
                  </pre>
                </div>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-4">ChromaDB Issues</h2>
            
            <div className="space-y-4">
              <div className="border rounded p-4">
                <h3 className="text-lg font-bold mb-2">ChromaDB Not Found</h3>
                <p className="mb-3">If the application cannot connect to ChromaDB:</p>
                
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Ensure Python and required packages are installed: <code>pip install chromadb sentence-transformers</code></li>
                  <li>Verify that the ChromaDB directory exists and is writable.</li>
                  <li>Check if the Python path in your configuration is correct.</li>
                </ol>
              </div>
              
              <div className="border rounded p-4">
                <h3 className="text-lg font-bold mb-2">Import Error or Module Not Found</h3>
                <p className="mb-3">If you see Python import errors:</p>
                
                <ol className="list-decimal pl-5 space-y-2">
                  <li>Ensure you've installed all required packages.</li>
                  <li>Try creating a dedicated virtual environment for Python.</li>
                  <li>For Windows, ensure Python is in your PATH environment variable.</li>
                </ol>
                
                <div className="mt-3 p-3 bg-gray-100 rounded">
                  <p className="font-bold">Command to check Python packages:</p>
                  <pre className="whitespace-pre-wrap overflow-x-auto">
                    python -c "import sys; print(sys.executable); import chromadb; print('ChromaDB imported successfully')"
                  </pre>
                </div>
              </div>
            </div>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold mb-4">Performance Issues</h2>
            
            <div className="space-y-4">
              <div className="border rounded p-4">
                <h3 className="text-lg font-bold mb-2">High Memory Usage</h3>
                <p className="mb-3">If the application is using excessive memory:</p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>Reduce the number of concurrent requests in <code>.env.local</code> (MAX_CONCURRENCY=1).</li>
                  <li>Use smaller AI models.</li>
                  <li>Implement regular cache clearing.</li>
                  <li>Close other memory-intensive applications.</li>
                </ul>
              </div>
              
              <div className="border rounded p-4">
                <h3 className="text-lg font-bold mb-2">Slow Application Startup</h3>
                <p className="mb-3">If the application takes a long time to start:</p>
                
                <ul className="list-disc pl-5 space-y-2">
                  <li>Check the database size and consider optimizing or cleaning unused data.</li>
                  <li>Ensure ChromaDB data directory isn't excessively large.</li>
                  <li>Consider using the development build for faster startup during development.</li>
                </ul>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }
  