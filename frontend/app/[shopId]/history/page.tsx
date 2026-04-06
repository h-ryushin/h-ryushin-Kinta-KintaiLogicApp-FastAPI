"use client";

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Calendar, Trash2 } from 'lucide-react';
import { HistoryItem } from '@/components/organisms/HistoryItem';
import { SaveModal, ModalConfig } from '@/components/molecules/SaveModal';
import { useHistory } from '@/hooks/useHistory';

function HistoryContent() {
  const router = useRouter();
  const { shop, groupedHistory, loading, deleteHistory } = useHistory();
  const [modal, setModal] = useState<ModalConfig>({
    show: false, title: '', message: '', onConfirm: () => {}, type: 'info'
  });

  const handleDeleteClick = (item: any) => {
    setModal({
      show: true,
      title: "データを削除しますか？",
      message: `${item.date} の ${item.name} さんの記録を削除します。`,
      type: 'warning',
      onConfirm: async () => {
        await deleteHistory(item.id);
        setModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900">
      <SaveModal config={modal} onClose={() => setModal(prev => ({ ...prev, show: false }))} />

      <div className="max-w-2xl mx-auto space-y-8">
        <header className="flex justify-between items-center px-2">
          <button onClick={() => router.push(`/${shop}`)} className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm active:scale-95 transition-all">
            <ArrowLeft size={20} className="text-slate-400" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-black text-slate-800">履歴</h1>
            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
              {shop === 'kosai' ? '湖西店' : '西駅店'}
            </p>
          </div>
          <div className="w-11"></div>
        </header>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : (
          Object.entries(groupedHistory).map(([month, data]: any) => (
            <section key={month} className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-black text-slate-800">{month}</h2>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl font-black text-blue-700 border border-blue-100">
                  {data.monthTotal.toFixed(2)} H
                </div>
              </div>
              <div className="grid gap-3">
                {data.items.map((item: any) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onEditDate={() => {}}
                    onDelete={() => handleDeleteClick(item)}
                    onGoToDetail={() => router.push(`/${shop}?date=${item.date}`)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}

export default function Page() { return <Suspense fallback={<div>Loading...</div>}><HistoryContent /></Suspense>; }