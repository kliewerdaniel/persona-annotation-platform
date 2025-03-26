# scripts/chromadb/delete_persona.py
import sys
import chromadb
from chromadb.utils import embedding_functions

def main():
    if len(sys.argv) != 3:
        print("Usage: python delete_persona.py <persona_id> <chroma_dir>")
        sys.exit(1)
    
    persona_id = sys.argv[1]
    chroma_dir = sys.argv[2]
    
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
        
        # Delete persona
        collection.delete(
            ids=[persona_id]
        )
        
        print(f"Successfully deleted persona: {persona_id}")
        
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
