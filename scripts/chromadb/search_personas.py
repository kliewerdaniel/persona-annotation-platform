# scripts/chromadb/search_personas.py
import sys
import json
import chromadb
from chromadb.utils import embedding_functions

def main():
    if len(sys.argv) != 4:
        print("Usage: python search_personas.py <query> <limit> <chroma_dir>")
        sys.exit(1)
    
    query = sys.argv[1]
    limit = int(sys.argv[2])
    chroma_dir = sys.argv[3]
    
    # Initialize ChromaDB client
    client = chromadb.PersistentClient(path=chroma_dir)
    
    # Use sentence-transformers for embeddings
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Get collection
    try:
        collection = client.get_collection(
            name="personas",
            embedding_function=sentence_transformer_ef
        )
        
        # Search for similar personas
        results = collection.query(
            query_texts=[query],
            n_results=limit
        )
        
        # Format results
        formatted_results = []
        for i in range(len(results['ids'][0])):
            formatted_results.append({
                'id': results['ids'][0][i],
                'score': results['distances'][0][i] if 'distances' in results else 0,
                'metadata': results['metadatas'][0][i]
            })
        
        print(json.dumps(formatted_results))
        
    except Exception as e:
        print(json.dumps([]))
        sys.exit(0)

if __name__ == "__main__":
    main()
