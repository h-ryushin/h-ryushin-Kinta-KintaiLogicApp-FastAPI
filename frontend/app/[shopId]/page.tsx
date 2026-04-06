"use client";

import React, { Suspense } from 'react';
import { Plus, Save, Store, HelpCircle, History as HistoryIcon, TrendingUp } from 'lucide-react';
import { StaffCard } from '@/components/molecules/StaffCard'; // 既存のやつ
import Link from 'next/link';

// 🆕 分割した部品たちをインポート
import { useAttendance } from '@/hooks/useAttendance';
import { SaveModal } from '@/components/molecules/SaveModal';
import { CalendarInput } from '@/components/atoms/CalendarInput';

function AttendanceContent() {
  // 🆕 ロジックは全部useAttendanceにおまかせ！
  const {
    shop, date, handleDateChange,
    staffList, addStaff, updateStaff, deleteStaff, startListening,
    dailyTotal, calculateHours,
    modal, setModal, handleSaveClick,
    showToast
  } = useAttendance();

  const shopDisplayName = shop === 'kosai' ? '湖西店' : '西駅店';

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900 overflow-x-hidden relative">
      {/* 🆕 切り出したモーダル */}
      <SaveModal config={modal} onClose={() => setModal(prev => ({ ...prev, show: false }))} />

      <div className="max-w-4xl mx-auto space-y-6">
        {showToast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[150] bg-slate-900 text-white px-6 py-3 rounded-full shadow-2xl animate-in slide-in-from-top-4 duration-300">保存完了しました！</div>}
        
        {/* 🆕 ヘッダー部分もテキトーに分割 */}
        <header className="bg-white rounded-3xl border border-slate-200 p-6 flex justify-between items-center shadow-sm">
          <div><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 leading-none">Management</p><h1 className="text-2xl font-black flex items-center gap-2"><Store size={20} className="text-blue-500" />{shopDisplayName}</h1></div>
          {/* 🆕 切り出した日付インプット */}
          <CalendarInput value={date} onChange={handleDateChange} />
        </header>

        {/* バナー部分 (ここも本来は InfoBanner として分割) */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
          <HelpCircle size={18} className="text-slate-300" />
          <p className="text-[11px] text-slate-500 font-bold">音声入力を使う場合「17時3分入り22時30分上がり」のように喋ってください。<br />休憩は手打ちでお願いします。</p>
        </div>

        {/* スタッフリスト */}
        <div className="grid gap-3">
          {staffList.map((staff) => (
            <StaffCard key={staff.id} staff={staff} onUpdate={updateStaff} onDelete={() => deleteStaff(staff.id)} onVoiceInput={startListening} calculateHours={calculateHours} />
          ))}
        </div>

        {/* トータル時間カード (ここも本来は TotalHoursCard として分割) */}
        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white flex justify-between items-center shadow-2xl mt-4 border border-slate-800">
          <div className="flex items-center gap-5">
            <div className="bg-blue-600 p-4 rounded-3xl shadow-lg shadow-blue-500/20"><TrendingUp size={32} /></div>
            <div>
              <p className="text-blue-300 text-[10px] font-black mb-1 uppercase tracking-widest leading-none mb-1">Total Hours</p>
              <h2 className="text-5xl font-black tabular-nums leading-none">{dailyTotal.toFixed(2)} <span className="text-xl text-blue-400 font-bold">H</span></h2>
            </div>
          </div>
        </div>

        {/* 下部ボタン群 (ここも ActionButtonGroup として分割) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          <button onClick={addStaff} className="bg-white border border-slate-200 text-slate-400 py-4 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-2"><Plus size={20} /><span>追加</span></button>
          <button onClick={handleSaveClick} className="md:col-span-2 bg-blue-600 text-white py-4 rounded-[2rem] font-black shadow-xl shadow-blue-200 active:scale-95 hover:bg-blue-700 transition-all flex items-center justify-center gap-3 text-lg"><Save size={24} /><span>保存する</span></button>
          <Link href={`/${shop}/history`} className="bg-slate-100 text-slate-500 py-4 rounded-[2rem] font-bold active:scale-95 transition-all flex items-center justify-center gap-2"><HistoryIcon size={18} /><span>履歴</span></Link>
        </div>

        <div className="h-10 w-full flex-shrink-0" aria-hidden="true" />
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><AttendanceContent /></Suspense>; }