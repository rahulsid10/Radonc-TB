import React, { useState, useEffect } from 'react';
import { PatientChart } from './components/PatientChart';
import { TumorBoard } from './components/TumorBoard';
import { Dashboard } from './components/Dashboard';
import { CaseState, CasePhase, Message, PatientChartData, PerformanceMetrics, SessionHistoryItem } from './types';
import { generateNextTurn, generateMedicalIllustration } from './geminiService';

const initialChart: PatientChartData = {
  demographics: '',
  hpi: '',
  imaging: [],
  pathology: [],
  staging: '',
  comorbidities: '',
  labs: ''
};

const initialMetrics: PerformanceMetrics = {
  clinicalReasoning: 100,
  guidelineAdherence: 100,
  safetyAwareness: 100,
  guidelinesCited: [],
  improvementAreas: []
};

const initialState: CaseState = {
  isActive: false,
  phase: CasePhase.Vignette,
  chart: initialChart,
  messages: [],
  isLoading: false,
  metrics: initialMetrics,
  peerPlans: []
};

const HISTORY_STORAGE_KEY = 'radonc_sim_history';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<CaseState>(initialState);
  const [showDashboard, setShowDashboard] = useState(false);
  const [currentCaseType, setCurrentCaseType] = useState<string>("Random");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);

  useEffect(() => {
    if (!process.env.API_KEY) {
      setGameState(prev => ({
        ...prev,
        error: "Missing API_KEY in environment variables."
      }));
    }

    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const saveCurrentSession = (metrics: PerformanceMetrics, caseType: string) => {
    const newItem: SessionHistoryItem = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      caseType: caseType,
      metrics: { ...metrics }
    };

    const updatedHistory = [newItem, ...history];
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const handleStartCase = async (caseType: string) => {
    if (gameState.isActive && gameState.messages.length > 1) {
      saveCurrentSession(gameState.metrics, currentCaseType);
    }

    setCurrentCaseType(caseType);
    setGameState({
      ...initialState,
      isActive: true,
      isLoading: true,
      messages: [],
    });
    setIsGeneratingImage(false);

    try {
      const response = await generateNextTurn(CasePhase.Vignette, initialChart, [], "Start Case", caseType);
      
      const assistantMsg: Message = {
        role: 'assistant',
        content: `**CASE STARTED**\n\n${response.feedback}\n\n**${response.questionToResident}**`,
        timestamp: Date.now()
      };

      setGameState(prev => ({
        ...prev,
        phase: response.nextPhase as CasePhase,
        chart: { ...prev.chart, ...response.chartUpdates },
        messages: [assistantMsg],
        isLoading: false,
        metrics: initialMetrics
      }));

      if (response.visualDescription) {
        setIsGeneratingImage(true);
        generateMedicalIllustration(response.visualDescription).then(url => {
          if (url) {
            setGameState(prev => ({
              ...prev,
              chart: { ...prev.chart, illustrationUrl: url }
            }));
          }
          setIsGeneratingImage(false);
        });
      }

    } catch (error) {
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        error: "Failed to generate initial case. Please try again."
      }));
    }
  };

  const handleSendMessage = async (userText: string) => {
    const userMsg: Message = {
      role: 'user',
      content: userText,
      timestamp: Date.now()
    };

    setGameState(prev => ({
      ...prev,
      messages: [...prev.messages, userMsg],
      isLoading: true
    }));

    try {
      const response = await generateNextTurn(
        gameState.phase,
        gameState.chart,
        [...gameState.messages, userMsg],
        userText,
        currentCaseType
      );

      const assistantMsg: Message = {
        role: 'assistant',
        content: `${response.feedback}\n\n**${response.questionToResident}**`,
        timestamp: Date.now()
      };

      setGameState(prev => {
        const updatedChart = { ...prev.chart };
        
        if (response.chartUpdates) {
          if (response.chartUpdates.demographics) updatedChart.demographics = response.chartUpdates.demographics;
          if (response.chartUpdates.hpi) updatedChart.hpi = response.chartUpdates.hpi;
          if (response.chartUpdates.comorbidities) updatedChart.comorbidities = response.chartUpdates.comorbidities;
          if (response.chartUpdates.staging) updatedChart.staging = response.chartUpdates.staging;
          if (response.chartUpdates.labs) updatedChart.labs = response.chartUpdates.labs;
          
          if (response.chartUpdates.imaging && response.chartUpdates.imaging.length > 0) {
            updatedChart.imaging = [...prev.chart.imaging, ...response.chartUpdates.imaging];
          }
          if (response.chartUpdates.pathology && response.chartUpdates.pathology.length > 0) {
            updatedChart.pathology = [...prev.chart.pathology, ...response.chartUpdates.pathology];
          }
        }

        const updatedMetrics = { ...prev.metrics };
        if (response.performanceUpdate) {
          if (response.performanceUpdate.clinicalReasoning) updatedMetrics.clinicalReasoning = response.performanceUpdate.clinicalReasoning;
          if (response.performanceUpdate.guidelineAdherence) updatedMetrics.guidelineAdherence = response.performanceUpdate.guidelineAdherence;
          if (response.performanceUpdate.safetyAwareness) updatedMetrics.safetyAwareness = response.performanceUpdate.safetyAwareness;
          
          if (response.performanceUpdate.guidelinesCited) {
            updatedMetrics.guidelinesCited = [...new Set([...updatedMetrics.guidelinesCited, ...response.performanceUpdate.guidelinesCited])];
          }
          if (response.performanceUpdate.improvementAreas) {
             updatedMetrics.improvementAreas = [...new Set([...updatedMetrics.improvementAreas, ...response.performanceUpdate.improvementAreas])];
          }
        }

        const updatedPeerPlans = response.peerPlans && response.peerPlans.length > 0 
          ? response.peerPlans 
          : prev.peerPlans;

        return {
          ...prev,
          phase: response.nextPhase as CasePhase,
          chart: updatedChart,
          messages: [...prev.messages, userMsg, assistantMsg],
          metrics: updatedMetrics,
          peerPlans: updatedPeerPlans,
          isLoading: false
        };
      });

    } catch (error) {
      console.error(error);
      setGameState(prev => ({
        ...prev,
        isLoading: false,
        messages: [...prev.messages, { role: 'system', content: 'Connection Error: Please try again.', timestamp: Date.now() }]
      }));
    }
  };

  if (gameState.error) {
     return (
       <div className="h-screen flex items-center justify-center bg-medical-50 text-red-500 p-4">
         <div className="text-center bg-white p-6 rounded-xl shadow-lg border border-red-100">
           <h1 className="text-2xl font-bold mb-2">Configuration Error</h1>
           <p>{gameState.error}</p>
         </div>
       </div>
     );
  }

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-medical-50 overflow-hidden relative">
      {/* Dashboard Overlay */}
      {showDashboard && (
        <Dashboard 
          metrics={gameState.metrics} 
          history={history}
          onClose={() => setShowDashboard(false)} 
        />
      )}

      {/* Left Panel: Chart */}
      <div className={`${gameState.isActive ? 'block' : 'hidden'} md:block w-full md:w-1/3 lg:w-1/4 h-1/2 md:h-full border-r border-medical-200 shadow-lg z-20 bg-white`}>
        <PatientChart data={gameState.chart} isGeneratingImage={isGeneratingImage} />
      </div>

      {/* Right Panel: Simulation */}
      <div className="flex-1 h-1/2 md:h-full relative bg-medical-50">
        <TumorBoard
          isActive={gameState.isActive}
          onStart={handleStartCase}
          messages={gameState.messages}
          onSendMessage={handleSendMessage}
          isLoading={gameState.isLoading}
          phase={gameState.phase}
          peerPlans={gameState.peerPlans}
          onToggleDashboard={() => setShowDashboard(true)}
        />
      </div>
    </div>
  );
};

export default App;