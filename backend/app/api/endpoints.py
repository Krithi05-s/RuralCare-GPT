from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from typing import List, Optional
import shutil
import os
import json
from app.services.ml_service import ml_service
from app.services.chat_service import chat_service
from app.services.pdf_service import pdf_service
from app.services.image_service import image_service

router = APIRouter()

@router.post("/predict-risk")
async def predict_risk(symptoms: List[str]):
    try:
        prediction = ml_service.predict(symptoms)
        
        # If the ML model is not confident (meaning symptoms were mostly unknown to the CSV database),
        # use the generative AI to create a custom assessment.
        # We use a lower threshold of 35.0 locally to avoid slow Ollama queries, and 60.0 with fast Groq queries.
        import os
        confidence_threshold = 60.0 if os.getenv("GROQ_API_KEY") else 35.0
        
        if prediction.get("confidence", 0) < confidence_threshold:
            generative_prediction = await chat_service.generate_symptom_assessment(symptoms)
            if generative_prediction:
                return generative_prediction
                
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(message: str = Form(...), history: Optional[str] = Form(None)):
    try:
        chat_history = json.loads(history) if history else []
    except Exception:
        chat_history = []
    response = await chat_service.get_response(message, chat_history)
    return {"response": response}

@router.post("/chat-stream")
async def chat_stream(message: str = Form(...), history: Optional[str] = Form(None)):
    try:
        chat_history = json.loads(history) if history else []
    except Exception:
        chat_history = []
        
    return StreamingResponse(
        chat_service.get_streaming_response(message, chat_history),
        media_type="text/plain"
    )

@router.post("/analyze-image")
async def analyze_image(file: UploadFile = File(...)):
    uploads_dir = "uploads"
    os.makedirs(uploads_dir, exist_ok=True)
    file_path = os.path.join(uploads_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    result = await image_service.analyze_image(file_path)
    return result

@router.post("/generate-report")
async def generate_report(data: dict):
    try:
        report_id = pdf_service.generate_report(data)
        return {"report_url": f"/reports/{report_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/languages")
async def get_languages():
    return [
        {"code": "en", "name": "English"},
        {"code": "kn", "name": "Kannada"},
        {"code": "hi", "name": "Hindi"},
        {"code": "ta", "name": "Tamil"},
        {"code": "te", "name": "Telugu"}
    ]
