# AI Multimodal Rural Healthcare Assistant

An advanced, multimodal AI-powered web application designed to provide preliminary health guidance and risk assessment for rural communities.

## Features

- **Symptom-Based Risk Prediction**: ML model to predict possible conditions based on symptoms.
- **Conversational Health AI**: RAG-based chatbot using LangChain and OpenAI.
- **Medical Image Analysis**: AI-powered risk assessment for snake bites, skin conditions, and wounds.
- **Voice Support**: Speech-to-text and Text-to-speech for accessible interaction.
- **Multi-language Support**: English, Kannada, Hindi, Tamil, and Telugu.
- **Emergency Detection**: Automatic detection of high-risk symptoms with emergency warnings.
- **PDF Report Generation**: Downloadable health reports for follow-up with medical professionals.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Lucide Icons, Framer Motion.
- **Backend**: FastAPI, LangChain, OpenAI API.
- **AI/ML**: Scikit-learn, ChromaDB, Sentence-Transformers.

## Setup Instructions

### Backend
1. Navigate to the `backend` directory.
2. Create a virtual environment: `python -m venv venv`.
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`.
5. Create a `.env` file from `.env.example` and add your `OPENAI_API_KEY`.
6. Run the server: `python app/main.py`.

### Frontend
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.

## Safety Disclaimer
This application provides AI-generated preliminary health guidance and first-aid information. It is **NOT** a substitute for professional medical diagnosis or treatment. Always consult a qualified healthcare professional for medical advice. In case of emergency, call local emergency services (e.g., 108 in India).

## License
MIT
