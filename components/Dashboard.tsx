import React from 'react';
import { PerformanceMetrics, SessionHistoryItem } from '../types';
import { Target, BookOpen, ShieldCheck, AlertTriangle, X, History } from 'lucide-react';

interface DashboardProps {
  metrics: PerformanceMetrics;
  history?: SessionHistoryItem[];
  onClose: () => void;
}

const ScoreCard: React.FC<{ label: string; value: number; icon: React.ReactNode; color: string; bgClass: string; textClass: string }> = ({ label, value, icon, color, bgClass, textClass }) => (
  <div className="bg-white p-4 rounded-xl border border-medical-200 shadow-sm flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className={`p-2 rounded-lg ${bgClass} ${textClass}`}>
        {icon}
      </div>
      <span className="font-semibold text-medical-600">{label}</span>
    </div>
    <div className="flex items-center space-x-3">
      <div className="w-24 h-2 bg-medical-50 rounded-full overflow-hidden border border-medical-100">
        <div 
          className="h-full rounded-full" 
          style={{ width: `${value}%`, backgroundColor: color }}
        />
      </div>
      <span className="font-mono font-bold text-medical-900 text-lg">{value}</span>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ metrics, history = [], onClose }) => {
  return (
    <div className="absolute inset-0 z-50 bg-medical-900/20 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-medical-50 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl flex flex-col border border-medical-200 custom-scrollbar">
        
        <div className="p-6 border-b border-medical-200 flex justify-between items-center bg-white/50 rounded-t-2xl sticky top-0 z-10 backdrop-blur">
          <div>
            <h2 className="text-2xl font-bold text-medical-900 tracking-tight">Resident Performance</h2>
            <p className="text-sm text-medical-600 font-mono uppercase tracking-wider">Metrics & Competencies</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-medical-100 rounded-full transition-colors group">
            <X size={24} className="text-medical-600 group-hover:text-medical-800" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Current Session Stats */}
          <div>
            <h3 className="text-lg font-semibold text-medical-900 mb-4 flex items-center gap-2">
              <Target size={18} className="text-medical-primary" />
              Current Session
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <ScoreCard 
                label="Reasoning" 
                value={metrics.clinicalReasoning} 
                icon={<Target size={20} />}
                color="#9BB1C9" // Mild Blue
                bgClass="bg-[#9BB1C9]/20"
                textClass="text-[#7A91A9]"
              />
              <ScoreCard 
                label="Guidelines" 
                value={metrics.guidelineAdherence} 
                icon={<BookOpen size={20} />}
                color="#D68F9D" // Mild Pink
                bgClass="bg-[#D68F9D]/20"
                textClass="text-[#B56E7C]"
              />
              <ScoreCard 
                label="Safety" 
                value={metrics.safetyAwareness} 
                icon={<ShieldCheck size={20} />}
                color="#A8C2B0" // Mild Sage
                bgClass="bg-[#A8C2B0]/20"
                textClass="text-[#89A391]"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white p-5 rounded-xl border border-medical-200 shadow-sm">
              <h3 className="font-bold text-medical-900 mb-4 flex items-center">
                <BookOpen size={16} className="mr-2 text-oncology-pink" />
                Guidelines Cited
              </h3>
              {metrics.guidelinesCited.length > 0 ? (
                <ul className="space-y-2">
                  {metrics.guidelinesCited.map((g, i) => (
                    <li key={i} className="text-sm text-medical-600 flex items-start">
                      <span className="mr-2 text-oncology-pink">•</span>
                      {g}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-medical-400 italic">No specific guidelines cited yet.</p>
              )}
            </div>

            <div className="bg-[#FFF4F0] p-5 rounded-xl border border-[#FFE4D6] shadow-sm">
              <h3 className="font-bold text-[#8A5A4A] mb-4 flex items-center">
                <AlertTriangle size={16} className="mr-2 text-[#D98E75]" />
                Areas for Improvement
              </h3>
              {metrics.improvementAreas.length > 0 ? (
                <ul className="space-y-2">
                  {metrics.improvementAreas.map((area, i) => (
                    <li key={i} className="text-sm text-[#8A5A4A] bg-[#FFE4D6]/50 p-2 rounded border border-[#FFE4D6]">
                      {area}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#BFA093] italic">Keep up the good work!</p>
              )}
            </div>
          </div>

          {/* History Section */}
          <div className="pt-6 border-t border-medical-200">
            <h3 className="text-lg font-semibold text-medical-900 mb-4 flex items-center gap-2">
              <History size={18} className="text-medical-600" />
              Session History
            </h3>
            
            {history.length === 0 ? (
              <p className="text-medical-600 italic">No previous session history found.</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-medical-200 bg-white shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-medical-100 text-medical-600 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Case Scenario</th>
                      <th className="px-4 py-3 text-right">Reasoning</th>
                      <th className="px-4 py-3 text-right">Guidelines</th>
                      <th className="px-4 py-3 text-right">Safety</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-medical-100">
                    {history.slice(0, 10).map((session) => (
                      <tr key={session.id} className="hover:bg-medical-50 transition-colors">
                        <td className="px-4 py-3 text-medical-800 font-mono text-xs">
                          {new Date(session.timestamp).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-medical-primary font-medium">
                          {session.caseType}
                        </td>
                        <td className="px-4 py-3 text-right text-[#7A91A9] font-bold">
                          {session.metrics.clinicalReasoning}
                        </td>
                        <td className="px-4 py-3 text-right text-[#B56E7C] font-bold">
                          {session.metrics.guidelineAdherence}
                        </td>
                        <td className="px-4 py-3 text-right text-[#89A391] font-bold">
                          {session.metrics.safetyAwareness}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {history.length > 10 && (
                  <div className="p-2 text-center text-xs text-medical-400 border-t border-medical-200">
                    Showing last 10 sessions
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
        
      </div>
    </div>
  );
};