import os
import base64
from langchain_ollama import ChatOllama
from langchain_core.messages import HumanMessage

class ImageAnalysisService:
    def __init__(self):
        groq_key = os.getenv("GROQ_API_KEY")
        if groq_key:
            try:
                from langchain_groq import ChatGroq
                groq_model = os.getenv("GROQ_VISION_MODEL", "llama-3.2-11b-vision-preview")
                self.vision_chat = ChatGroq(
                    groq_api_key=groq_key,
                    model_name=groq_model,
                    temperature=0.2
                )
                self.is_groq = True
                print(f"Initialized ChatGroq Vision with model {groq_model}")
            except Exception as e:
                print(f"Failed to initialize ChatGroq Vision: {e}. Falling back to ChatOllama.")
                self.is_groq = False
                self._init_ollama()
        else:
            self.is_groq = False
            self._init_ollama()

    def _init_ollama(self):
        self.model_name = os.getenv("OLLAMA_VISION_MODEL", "llava")
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.vision_chat = ChatOllama(
            base_url=self.base_url,
            model=self.model_name,
            temperature=0.2
        )

    async def analyze_image(self, file_path: str):
        try:
            # Read and encode image
            with open(file_path, "rb") as image_file:
                image_data = base64.b64encode(image_file.read()).decode("utf-8")

            # Construct vision prompt
            prompt = (
                "You are a medical image analysis assistant for rural healthcare. "
                "Analyze this image and identify if it looks like a snake bite, skin rash, wound, or swelling. "
                "Provide a brief assessment and a risk level (Low, Moderate, High). "
                "Format: ASSESSMENT: [Brief description] | RISK: [Level]"
            )

            if self.is_groq:
                image_url_val = {"url": f"data:image/jpeg;base64,{image_data}"}
            else:
                image_url_val = f"data:image/jpeg;base64,{image_data}"

            message = HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": image_url_val,
                    },
                ]
            )

            response = self.vision_chat.invoke([message])
            content = response.content
            
            # Simple parsing
            assessment = "General Assessment"
            risk_level = "Moderate"
            
            if "ASSESSMENT:" in content:
                assessment = content.split("ASSESSMENT:")[1].split("|")[0].strip()
            else:
                assessment = content.strip()

            if "RISK:" in content:
                risk_level = content.split("RISK:")[1].split("\n")[0].strip()
            else:
                content_lower = content.lower()
                if any(k in content_lower for k in ["snake", "bite", "severe", "critical", "venom"]):
                    risk_level = "High"
                elif any(k in content_lower for k in ["rash", "wound", "swelling", "burn", "cut", "injury", "infection"]):
                    risk_level = "Moderate"
                else:
                    risk_level = "Low"

            return {
                "assessment": assessment,
                "risk_level": risk_level,
                "confidence": 85.0,
                "disclaimer": "AI-generated vision assessment. Not a clinical diagnosis."
            }
        except Exception as e:
            print(f"Vision analysis error: {str(e)}")
            return self._fallback_analysis(file_path)

    def _fallback_analysis(self, file_path):
        # Improved fallback logic based on common keywords or random but consistent choice
        filename = os.path.basename(file_path).lower()
        if "snake" in filename or "bite" in filename:
            res, risk = "Potential Snake Bite", "High"
        elif "rash" in filename or "skin" in filename:
            res, risk = "Potential Skin Condition", "Moderate"
        else:
            res, risk = "Wound or Soft Tissue Issue", "Moderate"
            
        return {
            "assessment": res,
            "risk_level": risk,
            "confidence": 75.0,
            "disclaimer": "Manual heuristic assessment. Vision model unavailable."
        }

image_service = ImageAnalysisService()
