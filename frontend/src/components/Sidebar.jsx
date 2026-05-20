import React from 'react';
import { LayoutDashboard, Stethoscope, MessageSquare, Image as ImageIcon, FileText, Settings, AlertTriangle, Languages } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'symptoms', icon: Stethoscope, label: 'Symptom Checker' },
    { id: 'chat', icon: MessageSquare, label: 'Health Chatbot' },
    { id: 'image', icon: ImageIcon, label: 'Image Analysis' },
    { id: 'reports', icon: FileText, label: 'Reports' },
    { id: 'emergency', icon: AlertTriangle, label: 'Emergency', color: 'text-red-500' },
  ];

  return (
    <div className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600 flex items-center gap-2">
          <Stethoscope className="w-6 h-6" />
          <span>RuralHealth AI</span>
        </h1>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === item.id 
                ? 'bg-primary-50 text-primary-600 font-medium border-l-4 border-primary-600' 
                : 'text-gray-600 hover:bg-gray-50'
            } ${item.color || ''}`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-200">
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <Languages className="w-5 h-5" />
          <span>Language Settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
