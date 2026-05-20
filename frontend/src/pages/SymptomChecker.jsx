import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, CheckCircle, ArrowRight, Info, Clock, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../api';

const SYMPTOM_HISTORY_KEY = 'symptom_checker_history';

const SymptomChecker = ({ onReportGenerated }) => {
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(SYMPTOM_HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showHistory, setShowHistory] = useState(false);

  const handleDownloadReport = async () => {
    if (!result) return;
    try {
      const reportData = {
        symptoms: symptoms.split(',').map(s => s.trim()).filter(Boolean),
        condition: result.condition,
        risk_level: result.risk_level,
        confidence: result.confidence,
        recommendations: `AI Risk Assessment. condition: ${result.condition}. confidence: ${result.confidence}%. risk level: ${result.risk_level}. We recommend monitoring your symptoms closely and seeking clinical assistance if they persist.`
      };

      const response = await axios.post(`${API_BASE}/generate-report`, reportData);
      const { report_url } = response.data;
      const cleanUrl = `${API_BASE.replace('/api', '')}${report_url}`;

      // Open in new tab
      window.open(cleanUrl, '_blank');

      const newReport = {
        id: Date.now(),
        title: `Symptom Check: ${result.condition}`,
        date: new Date().toISOString(),
        url: cleanUrl,
        type: 'Symptom Check',
        risk: result.risk_level
      };

      if (onReportGenerated) {
        onReportGenerated(newReport);
      }
    } catch (err) {
      console.error('Failed to generate symptom checker PDF report:', err);
      alert('Unable to generate PDF report at this moment.');
    }
  };

  // Persist history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SYMPTOM_HISTORY_KEY, JSON.stringify(history));
    } catch {}
  }, [history]);

  const handleCheck = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const symptomList = symptoms.split(',').map(s => s.trim()).filter(Boolean);
      const response = await axios.post(`${API_BASE}/predict-risk`, symptomList);
      const newResult = response.data;
      setResult(newResult);

      // Save to history
      const entry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        symptoms: symptomList,
        result: newResult,
      };
      setHistory(prev => [entry, ...prev].slice(0, 20)); // keep last 20
    } catch (err) {
      setError('Failed to analyze symptoms. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(SYMPTOM_HISTORY_KEY);
  };

  const loadFromHistory = (entry) => {
    setSymptoms(entry.symptoms.join(', '));
    setResult(entry.result);
    setError(null);
    setShowHistory(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRiskColor = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'critical': return 'bg-red-200 text-red-800 border-red-300';
      case 'moderate': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getRiskDot = (risk) => {
    switch (risk?.toLowerCase()) {
      case 'high': case 'critical': return 'bg-red-500';
      case 'moderate': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };

  const formatDate = (ts) => {
    try {
      return new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
    } catch { return ''; }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Symptom Checker</h2>
        <p className="text-gray-500">Enter your symptoms separated by commas to get an AI-powered risk assessment.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-gray-700">How are you feeling?</label>
          <div className="relative">
            <textarea
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="e.g. fever, cough, chest pain..."
              className="w-full h-32 p-4 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all outline-none resize-none"
            />
            <div className="absolute top-4 right-4 text-gray-400">
              <Search className="w-6 h-6" />
            </div>
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Info className="w-3 h-3" />
            Separate multiple symptoms with commas for better accuracy.
          </p>
        </div>

        <button
          onClick={handleCheck}
          disabled={loading || !symptoms.trim()}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
            loading ? 'bg-primary-300' : 'bg-primary-600 hover:bg-primary-700'
          }`}
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Analyze Symptoms</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in fade-in duration-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">AI Risk Assessment</h3>
            <div className={`px-4 py-1 rounded-full border text-sm font-bold ${getRiskColor(result.risk_level)}`}>
              {result.risk_level} Risk
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 rounded-xl space-y-2">
              <p className="text-sm text-gray-500">Predicted Possible Condition</p>
              <h4 className="text-2xl font-bold text-gray-900">{result.condition}</h4>
            </div>
            <div className="p-6 bg-gray-50 rounded-xl space-y-2">
              <p className="text-sm text-gray-500">AI Confidence Level</p>
              <h4 className="text-2xl font-bold text-gray-900">{result.confidence}%</h4>
            </div>
          </div>

          <div className="p-6 border border-primary-100 bg-primary-50 rounded-xl flex gap-4">
            <div className="p-2 bg-primary-100 rounded-lg text-primary-600 h-fit">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900">AI Observations</h4>
              <p className="text-gray-600 text-sm">
                Based on the symptoms provided, there is a {result.risk_level.toLowerCase()} probability of {result.condition}. 
                {result.risk_level === 'High' || result.risk_level === 'Critical' ? 
                  ' We recommend consulting a healthcare professional immediately.' : 
                  ' Please monitor your symptoms and seek medical advice if they persist.'}
              </p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row gap-4">
            <button 
              onClick={handleDownloadReport}
              className="flex-1 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-all"
            >
              Download PDF Report
            </button>
            <button className="flex-1 py-3 border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all">
              Talk to Health AI
            </button>
          </div>
        </div>
      )}

      {/* History Section */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div
            onClick={() => setShowHistory(v => !v)}
            className="w-full p-5 flex items-center justify-between hover:bg-gray-50 transition-all cursor-pointer select-none"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary-500" />
              <span className="font-bold text-gray-900">Previous Checks</span>
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded-full">
                {history.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); clearHistory(); }}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                title="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {showHistory ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </div>
          </div>

          {showHistory && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {history.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => loadFromHistory(entry)}
                  className="w-full p-5 flex items-center gap-4 hover:bg-gray-50 transition-all text-left group"
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getRiskDot(entry.result.risk_level)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors truncate">
                      {entry.result.condition}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {entry.symptoms.join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs font-bold px-2 py-0.5 rounded-full ${getRiskColor(entry.result.risk_level)}`}>
                      {entry.result.risk_level}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(entry.timestamp)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      
      <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
        <p className="text-xs text-yellow-800 text-center">
          <strong>Important Disclaimer:</strong> This assessment is AI-generated and NOT a formal medical diagnosis. 
          If you feel unwell, always consult a qualified medical doctor. In case of emergency, call local emergency services immediately.
        </p>
      </div>
    </div>
  );
};

export default SymptomChecker;
