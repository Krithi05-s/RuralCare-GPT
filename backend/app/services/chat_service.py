import os
from typing import List, Optional
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from app.services.rag_service import get_rag_service
from langchain_groq import ChatGroq

class ChatService:
    def __init__(self):
        self.model_name = os.getenv("OLLAMA_MODEL", "llama3")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.system_prompt = (
            "You are an AI Multimodal Rural Healthcare Assistant. "
            "Your goal is to provide preliminary health guidance, first-aid recommendations, and precautions. "
            "Guidelines: 1. Always include a medical disclaimer. 2. Do NOT provide official medical diagnoses. "
            "3. Suggest visiting a hospital if symptoms seem severe. 4. Use the provided context from the "
            "medical knowledge base when available. 5. Be empathetic and clear, especially for rural users. "
            "6. If the user mentions chest pain, breathing difficulty, or severe swelling, treat it as an emergency."
        )
        
        # Pre-initialize chat model (Ollama or Groq fallback)
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                groq_model = os.getenv("GROQ_MODEL", "llama3-8b-8192")
                self.chat = ChatGroq(
                    groq_api_key=groq_key,
                    model_name=groq_model,
                    temperature=0.4
                )
                print(f"Initialized ChatGroq with model {groq_model}")
            except Exception as e:
                print(f"Failed to initialize ChatGroq: {e}. Falling back to ChatOllama.")
                self.chat = ChatOllama(
                    base_url=self.base_url,
                    model=self.model_name,
                    temperature=0.4
                )
        else:
            self.chat = ChatOllama(
                base_url=self.base_url,
                model=self.model_name,
                temperature=0.4
            )

    def _is_incomplete_query(self, query: str) -> bool:
        q = query.lower().strip().replace("?", "").replace(".", "").replace(",", "")
        vague_keywords = [
            "what precautions to take", "wt precaution to take", "what precaution to take",
            "precautions to take", "first aid to take", "what is the treatment",
            "how to cure it", "what is the first aid", "first aid steps", "treatment options",
            "what to do", "what should i do", "how to treat", "how to cure", "treatment",
            "first aid", "firstaid", "precaution", "precautions", "give precautions"
        ]
        if q in vague_keywords:
            return True
        if len(q.split()) <= 4:
            if any(k in q for k in ["precaution", "first aid", "firstaid", "treatment", "how to treat", "how to cure"]):
                common_symptoms = ["fever", "cough", "cold", "headache", "pain", "rash", "bite", "burn", "vomit", "wound", "swelling"]
                if not any(sym in q for sym in common_symptoms):
                    return True
        return False

    async def get_response(self, user_message: str, history: Optional[List[dict]] = None):
        if self._is_incomplete_query(user_message):
            return "Could you please specify which symptoms, injury, or disease you are referring to? For example, let me know if you are asking about a skin rash, fever, snake bite, or burn, so I can provide the correct precautions or first-aid guidance."

        if history is None:
            history = []
            
        try:
            # Retrieve relevant context from RAG
            rag_service = get_rag_service()
            context = rag_service.query(user_message)
            context_text = "\n".join(context)
            
            # Build message sequence
            messages = [
                SystemMessage(content=f"{self.system_prompt}\n\nRelevant Context:\n{context_text}"),
            ]
            
            # Add history safely
            for msg in history[-5:]:
                role = msg.get("role")
                content = msg.get("content", "")
                if role == "user":
                    messages.append(HumanMessage(content=content))
                elif role in ["bot", "assistant"]:
                    messages.append(AIMessage(content=content))
                    
            # Add current user message
            messages.append(HumanMessage(content=user_message))
            
            # Use invoke
            response = self.chat.invoke(messages)
            return response.content
            
        except Exception as e:
            print(f"Chat API error (Ollama): {str(e)}")
            return self._mock_response(user_message)

    async def get_streaming_response(self, user_message: str, history: Optional[List[dict]] = None):
        if self._is_incomplete_query(user_message):
            yield "Could you please specify which symptoms, injury, or disease you are referring to? For example, let me know if you are asking about a skin rash, fever, snake bite, or burn, so I can provide the correct precautions or first-aid guidance."
            return

        if history is None:
            history = []
            
        try:
            rag_service = get_rag_service()
            context = rag_service.query(user_message)
            context_text = "\n".join(context)
            
            messages = [
                SystemMessage(content=f"{self.system_prompt}\n\nRelevant Context:\n{context_text}"),
            ]
            
            for msg in history[-5:]:
                role = msg.get("role")
                content = msg.get("content", "")
                if role == "user":
                    messages.append(HumanMessage(content=content))
                elif role in ["bot", "assistant"]:
                    messages.append(AIMessage(content=content))
                    
            messages.append(HumanMessage(content=user_message))
            
            # Stream tokens
            async for chunk in self.chat.astream(messages):
                yield chunk.content
                
        except Exception as e:
            print(f"Streaming Chat error: {str(e)}")
            yield f"Error: {str(e)}"

    def _mock_response(self, user_message: str) -> str:
        # Fallback response if Ollama is not available
        msg_lower = user_message.lower()
        
        if "snake" in msg_lower:
            return "MEDICAL DISCLAIMER: I am an AI, not a doctor.\n\nFor snake bites: Keep the person calm and still. Immobilize the bitten limb and keep it below heart level. Seek immediate medical attention. Do NOT try to suck the venom out."
        
        if any(kw in msg_lower for kw in ["chest pain", "breathing", "heart"]):
            return "EMERGENCY WARNING: These symptoms can be very serious. Please seek immediate medical help at a hospital emergency department. Do not delay."
        
        return (
            "I understand you're asking about health issues. However, I am currently unable to connect to the "
            "local AI engine (Ollama). Please ensure Ollama is running (e.g., `ollama run llama3`). "
            "(Disclaimer: This is a preliminary AI assistant response)."
        )

    async def generate_symptom_assessment(self, symptoms: List[str]) -> dict:
        import json
        prompt = (
            f"You are a medical AI diagnostic engine. A user has reported the following symptoms: {', '.join(symptoms)}.\n"
            "Based on your medical knowledge, predict the most likely condition. "
            "You MUST respond ONLY with a valid JSON object. Do not include markdown formatting like ```json. "
            "The JSON must have these exact keys:\n"
            "- \"condition\" (string)\n"
            "- \"risk_level\" (string: 'Low', 'Moderate', 'High', or 'Critical')\n"
            "- \"confidence\" (number between 0 and 100)\n"
        )
        try:
            response = self.chat.invoke([SystemMessage(content=prompt)])
            text = response.content.strip()
            
            # Clean up markdown formatting if the model still includes it
            if text.startswith("```json"):
                text = text.replace("```json", "", 1).strip()
            if text.endswith("```"):
                text = text[:-3].strip()
                
            data = json.loads(text)
            
            # Ensure required keys exist
            return {
                "condition": str(data.get("condition", "Unknown Condition (Generative)")),
                "risk_level": str(data.get("risk_level", "Moderate")),
                "confidence": float(data.get("confidence", 70.0))
            }
        except Exception as e:
            print(f"Error generating assessment: {e}")
            return None

chat_service = ChatService()
