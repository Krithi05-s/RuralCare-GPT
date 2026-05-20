import os
from typing import List, Optional

from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_groq import ChatGroq

from app.services.rag_service import get_rag_service


class ChatService:
    def __init__(self):

        # Ollama settings
        self.ollama_model = os.getenv("OLLAMA_MODEL", "llama3")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

        # Groq settings
        self.groq_model = os.getenv(
            "GROQ_MODEL",
            "llama-3.3-70b-versatile"
        )

        self.system_prompt = (
            "You are an AI Multimodal Rural Healthcare Assistant. "
            "Your goal is to provide preliminary health guidance, "
            "first-aid recommendations, and precautions. "
            "Guidelines: "
            "1. Always include a medical disclaimer. "
            "2. Do NOT provide official medical diagnoses. "
            "3. Suggest visiting a hospital if symptoms seem severe. "
            "4. Use the provided context from the medical knowledge base when available. "
            "5. Be empathetic and clear, especially for rural users. "
            "6. If the user mentions chest pain, breathing difficulty, "
            "or severe swelling, treat it as an emergency."
        )

        groq_key = os.getenv("GROQ_API_KEY")

        # -------------------------------
        # Initialize Chat Model
        # -------------------------------
        if groq_key:
            try:
                self.chat = ChatGroq(
                    groq_api_key=groq_key,
                    model_name=self.groq_model,
                    temperature=0.4
                )

                print(f"[INFO] Using Groq Model: {self.groq_model}")

            except Exception as e:
                print(f"[ERROR] Failed to initialize Groq: {e}")
                print("[INFO] Falling back to Ollama...")

                self.chat = ChatOllama(
                    base_url=self.base_url,
                    model=self.ollama_model,
                    temperature=0.4
                )

        else:
            print("[INFO] GROQ_API_KEY not found. Using Ollama.")

            self.chat = ChatOllama(
                base_url=self.base_url,
                model=self.ollama_model,
                temperature=0.4
            )

    # -------------------------------------------------
    # Check vague queries
    # -------------------------------------------------
    def _is_incomplete_query(self, query: str) -> bool:

        q = query.lower().strip()
        q = q.replace("?", "").replace(".", "").replace(",", "")

        vague_keywords = [
            "what precautions to take",
            "wt precaution to take",
            "what precaution to take",
            "precautions to take",
            "first aid to take",
            "what is the treatment",
            "how to cure it",
            "what is the first aid",
            "first aid steps",
            "treatment options",
            "what to do",
            "what should i do",
            "how to treat",
            "how to cure",
            "treatment",
            "first aid",
            "firstaid",
            "precaution",
            "precautions",
            "give precautions"
        ]

        if q in vague_keywords:
            return True

        if len(q.split()) <= 4:
            if any(k in q for k in [
                "precaution",
                "first aid",
                "firstaid",
                "treatment",
                "how to treat",
                "how to cure"
            ]):

                common_symptoms = [
                    "fever",
                    "cough",
                    "cold",
                    "headache",
                    "pain",
                    "rash",
                    "bite",
                    "burn",
                    "vomit",
                    "wound",
                    "swelling"
                ]

                if not any(sym in q for sym in common_symptoms):
                    return True

        return False

    # -------------------------------------------------
    # Main Chat Response
    # -------------------------------------------------
    async def get_response(
        self,
        user_message: str,
        history: Optional[List[dict]] = None
    ):

        if self._is_incomplete_query(user_message):
            return (
                "Could you please specify which symptoms, injury, "
                "or disease you are referring to? "
                "For example: fever, skin rash, snake bite, burn, etc."
            )

        if history is None:
            history = []

        try:
            # Retrieve RAG context
            rag_service = get_rag_service()

            context = rag_service.query(user_message)

            context_text = "\n".join(context)

            messages = [
                SystemMessage(
                    content=f"{self.system_prompt}\n\nRelevant Context:\n{context_text}"
                )
            ]

            # Add conversation history
            for msg in history[-5:]:

                role = msg.get("role")
                content = msg.get("content", "")

                if role == "user":
                    messages.append(HumanMessage(content=content))

                elif role in ["assistant", "bot"]:
                    messages.append(AIMessage(content=content))

            # Current message
            messages.append(HumanMessage(content=user_message))

            # Generate response
            response = self.chat.invoke(messages)

            return response.content

        except Exception as e:

            print(f"[ERROR] Chat Response Error: {e}")

            return self._mock_response(user_message)

    # -------------------------------------------------
    # Streaming Response
    # -------------------------------------------------
    async def get_streaming_response(
        self,
        user_message: str,
        history: Optional[List[dict]] = None
    ):

        if self._is_incomplete_query(user_message):
            yield (
                "Could you please specify which symptoms, injury, "
                "or disease you are referring to?"
            )
            return

        if history is None:
            history = []

        try:
            rag_service = get_rag_service()

            context = rag_service.query(user_message)

            context_text = "\n".join(context)

            messages = [
                SystemMessage(
                    content=f"{self.system_prompt}\n\nRelevant Context:\n{context_text}"
                )
            ]

            for msg in history[-5:]:

                role = msg.get("role")
                content = msg.get("content", "")

                if role == "user":
                    messages.append(HumanMessage(content=content))

                elif role in ["assistant", "bot"]:
                    messages.append(AIMessage(content=content))

            messages.append(HumanMessage(content=user_message))

            async for chunk in self.chat.astream(messages):
                yield chunk.content

        except Exception as e:

            print(f"[ERROR] Streaming Error: {e}")

            yield "An error occurred while generating the response."

    # -------------------------------------------------
    # Mock/Fallback Response
    # -------------------------------------------------
    def _mock_response(self, user_message: str) -> str:

        msg_lower = user_message.lower()

        if "snake" in msg_lower:
            return (
                "MEDICAL DISCLAIMER: I am not a doctor.\n\n"
                "For snake bites: Keep the person calm and still. "
                "Immobilize the bitten limb and seek immediate medical attention."
            )

        if any(kw in msg_lower for kw in [
            "chest pain",
            "breathing",
            "heart"
        ]):
            return (
                "EMERGENCY WARNING: These symptoms may be serious. "
                "Please visit the nearest hospital immediately."
            )

        return (
            "The AI healthcare assistant is temporarily unavailable. "
            "Please check whether Ollama or Groq API is properly configured."
        )

    # -------------------------------------------------
    # Symptom Assessment
    # -------------------------------------------------
    async def generate_symptom_assessment(
        self,
        symptoms: List[str]
    ) -> dict:

        import json

        prompt = (
            f"Symptoms: {', '.join(symptoms)}.\n"
            "Predict the most likely condition.\n"
            "Return ONLY valid JSON with keys:\n"
            "condition, risk_level, confidence"
        )

        try:

            response = self.chat.invoke([
                SystemMessage(content=prompt)
            ])

            text = response.content.strip()

            if text.startswith("```json"):
                text = text.replace("```json", "").strip()

            if text.endswith("```"):
                text = text[:-3].strip()

            data = json.loads(text)

            return {
                "condition": str(
                    data.get("condition", "Unknown Condition")
                ),
                "risk_level": str(
                    data.get("risk_level", "Moderate")
                ),
                "confidence": float(
                    data.get("confidence", 70.0)
                )
            }

        except Exception as e:

            print(f"[ERROR] Assessment Error: {e}")

            return {
                "condition": "Unknown",
                "risk_level": "Moderate",
                "confidence": 50.0
            }


chat_service = ChatService()