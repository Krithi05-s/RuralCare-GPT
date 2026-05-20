import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Shield, AlertTriangle, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import axios from 'axios';
import API_BASE from '../api';

const ImageAnalysis = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onDrop = useCallback(acceptedFiles => {
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setResult(null);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(`${API_BASE}/analyze-image`, formData);
      setResult(response.data);
    } catch (err) {
      setError('Failed to analyze image. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-gray-900">Medical Image Analysis</h2>
        <p className="text-gray-500">Upload a photo of a snake bite, skin condition, or wound for AI risk assessment.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        {!preview ? (
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-primary-100 rounded-full text-primary-600">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Click or drag image here</p>
                <p className="text-sm text-gray-500">Supports JPG, PNG (Max 5MB)</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-gray-200 aspect-video bg-black">
              <img src={preview} alt="Preview" className="w-full h-full object-contain" />
              <button 
                onClick={removeFile}
                className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <button
              onClick={handleUpload}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 ${
                loading ? 'bg-primary-300' : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Analyzing Image...</span>
                </>
              ) : (
                <>
                  <span>Start Risk Assessment</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6 animate-in zoom-in-95 duration-500">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">AI Risk Assessment</h3>
            <div className={`px-4 py-1 rounded-full border text-sm font-bold ${
              result.risk_level === 'High' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'
            }`}>
              {result.risk_level} Risk
            </div>
          </div>

          <div className="p-6 bg-gray-50 rounded-xl flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Assessment Result</p>
              <h4 className="text-2xl font-bold text-gray-900">{result.assessment}</h4>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-gray-500">AI Confidence</p>
              <h4 className="text-2xl font-bold text-gray-900">{result.confidence}%</h4>
            </div>
          </div>

          <div className="p-6 border border-blue-100 bg-blue-50 rounded-xl flex gap-4">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-600 h-fit">
              <Shield className="w-5 h-5" />
            </div>
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900">Next Steps & Guidance</h4>
              <p className="text-gray-600 text-sm">
                {result.disclaimer}
                {result.risk_level === 'High' ? 
                  ' This condition requires immediate medical attention. Do not delay.' : 
                  ' Monitor the area for changes in color, size, or pain level.'}
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-red-600 font-bold mb-4">
              <AlertTriangle className="w-5 h-5" />
              <span>Emergency Warning</span>
            </div>
            <p className="text-sm text-gray-600">
              If you experience rapid swelling, difficulty breathing, or dizziness along with this condition, 
              seek emergency medical care immediately.
            </p>
          </div>
        </div>
      )}

      <div className="bg-gray-100 p-6 rounded-2xl space-y-4">
        <h4 className="font-bold text-gray-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Tips for better photos
        </h4>
        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
          <li>Ensure the area is well-lit with natural light if possible.</li>
          <li>Keep the camera steady and focused on the affected area.</li>
          <li>Include some healthy skin around the area for comparison.</li>
          <li>Clean any blood or dirt from the area if safe to do so.</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageAnalysis;
