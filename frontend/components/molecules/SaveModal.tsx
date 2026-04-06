// src/components/molecules/SaveModal.tsx
import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';

export type ModalConfig = {
  show: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  type: 'success' | 'warning' | 'info';
};

type Props = {
  config: ModalConfig;
  onClose: () => void;
};

export const SaveModal: React.FC<Props> = ({ config, onClose }) => {
  if (!config.show) return null;

  const isWarning = config.type === 'warning';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${isWarning ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500'}`}>
          {isWarning ? <AlertTriangle size={28} /> : <CheckCircle2 size={28} />}
        </div>
        <h3 className="text-xl font-black text-slate-900 mb-2">{config.title}</h3>
        <p className="text-sm font-bold text-slate-500 leading-relaxed mb-8">{config.message}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onClose} className="py-4 rounded-2xl bg-slate-100 text-slate-500 font-black active:scale-95 transition-all">キャンセル</button>
          <button onClick={config.onConfirm} className={`py-4 rounded-2xl text-white font-black active:scale-95 transition-all shadow-lg ${isWarning ? 'bg-amber-500 shadow-amber-200' : 'bg-blue-600 shadow-blue-200'}`}>確定する</button>
        </div>
      </div>
    </div>
  );
};