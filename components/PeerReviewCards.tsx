import React from 'react';
import { PeerPlan } from '../types';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';

interface PeerReviewCardsProps {
  plans: PeerPlan[];
}

export const PeerReviewCards: React.FC<PeerReviewCardsProps> = ({ plans }) => {
  if (!plans || plans.length === 0) return null;

  return (
    <div className="my-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2 mb-4 text-medical-primary font-bold uppercase tracking-wider text-sm">
        <Users size={16} />
        <h3>Peer Plan Review</h3>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {plans.map((plan, idx) => (
          <div key={idx} className="bg-white border border-medical-200 rounded-xl p-5 shadow-md relative overflow-hidden group hover:border-medical-primary/50 transition-colors">
            <div className="absolute top-0 left-0 w-1 h-full bg-medical-primary"></div>
            
            <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded bg-medical-50 border border-medical-200 flex items-center justify-center text-medical-primary font-bold text-xs">
                    {plan.residentName.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="font-bold text-medical-900">{plan.residentName}</span>
            </div>
            
            <div className="space-y-4">
              <div className="bg-medical-50 p-3 rounded border border-medical-200">
                <h4 className="text-[10px] font-bold text-medical-500 uppercase tracking-wider mb-2">Proposed Plan</h4>
                <p className="text-sm text-medical-900 font-medium leading-relaxed">{plan.plan}</p>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-medical-500 uppercase tracking-wider mb-1">Rationale</h4>
                <p className="text-sm text-medical-600 italic">"{plan.rationale}"</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-medical-100 flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                 <button className="text-xs px-3 py-1.5 rounded bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 font-medium">Critique Risks</button>
                 <button className="text-xs px-3 py-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 font-medium">Validate</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};