import os
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import CharacterTextSplitter

class RAGService:
    def __init__(self):
        try:
            from langchain_huggingface import HuggingFaceEmbeddings
            self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
            print("Initialized HuggingFaceEmbeddings successfully (fast in-memory).")
        except Exception as e:
            print(f"Failed to initialize HuggingFaceEmbeddings: {e}. Falling back to OllamaEmbeddings.")
            self.embeddings = OllamaEmbeddings(model="llama3")

        self.persist_directory = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../vector_store"))
        self.data_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/medical_faqs.md"))
        os.makedirs(self.persist_directory, exist_ok=True)
        self.vector_db = None
        self._initialize_vector_db()

    def _initialize_vector_db(self):
        try:
            if os.path.exists(self.persist_directory) and os.listdir(self.persist_directory):
                self.vector_db = Chroma(persist_directory=self.persist_directory, embedding_function=self.embeddings)
                print("Vector DB loaded from disk.")
            else:
                self._build_vector_db()
        except Exception as e:
            print(f"Error initializing vector DB: {e}")
            self._build_vector_db()

    def _build_vector_db(self):
        try:
            if not os.path.exists(self.data_path):
                print(f"Medical FAQs not found at {self.data_path}")
                return
            
            loader = TextLoader(self.data_path)
            documents = loader.load()
            text_splitter = CharacterTextSplitter(chunk_size=500, chunk_overlap=50)
            texts = text_splitter.split_documents(documents)
            
            self.vector_db = Chroma.from_documents(
                documents=texts, 
                embedding=self.embeddings, 
                persist_directory=self.persist_directory
            )
            self.vector_db.persist()
            print("Vector DB built and persisted.")
        except Exception as e:
            print(f"Error building vector DB: {e}")

    def query(self, query_text: str, k: int = 3):
        if not self.vector_db:
            return []
        
        try:
            docs = self.vector_db.similarity_search(query_text, k=k)
            return [doc.page_content for doc in docs]
        except Exception as e:
            print(f"RAG query error: {e}")
            return []

_rag_service = None

def get_rag_service():
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService()
    return _rag_service
