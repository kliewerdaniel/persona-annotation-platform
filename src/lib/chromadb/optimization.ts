// src/lib/chromadb/optimization.ts
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { deploymentConfig } from '../config/deployment';

export class ChromaDBOptimization {
  async compactDatabase(): Promise<{ success: boolean; message: string }> {
    const scriptPath = path.join(process.cwd(), 'scripts', 'chromadb', 'compact.py');
    
    // Create the script if it doesn't exist
    if (!fs.existsSync(scriptPath)) {
      this.createCompactScript(scriptPath);
    }
    
    try {
      const output = await this.runPythonScript(
        deploymentConfig.chromadb.pythonPath,
        [scriptPath, deploymentConfig.chromadb.directory]
      );
      
      return JSON.parse(output);
    } catch (error) {
      console.error('Error compacting ChromaDB:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  async reindexDatabase(): Promise<{ success: boolean; message: string }> {
    const scriptPath = path.join(process.cwd(), 'scripts', 'chromadb', 'reindex.py');
    
    // Create the script if it doesn't exist
    if (!fs.existsSync(scriptPath)) {
      this.createReindexScript(scriptPath);
    }
    
    try {
      const output = await this.runPythonScript(
        deploymentConfig.chromadb.pythonPath,
        [scriptPath, deploymentConfig.chromadb.directory]
      );
      
      return JSON.parse(output);
    } catch (error) {
      console.error('Error reindexing ChromaDB:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  
  private runPythonScript(pythonPath: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const process = spawn(pythonPath, args);
      
      let output = '';
      let errorOutput = '';
      
      process.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      process.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script error: ${errorOutput}`));
        } else {
          resolve(output.trim());
        }
      });
    });
  }
  
  private createCompactScript(scriptPath: string) {
    const scriptDir = path.dirname(scriptPath);
    
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }
    
    const scriptContent = `
import sys
import json
import os
import shutil
import tempfile

def compact_chromadb(chroma_dir):
    try:
        import chromadb
        
        # Check if ChromaDB directory exists
        if not os.path.exists(chroma_dir):
            return {
                "success": False,
                "message": f"ChromaDB directory {chroma_dir} does not exist"
            }
        
        # Create a temporary directory for the new database
        temp_dir = tempfile.mkdtemp()
        
        # Create new client for the temporary directory
        temp_client = chromadb.PersistentClient(path=temp_dir)
        
        # Create original client
        original_client = chromadb.PersistentClient(path=chroma_dir)
        
        # Get all collections
        collections = original_client.list_collections()
        
        # Copy each collection to the temporary client
        for collection_info in collections:
            collection_name = collection_info.name
            
            # Get original collection
            original_collection = original_client.get_collection(name=collection_name)
            
            # Create new collection
            new_collection = temp_client.create_collection(name=collection_name)
            
            # Get all items
            items = original_collection.get(include=["documents", "metadatas", "embeddings"])
            
            # Skip if no items
            if not items["ids"]:
                continue
                
            # Add items to new collection
            new_collection.add(
                ids=items["ids"],
                documents=items["documents"],
                metadatas=items["metadatas"],
                embeddings=items["embeddings"]
            )
        
        # Close clients
        del original_client
        del temp_client
        
        # Backup original directory
        backup_dir = f"{chroma_dir}_backup"
        if os.path.exists(backup_dir):
            shutil.rmtree(backup_dir)
        
        shutil.move(chroma_dir, backup_dir)
        
        # Move temp directory to original location
        shutil.move(temp_dir, chroma_dir)
        
        return {
            "success": True,
            "message": f"ChromaDB compacted successfully. Original data backed up to {backup_dir}"
        }
    except ImportError:
        return {
            "success": False,
            "message": "ChromaDB Python package is not installed"
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "message": "ChromaDB directory path not provided"
        }))
        sys.exit(1)
    
    chroma_dir = sys.argv[1]
    result = compact_chromadb(chroma_dir)
    print(json.dumps(result))
`;
    
    fs.writeFileSync(scriptPath, scriptContent);
  }
  
  private createReindexScript(scriptPath: string) {
    const scriptDir = path.dirname(scriptPath);
    
    if (!fs.existsSync(scriptDir)) {
      fs.mkdirSync(scriptDir, { recursive: true });
    }
    
    const scriptContent = `
import sys
import json
import os

def reindex_chromadb(chroma_dir):
    try:
        import chromadb
        from chromadb.utils import embedding_functions
        
        # Check if ChromaDB directory exists
        if not os.path.exists(chroma_dir):
            return {
                "success": False,
                "message": f"ChromaDB directory {chroma_dir} does not exist"
            }
        
        # Initialize client
        client = chromadb.PersistentClient(path=chroma_dir)
        
        # Use sentence-transformers for embeddings
        sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        # Get all collections
        collections = client.list_collections()
        
        reindexed_count = 0
        
        # Reindex each collection
        for collection_info in collections:
            collection_name = collection_info.name
            
            # Get collection
            collection = client.get_collection(
                name=collection_name,
                embedding_function=sentence_transformer_ef
            )
            
            # Get all items
            items = collection.get(include=["documents", "metadatas"])
            
            # Skip if no items
            if not items["ids"]:
                continue
                
            # Recompute embeddings and update
            collection.update(
                ids=items["ids"],
                documents=items["documents"],
                metadatas=items["metadatas"]
            )
            
            reindexed_count += len(items["ids"])
        
        return {
            "success": True,
            "message": f"ChromaDB reindexed successfully. {reindexed_count} items reindexed across {len(collections)} collections."
        }
    except ImportError:
        return {
            "success": False,
            "message": "ChromaDB Python package is not installed"
        }
    except Exception as e:
        return {
            "success": False,
            "message": str(e)
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "message": "ChromaDB directory path not provided"
        }))
        sys.exit(1)
    
    chroma_dir = sys.argv[1]
    result = reindex_chromadb(chroma_dir)
    print(json.dumps(result))
`;
    
    fs.writeFileSync(scriptPath, scriptContent);
  }
}

export const chromaDBOptimization = new ChromaDBOptimization();
