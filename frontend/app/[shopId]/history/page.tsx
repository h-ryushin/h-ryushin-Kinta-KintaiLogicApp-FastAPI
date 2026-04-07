"use client";
import React, { useState, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { HistoryItem } from '@/components/organisms/HistoryItem';
import { SaveModal, ModalConfig } from '@/components/molecules/SaveModal';
import { useHistory } from '@/hooks/useHistory';

function HistoryContent() {
  const router = useRouter();
  const params = useParams();
  const shop = params?.shopId as string;
  const { groupedHistory, loading, deleteHistory, fetchHistory } = useHistory();
  
  const [modal, setModal] = useState<ModalConfig>({
    show: false, title: '', message: '', onConfirm: () => {}, type: 'info'
  });

  const handleEditDate = async (oldDate: string, newDate: string, itemData: any) => {
    if (!newDate || newDate === oldDate) return;
    setModal({
      show: true,
      title: "日付を変更しますか？",
      message: `${oldDate} のデータを ${newDate} に移動します。`,
      type: 'info',
      onConfirm: async () => {
        setModal(prev => ({ ...prev, show: false }));
        // 新しい日付で保存
        await fetch("http://localhost:8000/kintai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...itemData, id: null, date: newDate })
        });
        // 古い日付を削除
        await deleteHistory(itemData.id);
        fetchHistory(); // 再読み込み
      }
    });
  };

  const handleDeleteClick = (item: any) => {
    setModal({
      show: true,
      title: "データを削除しますか？",
      message: `${item.date} の記録を完全に削除します。`,
      type: 'warning',
      onConfirm: async () => {
        await deleteHistory(item.id);
        setModal(prev => ({ ...prev, show: false }));
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8 font-sans text-slate-900 overflow-x-hidden relative">
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
          <div className="w-11" />
        </header>

        {loading ? (
          <div className="flex justify-center py-24"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
        ) : (
          Object.entries(groupedHistory).map(([month, data]: any) => (
            <section key={month} className="space-y-4">
              <div className="flex justify-between items-center px-2">
                <h2 className="text-xl font-black text-slate-800">{month}</h2>
                <div className="bg-blue-50 px-4 py-2 rounded-2xl font-black text-blue-700 border border-blue-100">{data.monthTotal.toFixed(2)} H</div>
              </div>
              <div className="grid gap-3">
                {data.items.map((item: any) => (
                  <HistoryItem
                    key={item.id}
                    item={item}
                    onEditDate={handleEditDate}
                    onDelete={handleDeleteClick}
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

export default function Page() { 
  return (
    <Suspense fallback={<div className="flex justify-center py-24 text-blue-500"><Loader2 className="animate-spin" /></div>}>
      <HistoryContent />
    </Suspense>
  ); 
}