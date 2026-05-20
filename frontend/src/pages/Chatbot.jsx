import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, User, Bot, Loader2, Volume2, Shield, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import API_BASE from '../api';

const CHAT_HISTORY_KEY = 'chatbot_history';

const Chatbot = ({ onReportGenerated }) => {
  const defaultMessage = { role: 'bot', content: "Hello! I am your AI Health Assistant. How can I help you today? Please remember, I'm here to provide guidance, not a diagnosis." };

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [defaultMessage];
    } catch {
      return [defaultMessage];
    }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const clearHistory = () => {
    const fresh = [defaultMessage];
    setMessages(fresh);
    localStorage.removeItem(CHAT_HISTORY_KEY);
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input);
  };

  const sendMessage = async (textToSend) => {
    const userMessage = { role: 'user', content: textToSend, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Add an empty bot message that we will fill
    setMessages(prev => [...prev, { role: 'bot', content: '', timestamp: new Date().toISOString() }]);

    try {
      const formData = new FormData();
      formData.append('message', textToSend);
      formData.append('history', JSON.stringify(messages));
      
      const response = await fetch(`${API_BASE}/chat-stream`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to fetch stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedContent = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunk = decoder.decode(value, { stream: true });
        accumulatedContent += chunk;
        
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].content = accumulatedContent;
          return newMessages;
        });
      }

      // Automatically generate a dynamic report from this chatbot session
      try {
        const userQuery = textToSend;
        const botResponse = accumulatedContent;
        
        // Extract a nice title (e.g. from user query first 4 words or intent)
        const words = userQuery.split(' ').filter(Boolean).slice(0, 4).join(' ');
        const reportTitle = `Consultation: ${words || 'General Health Inquiry'}...`;
        
        // Infer risk level based on key words in user query
        const queryLower = userQuery.toLowerCase();
        let riskLevel = 'Low';
        if (queryLower.includes('chest pain') || queryLower.includes('breathing') || queryLower.includes('heart') || queryLower.includes('unconscious')) {
          riskLevel = 'Critical';
        } else if (queryLower.includes('severe') || queryLower.includes('bleeding') || queryLower.includes('fracture') || queryLower.includes('snake')) {
          riskLevel = 'High';
        } else if (queryLower.includes('fever') || queryLower.includes('cough') || queryLower.includes('vomit') || queryLower.includes('pain')) {
          riskLevel = 'Moderate';
        }
        
        const reportData = {
          symptoms: [userQuery],
          condition: "AI Chat Consultation Support",
          risk_level: riskLevel,
          confidence: 90,
          recommendations: botResponse
        };
        
        const reportResponse = await fetch(`${API_BASE}/generate-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reportData)
        });
        
        if (reportResponse.ok) {
          const { report_url } = await reportResponse.json();
          const cleanReportUrl = `${API_BASE.replace('/api', '')}${report_url}`;
          
          const newReport = {
            id: Date.now(),
            title: reportTitle,
            date: new Date().toISOString(),
            url: cleanReportUrl,
            type: 'Chatbot Consultation',
            risk: riskLevel
          };
          
          if (onReportGenerated) {
            onReportGenerated(newReport);
          }
          
          // Append a small helper message to the chat indicating report generation
          setMessages(prev => [
            ...prev,
            { 
              role: 'bot', 
              content: `📄 *A medical consultation report has been successfully generated and saved to your **Reports** section!* [Click here to view/download the PDF](${cleanReportUrl})`,
              timestamp: new Date().toISOString()
            }
          ]);
        }
      } catch (reportErr) {
        console.error('Error generating chatbot consultation report:', reportErr);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1].content = "I'm sorry, I encountered an error connecting to my medical knowledge base. Please try again later.";
        return newMessages;
      });
    } finally {
      setLoading(false);
    }
  };

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition not supported in this browser. Please use Google Chrome, MS Edge, or Apple Safari.");
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      let finalTranscript = '';

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert("Microphone access was denied. Please allow microphone permissions in the browser address bar.");
        }
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcriptChunk = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptChunk;
          } else {
            interimTranscript += transcriptChunk;
          }
        }

        const currentText = finalTranscript + interimTranscript;
        if (currentText.trim()) {
          setInput(currentText);
        }
      };

      recognition.start();
    } catch (err) {
      console.error("Failed to initialize speech recognition:", err);
      setIsRecording(false);
    }
  };

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch { return ''; }
  };

  const sessionCount = messages.filter(m => m.role === 'user').length;

  return (
    <div className="flex flex-col h-[calc(100vh-160px)] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Health Assistant AI</h3>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-gray-500">Online | Knowledge Base Connected</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {sessionCount > 0 && (
            <span className="hidden md:flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs">
              <Clock className="w-3 h-3" />
              {sessionCount} message{sessionCount !== 1 ? 's' : ''} this session
            </span>
          )}
          <button
            onClick={() => setShowHistory(v => !v)}
            title="Toggle history panel"
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-primary-600 transition-all"
          >
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={clearHistory}
            title="Clear chat history"
            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary-50 text-primary-600 rounded-lg text-xs font-medium">
            <Shield className="w-3 h-3" />
            <span>Secure & Confidential</span>
          </div>
        </div>
      </div>

      {/* History banner */}
      {showHistory && sessionCount > 0 && (
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex items-center gap-2">
          <Clock className="w-3 h-3 shrink-0" />
          <span>
            Showing <strong>{messages.length}</strong> messages from your current session. History is saved locally in your browser.
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className="space-y-1">
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-primary-600 text-white rounded-tr-none' 
                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  <div className="prose prose-sm max-w-none text-inherit">
                    <ReactMarkdown>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className={`flex items-center gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.timestamp && (
                    <span className="text-[10px] text-gray-400">{formatTimestamp(msg.timestamp)}</span>
                  )}
                  {msg.role === 'bot' && (
                    <button 
                      onClick={() => speak(msg.content)}
                      className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Volume2 className="w-3 h-3" />
                      <span>Read Aloud</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-3 max-w-[80%]">
              <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl rounded-tl-none border border-gray-100">
                <Loader2 className="w-5 h-5 animate-spin text-primary-600" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
          <button 
            onClick={startVoice}
            className={`p-2 rounded-lg transition-all ${
              isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-400 hover:bg-gray-100 hover:text-primary-600'
            }`}
          >
            <Mic className="w-6 h-6" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about symptoms, first aid, or precautions..."
            className="flex-1 bg-transparent border-none focus:ring-0 outline-none text-gray-700 py-2"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className={`p-2 rounded-lg transition-all ${
              !input.trim() || loading ? 'text-gray-300' : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          AI assistant may provide inaccurate info. Always seek medical help for serious symptoms.
        </p>
      </div>
    </div>
  );
};

export default Chatbot;
