import React from 'react';
import { PatientChartData } from '../types';
import { User, FileText, Activity, Layers, AlertCircle, Microscope, ImageIcon, Loader2 } from 'lucide-react';

interface PatientChartProps {
  data: PatientChartData;
  isGeneratingImage?: boolean;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="mb-4 last:mb-0 border border-medical-200 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
    <h3 className="flex items-center text-xs font-bold text-medical-primary uppercase tracking-widest px-4 py-2 bg-medical-50 border-b border-medical-200">
      <span className="mr-2 text-medical-primary">{icon}</span>
      {title}
    </h3>
    <div className="p-4 text-sm text-medical-800 leading-relaxed">
      {children}
    </div>
  </div>
);

export const PatientChart: React.FC<PatientChartProps> = ({ data, isGeneratingImage }) => {
  return (
    <div className="h-full overflow-y-auto p-4 bg-white custom-scrollbar">
      <div className="mb-6 border-b border-medical-200 pb-4">
           <h2 className="text-xl font-bold text-medical-900 tracking-tight">Patient Chart</h2>
           <p className="text-xs text-medical-600 font-mono mt-1 flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-green-500"></span>
             SECURE EMR • v2.1
           </p>
      </div>

      {(data.illustrationUrl || isGeneratingImage) && (
        <div className="mb-6 border border-medical-200 bg-white rounded-lg overflow-hidden relative group shadow-sm">
           <h3 className="absolute top-2 left-2 z-10 flex items-center text-xs font-bold text-white bg-medical-900/80 px-2 py-1 rounded backdrop-blur-sm shadow-sm">
             <ImageIcon size={12} className="mr-2" />
             MEDICAL ILLUSTRATION
           </h3>
           
           <div className="w-full aspect-[4/3] flex items-center justify-center bg-medical-50 border-b border-medical-100">
              {data.illustrationUrl ? (
                <img 
                  src={data.illustrationUrl} 
                  alt="Medical Illustration" 
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="flex flex-col items-center text-medical-600">
                  <Loader2 className="animate-spin mb-2 text-medical-primary" size={24} />
                  <span className="text-xs font-medium animate-pulse">Rendering Anatomy...</span>
                </div>
              )}
           </div>
        </div>
      )}

      {data.demographics && (
        <Section title="Demographics" icon={<User size={16} />}>
          <p className="font-mono text-medical-900 font-medium">{data.demographics}</p>
        </Section>
      )}

      {data.hpi && (
        <Section title="History of Present Illness" icon={<FileText size={16} />}>
          <p className="whitespace-pre-wrap">{data.hpi}</p>
        </Section>
      )}

      {data.comorbidities && (
        <Section title="Comorbidities / Status" icon={<Activity size={16} />}>
          <p className="whitespace-pre-wrap">{data.comorbidities}</p>
        </Section>
      )}

      {data.labs && (
         <Section title="Relevant Labs" icon={<Activity size={16} />}>
           <p className="whitespace-pre-wrap font-mono text-xs text-medical-600 bg-medical-50 p-2 rounded">{data.labs}</p>
         </Section>
       )}

      {data.imaging.length > 0 && (
        <Section title="Imaging Reports" icon={<Layers size={16} />}>
          <ul className="space-y-2">
            {data.imaging.map((img, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-medical-primary mr-2">▸</span>
                {img}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {data.pathology.length > 0 && (
        <Section title="Pathology" icon={<Microscope size={16} />}>
          <ul className="space-y-2">
            {data.pathology.map((path, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-medical-primary mr-2">▸</span>
                {path}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {data.staging && (
        <Section title="Staging" icon={<AlertCircle size={16} />}>
          <div className="inline-block border border-medical-primary/30 bg-medical-primary/5 px-3 py-1 rounded text-medical-primaryHover font-bold font-mono">
            {data.staging}
          </div>
        </Section>
      )}

      {!data.demographics && !data.hpi && (
        <div className="text-center text-medical-600 mt-20 p-8 border-2 border-dashed border-medical-200 rounded-xl bg-medical-50">
          <p className="text-lg mb-2 font-medium">No Active Case</p>
          <p className="text-sm">Initialize simulation to load patient data.</p>
        </div>
      )}
    </div>
  );
};