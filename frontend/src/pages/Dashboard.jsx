import React, { useState, useEffect } from 'react';
import { Activity, Users, FileCheck, ShieldAlert, ChevronRight } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 animate-in zoom-in-95 duration-300">
    <div className={`p-3 rounded-xl ${color}`}>
      <Icon className="w-6 h-6 text-white" />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

const Dashboard = ({ setActiveTab }) => {
  const [stats, setStats] = useState({
    assessments: 0,
    consultations: 0,
    reports: 0,
    alerts: 0
  });

  useEffect(() => {
    // 1. Calculate Risk Assessments count from symptom checker history
    let sympHistory = [];
    try {
      sympHistory = JSON.parse(localStorage.getItem('symptom_checker_history') || '[]');
    } catch {}

    const assessmentCount = sympHistory.length;

    // 2. Calculate Consultations count from Chatbot history
    let chatHistory = [];
    try {
      chatHistory = JSON.parse(localStorage.getItem('chatbot_history') || '[]');
    } catch {}
    const userMessages = chatHistory.filter(m => m.role === 'user').length;

    // 3. Calculate Reports count
    let reportsList = [];
    try {
      reportsList = JSON.parse(localStorage.getItem('reports_history') || '[]');
    } catch {}
    const reportsCount = reportsList.length;

    // 4. Calculate Alerts (High/Critical risk levels)
    const alertCount = sympHistory.filter(entry => {
      const risk = entry.result?.risk_level?.toLowerCase();
      return risk === 'high' || risk === 'critical';
    }).length;

    setStats({
      assessments: assessmentCount,
      consultations: userMessages,
      reports: reportsCount,
      alerts: alertCount
    });
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Health Overview</h2>
        <p className="text-gray-500">Welcome back. Here is what is happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Activity} label="Risk Assessments" value={stats.assessments} color="bg-blue-500" />
        <StatCard icon={Users} label="Consultations" value={stats.consultations} color="bg-green-500" />
        <StatCard icon={FileCheck} label="Reports Generated" value={stats.reports} color="bg-purple-500" />
        <StatCard icon={ShieldAlert} label="Critical Alerts" value={stats.alerts} color="bg-red-500 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
          <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4">
            <button 
              onClick={() => setActiveTab('symptoms')}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
                  <Activity className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-gray-900">Check Symptoms</h4>
                  <p className="text-sm text-gray-500">Instant risk prediction for common symptoms</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
            </button>

            <button 
              onClick={() => setActiveTab('image')}
              className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-primary-200 hover:bg-primary-50 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary-100 rounded-lg text-primary-600">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-gray-900">Analyze Skin/Wounds</h4>
                  <p className="text-sm text-gray-500">Upload a photo for instant risk assessment</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
            </button>
          </div>
        </div>

        <div className="bg-red-50 p-8 rounded-2xl border border-red-100 space-y-4">
          <div className="flex items-center gap-3 text-red-600">
            <ShieldAlert className="w-6 h-6" />
            <h3 className="text-xl font-bold">Emergency Notice</h3>
          </div>
          <p className="text-red-700">
            If you or someone around you is experiencing chest pain, severe breathing difficulty, 
            or loss of consciousness, please call for emergency help immediately or visit the 
            nearest hospital.
          </p>
          <button 
            onClick={() => setActiveTab('emergency')}
            className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
          >
            Find Nearest Emergency Center
          </button>
        </div>
      </div>
      
      <div className="bg-primary-900 text-white p-8 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-white">Medical Disclaimer</h3>
          <p className="text-primary-100 max-w-2xl">
            This application provides AI-generated preliminary health guidance and first-aid information. 
            It is NOT a substitute for professional medical diagnosis or treatment.
          </p>
        </div>
        <button className="px-8 py-3 bg-white text-primary-900 rounded-xl font-bold hover:bg-primary-50 transition-all whitespace-nowrap">
          Read Full Disclaimer
        </button>
      </div>
    </div>
  );
};

const ImageIcon = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

export default Dashboard;
