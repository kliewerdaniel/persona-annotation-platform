# scripts/chromadb/add_persona.py
import sys
import json
import chromadb
from chromadb.utils import embedding_functions

def main():
    if len(sys.argv) != 5:
        print("Usage: python add_persona.py <persona_id> <text> <metadata_json> <chroma_dir>")
        sys.exit(1)
    
    persona_id = sys.argv[1]
    text = sys.argv[2]
    metadata = json.loads(sys.argv[3])
    chroma_dir = sys.argv[4]
    
    # Initialize ChromaDB client
    client = chromadb.PersistentClient(path=chroma_dir)
    
    # Use sentence-transformers for embeddings
    sentence_transformer_ef = embedding_functions.SentenceTransformerEmbeddingFunction(
        model_name="all-MiniLM-L6-v2"
    )
    
    # Get or create collection
    collection = client.get_or_create_collection(
        name="personas",
        embedding_function=sentence_transformer_ef
    )
    
    # Add or update persona
    collection.upsert(
        ids=[persona_id],
        documents=[text],
        metadatas=[metadata]
    )
    
    print(f"Successfully added persona: {persona_id}")

if __name__ == "__main__":
    main()
