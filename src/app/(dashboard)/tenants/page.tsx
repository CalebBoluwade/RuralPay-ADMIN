// app/dashboard/config/page.tsx
"use client";
import { useState } from 'react';
import PhoneMockup from '@/components/preview/PhoneMockup';

export default function ConfigPage() {
  const [config, setConfig] = useState({
    primaryColor: '#10b981', // Emerald 500
    merchantName: 'RuralPay Express',
  });

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-100">
      {/* Sidebar Controls */}
      <div className="w-full lg:w-1/3 p-8 bg-white border-r">
        <h1 className="text-2xl font-bold mb-8">Brand Configuration</h1>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Merchant Name</label>
            <input 
              type="text" 
              className="w-full p-3 border rounded-lg"
              value={config.merchantName}
              onChange={(e) => setConfig({...config, merchantName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Primary Brand Color</label>
            <div className="flex gap-4 items-center">
              <input 
                type="color" 
                className="w-12 h-12 rounded cursor-pointer"
                value={config.primaryColor}
                onChange={(e) => setConfig({...config, primaryColor: e.target.value})}
              />
              <span className="font-mono text-gray-500">{config.primaryColor}</span>
            </div>
          </div>
          
          <button className="w-full bg-black text-white py-3 rounded-xl font-bold hover:opacity-90 transition">
            Deploy Whitelabel
          </button>
        </div>
      </div>

      {/* 3D Preview Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-200">
        <div className="text-center mb-4">
          <span className="px-4 py-1 bg-white rounded-full text-xs font-bold uppercase tracking-widest text-gray-400">
            Live 3D Preview
          </span>
        </div>
        <PhoneMockup config={config} />
      </div>
    </div>
  );
}