// src/components/atoms/CalendarInput.tsx
import React from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export const CalendarInput: React.FC<Props> = ({ value, onChange }) => {
  return (
    <input 
      type="date" 
      value={value} 
      onChange={(e) => onChange(e.target.value)} 
      className="bg-slate-100 rounded-xl px-4 py-2 font-black outline-none border-none shadow-inner text-slate-700" 
    />
  );
};