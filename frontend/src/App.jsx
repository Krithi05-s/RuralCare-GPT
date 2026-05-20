import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import SymptomChecker from './pages/SymptomChecker';
import Chatbot from './pages/Chatbot';
import ImageAnalysis from './pages/ImageAnalysis';
import { AlertCircle, X, FileText, Trash2, Phone, MapPin, Clock, Heart, LifeBuoy, ShieldAlert, ArrowRight, Activity, Search } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showDisclaimer, setShowDisclaimer] = useState(true);

  // Dynamic Reports state
  const [reports, setReports] = useState(() => {
    try {
      const saved = localStorage.getItem('reports_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Emergency Ambulance simulator state
  const [activeAmbulance, setActiveAmbulance] = useState(false);
  const [ambulanceEta, setAmbulanceEta] = useState(12);
  const [selectedEmergency, setSelectedEmergency] = useState(null);

  useEffect(() => {
    let timer;
    if (activeAmbulance && ambulanceEta > 0) {
      timer = setInterval(() => {
        setAmbulanceEta(prev => (prev > 0 ? prev - 1 : 0));
      }, 60000); // Countdown every minute
    } else if (ambulanceEta === 0) {
      setActiveAmbulance(false);
    }
    return () => clearInterval(timer);
  }, [activeAmbulance, ambulanceEta]);

  const handleCallAmbulance = () => {
    setActiveAmbulance(true);
    setAmbulanceEta(12);
  };

  const handleReportGenerated = (newReport) => {
    setReports(prev => {
      const updated = [newReport, ...prev];
      localStorage.setItem('reports_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Static/Simulated medical directories for rural areas
  const hospitals = [
    { name: "Koppal District General Hospital", type: "District Hospital", dist: "1.2 km", phone: "+91 85392 20121", status: "Open 24/7", beds: "14 available" },
    { name: "Kushtagi Community Health Centre", type: "Community Clinic", dist: "4.5 km", phone: "+91 85392 23041", status: "Open 24/7", beds: "5 available" },
    { name: "Ginigera Primary Health Sub-centre", type: "Primary Health Post", dist: "8.1 km", phone: "+91 85392 25010", status: "Closed (Opens 8:00 AM)", beds: "Emergency Care Only" }
  ];

  // Detailed local first-aid guides
  const firstAidGuides = {
    snakebite: {
      title: "Snake Bite Treatment",
      steps: [
        "Reassure the victim. Keep them perfectly still and calm to slow the spread of venom.",
        "Immobilize the bitten limb (like a fracture) and keep it at or slightly below heart level.",
        "Do NOT cut the wound, do NOT try to suck the venom, and do NOT apply ice or tight tourniquets.",
        "Remove rings, bracelets, or tight clothing near the bite as swelling may occur.",
        "Seek antivenom treatment immediately at the nearest district hospital."
      ]
    },
    cpr: {
      title: "Cardiac Arrest & CPR",
      steps: [
        "Check responsiveness. Tap shoulder and shout 'Are you okay?'.",
        "Call 108 or activate the Ambulance Simulator.",
        "If the person is not breathing or gasping, begin chest compressions immediately.",
        "Push hard and fast in the center of the chest (100 to 120 compressions per minute).",
        "Allow the chest to rise completely between compressions. Continue until medical help arrives."
      ]
    },
    choking: {
      title: "Choking (Heimlich Maneuver)",
      steps: [
        "Stand behind the person, wrap your arms around their waist.",
        "Make a fist with one hand and place the thumb-side just above the navel.",
        "Grasp your fist with your other hand and perform quick, upward abdominal thrusts.",
        "Repeat until the object is expelled or the person becomes unconscious (in which case, start CPR)."
      ]
    },
    bleeding: {
      title: "Severe Bleeding Control",
      steps: [
        "Apply firm, direct pressure on the wound using a clean cloth or sterile bandage.",
        "Elevate the injured limb above the level of the heart if possible.",
        "If bleeding does not stop, add more bandages on top (do not remove original ones) and keep pressing.",
        "Apply a tourniquet only if trained and blood loss is life-threatening."
      ]
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
      case 'symptoms': return <SymptomChecker onReportGenerated={handleReportGenerated} />;
      case 'chat': return <Chatbot onReportGenerated={handleReportGenerated} />;
      case 'image': return <ImageAnalysis />;
      case 'reports': return (
        <div className="space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Health Reports</h2>
            <p className="text-gray-500">Access and download your AI-generated health consultations and risk assessments.</p>
          </div>

          {reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[50vh] bg-white rounded-2xl border border-gray-100 text-center p-8 space-y-4 animate-in fade-in">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                <FileText className="w-10 h-10 text-primary-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No Reports Available Yet</h3>
              <p className="text-gray-500 max-w-sm">Ask our Chatbot a medical query or complete a Symptom Check to automatically generate your first PDF report.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-bottom-4 duration-300">
              {reports.map((rep) => (
                <div key={rep.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between space-y-4 hover:border-primary-100 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        rep.type === 'Symptom Check' ? 'bg-indigo-50 text-indigo-700 font-medium' : 'bg-blue-50 text-blue-700 font-medium'
                      }`}>
                        {rep.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(rep.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg leading-snug">{rep.title}</h4>
                    <p className="text-sm text-gray-500 flex items-center gap-1.5">
                      Risk Classification: 
                      <span className={`font-semibold ${
                        rep.risk === 'High' || rep.risk === 'Critical' ? 'text-red-600' : 
                        rep.risk === 'Moderate' ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {rep.risk || 'Low'}
                      </span>
                    </p>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <a 
                      href={rep.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-center text-sm font-bold transition-colors"
                    >
                      Download PDF
                    </a>
                    <button 
                      onClick={() => {
                        setReports(prev => {
                          const updated = prev.filter(r => r.id !== rep.id);
                          localStorage.setItem('reports_history', JSON.stringify(updated));
                          return updated;
                        });
                      }}
                      className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors flex items-center justify-center"
                      title="Delete report"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
      case 'emergency': return (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Active Ambulance Alert Banner */}
          {activeAmbulance ? (
            <div className="bg-red-50 border border-red-200 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg shadow-red-50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500 opacity-5 rounded-full -mr-6 -mt-6 animate-ping" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center shrink-0 animate-pulse">
                  <Phone className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-red-900">Ambulance Dispatch Active</h3>
                  <p className="text-red-700 text-sm font-medium">A critical alert has been placed. Emergency staff are responding.</p>
                  <p className="text-red-600 font-bold text-lg flex items-center gap-1.5 mt-1">
                    <Clock className="w-5 h-5 animate-spin" />
                    Estimated Arrival (ETA): {ambulanceEta} mins
                  </p>
                </div>
              </div>
              <div className="flex gap-3 relative z-10 w-full md:w-auto">
                <button 
                  onClick={() => setActiveAmbulance(false)}
                  className="flex-1 md:flex-none px-6 py-3 bg-red-900 text-white rounded-xl font-bold hover:bg-red-950 transition-all text-sm"
                >
                  Cancel Request
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-red-600 text-white p-12 rounded-3xl text-center space-y-6 shadow-xl shadow-red-200 relative overflow-hidden">
              <AlertCircle className="w-20 h-20 mx-auto animate-bounce" />
              <h2 className="text-4xl font-bold">EMERGENCY SERVICES</h2>
              <p className="text-xl text-red-100 max-w-2xl mx-auto">
                If you are facing a life-threatening situation, please do not wait for AI.
                Call immediately or head to the nearest clinic.
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-4 pt-2">
                <button 
                  onClick={handleCallAmbulance}
                  className="px-8 py-4 bg-white text-red-600 rounded-2xl font-bold text-xl hover:bg-red-50 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Phone className="w-6 h-6 animate-pulse" />
                  <span>Call Ambulance (108)</span>
                </button>
                <a 
                  href="#nearest-clinics"
                  className="px-8 py-4 bg-red-800 text-white rounded-2xl font-bold text-xl hover:bg-red-900 transition-all border border-red-700 flex items-center justify-center gap-2"
                >
                  <MapPin className="w-6 h-6" />
                  <span>Find Nearest Clinic</span>
                </a>
              </div>
            </div>
          )}

          {/* Grid Layout for Emergency Guides and Hospital Locator */}
          <div id="nearest-clinics" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Interactive Hospital Locator */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                <MapPin className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-gray-900">Nearest Emergency Facilities</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {hospitals.map((hosp, i) => (
                  <div key={i} className="py-4 first:pt-0 last:pb-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{hosp.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-500">{hosp.type}</span>
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" /> {hosp.dist} away • {hosp.beds}
                      </p>
                      <p className="text-xs text-green-600 font-semibold">{hosp.status}</p>
                    </div>
                    <a 
                      href={`tel:${hosp.phone}`}
                      className="px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 font-bold text-sm border border-gray-100 transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                    >
                      <Phone className="w-4 h-4 text-gray-500" /> {hosp.phone}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic First-Aid interactive guides */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
                <LifeBuoy className="w-6 h-6 text-primary-500" />
                <h3 className="text-xl font-bold text-gray-900">Instant First Aid Guides</h3>
              </div>
              <p className="text-sm text-gray-500">Select an emergency category below to view critical step-by-step guidance:</p>
              
              {/* Category Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setSelectedEmergency(selectedEmergency === 'snakebite' ? null : 'snakebite')}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold text-left transition-all ${
                    selectedEmergency === 'snakebite' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  🐍 Snake Bite
                </button>
                <button 
                  onClick={() => setSelectedEmergency(selectedEmergency === 'cpr' ? null : 'cpr')}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold text-left transition-all ${
                    selectedEmergency === 'cpr' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  ❤️ CPR & Heart Attack
                </button>
                <button 
                  onClick={() => setSelectedEmergency(selectedEmergency === 'choking' ? null : 'choking')}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold text-left transition-all ${
                    selectedEmergency === 'choking' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  💨 Choking Guidance
                </button>
                <button 
                  onClick={() => setSelectedEmergency(selectedEmergency === 'bleeding' ? null : 'bleeding')}
                  className={`py-3 px-4 rounded-xl border text-sm font-bold text-left transition-all ${
                    selectedEmergency === 'bleeding' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-100 hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  🩸 Severe Bleeding
                </button>
              </div>

              {/* Guide Contents */}
              {selectedEmergency && firstAidGuides[selectedEmergency] && (
                <div className="p-6 bg-red-50 border border-red-100 rounded-xl space-y-3 animate-in zoom-in-95 duration-200">
                  <h4 className="font-bold text-red-950 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                    {firstAidGuides[selectedEmergency].title} First Aid
                  </h4>
                  <ol className="list-decimal pl-5 space-y-2 text-sm text-red-900">
                    {firstAidGuides[selectedEmergency].steps.map((st, idx) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        </div>
      );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="flex bg-gray-50 h-screen overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 ml-64 flex flex-col overflow-hidden">
        {showDisclaimer && (
          <div className="shrink-0 mx-8 mt-8 p-4 bg-primary-900 text-white rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-top duration-500 z-20">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-primary-300 animate-bounce" />
              <p className="text-sm font-medium">
                Disclaimer: AI guidance only. Not a medical diagnosis. In emergency, call 108 immediately.
              </p>
            </div>
            <button onClick={() => setShowDisclaimer(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        
        {activeTab === 'chat' ? (
          <div className="flex-1 min-h-0 px-8 pb-8 pt-6">
            <div className="max-w-7xl mx-auto h-full">
              {renderContent()}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-7xl mx-auto">
              {renderContent()}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
