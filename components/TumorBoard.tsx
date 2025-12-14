import React, { useState, useRef, useEffect } from 'react';
import { Message, CasePhase, PeerPlan } from '../types';
import { Send, Loader2, PlayCircle, ShieldAlert, BarChart2, Library, Mic } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { PeerReviewCards } from './PeerReviewCards';

interface TumorBoardProps {
  messages: Message[];
  onSendMessage: (msg: string) => void;
  isLoading: boolean;
  isActive: boolean;
  onStart: (caseType: string) => void;
  phase: CasePhase;
  peerPlans: PeerPlan[];
  onToggleDashboard: () => void;
}

const CASE_TYPES = [
  "Random High-Yield",
  "Head & Neck (H&N)",
  "Lung (NSCLC/SCLC)",
  "Prostate / GU",
  "Breast",
  "CNS / Brain",
  "Gyn (Cervix/Endometrial)",
  "GI (Rectal/Pancreas/Esoph)"
];

export const TumorBoard: React.FC<TumorBoardProps> = ({
  messages,
  onSendMessage,
  isLoading,
  isActive,
  onStart,
  phase,
  peerPlans,
  onToggleDashboard
}) => {
  const [input, setInput] = useState('');
  const [selectedCaseType, setSelectedCaseType] = useState(CASE_TYPES[0]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, peerPlans]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const getPhaseBadge = (p: CasePhase) => {
    switch (p) {
      case CasePhase.Vignette: return 'bg-blue-50 text-blue-600 border-blue-100';
      case CasePhase.Imaging: return 'bg-purple-50 text-purple-600 border-purple-100';
      case CasePhase.Pathology: return 'bg-pink-50 text-pink-600 border-pink-100';
      case CasePhase.Staging: return 'bg-orange-50 text-orange-600 border-orange-100';
      case CasePhase.Planning: return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case CasePhase.PeerReview: return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      default: return 'bg-stone-100 text-stone-500 border-stone-200';
    }
  };

  if (!isActive) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-medical-50 relative overflow-hidden">
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(214,143,157,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(214,143,157,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

        <div className="max-w-md w-full text-center space-y-8 relative z-10">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl border border-medical-200">
            <ActivityIcon className="text-medical-primary w-12 h-12" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-medical-900 mb-2 tracking-tight">RadOnc Simulator</h1>
            <p className="text-medical-600 text-lg font-light">Interactive Tumor Board Environment</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-medical-200 text-left space-y-4 shadow-sm">
             <label className="text-sm font-semibold text-medical-600 flex items-center gap-2 uppercase tracking-wider">
                <Library size={14} />
                Select Case Scenario
             </label>
             <div className="relative">
                <select 
                  value={selectedCaseType}
                  onChange={(e) => setSelectedCaseType(e.target.value)}
                  className="w-full p-4 bg-medical-50 border border-medical-200 rounded-xl text-medical-900 appearance-none focus:ring-2 focus:ring-medical-primary focus:border-transparent outline-none transition-shadow cursor-pointer hover:bg-white"
                >
                  {CASE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-medical-600">▼</div>
             </div>
          </div>

          <button
            onClick={() => onStart(selectedCaseType)}
            disabled={isLoading}
            className="w-full group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-200 bg-medical-primary rounded-xl hover:bg-medical-primaryHover shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="animate-spin mr-2" /> : <PlayCircle className="mr-2" />}
            INITIALIZE SIMULATION
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-medical-50 relative">
      {/* Header */}
      <div className="border-b border-medical-200 p-4 flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-10 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="relative">
             <div className="w-2.5 h-2.5 rounded-full bg-medical-secondary animate-pulse"></div>
          </div>
          <div>
            <h2 className="font-bold text-medical-900 leading-tight tracking-wide">TUMOR BOARD</h2>
            <p className="text-[10px] text-medical-600 font-mono uppercase">
               CASE: {selectedCaseType.split(' ')[0]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onToggleDashboard}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-medical-600 bg-medical-50 hover:bg-medical-100 rounded border border-medical-200 transition-colors"
          >
            <BarChart2 size={14} />
            <span className="hidden sm:inline">Metrics</span>
          </button>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${getPhaseBadge(phase)}`}>
            {phase === CasePhase.PeerReview ? 'Peer Review' : phase}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar"
      >
        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-5 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-medical-primary text-white rounded-br-none shadow-medical-primary/20'
                  : 'bg-white border border-medical-200 text-medical-800 rounded-bl-none prose prose-slate prose-sm'
              }`}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        
        {phase === CasePhase.PeerReview && peerPlans.length > 0 && (
           <PeerReviewCards plans={peerPlans} />
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-medical-200 rounded-2xl p-4 rounded-bl-none flex items-center space-x-3 text-medical-600 shadow-sm">
               <Loader2 size={18} className="animate-spin text-medical-primary" />
               <span className="text-xs font-medium animate-pulse">Attending is analyzing...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-medical-200 bg-white">
        <form onSubmit={handleSubmit} className="relative flex items-center shadow-sm rounded-xl bg-medical-50 border border-medical-200 focus-within:ring-2 focus-within:ring-medical-primary/20 focus-within:border-medical-primary transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={phase === CasePhase.PeerReview ? "Critique the peer plans..." : "Type your assessment, plan, or request..."}
            disabled={isLoading || phase === CasePhase.Completed}
            className="flex-1 p-4 bg-transparent outline-none text-medical-900 placeholder:text-medical-600/50 disabled:opacity-50 font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || phase === CasePhase.Completed}
            className="p-3 mr-2 text-medical-primary hover:bg-medical-100 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
        <div className="mt-2 text-center">
            <p className="text-[10px] text-medical-600/60 flex items-center justify-center gap-1 font-mono">
                <ShieldAlert size={10} />
                SIMULATION ENVIRONMENT. NOT FOR CLINICAL USE.
            </p>
        </div>
      </div>
    </div>
  );
};

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);