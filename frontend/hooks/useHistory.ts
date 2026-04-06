import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';

export const useHistory = () => {
  const params = useParams();
  const shop = params?.shopId as string;
  const [groupedHistory, setGroupedHistory] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!shop) return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:8000/kintai/history?shop=${shop}`);
      if (!response.ok) throw new Error("取得失敗");
      const rawData = await response.json();

      if (!Array.isArray(rawData)) {
        setGroupedHistory({});
        return;
      }

      // 日付で降順ソート
      rawData.sort((a: any, b: any) => b.date.localeCompare(a.date));

      const groups: any = {};
      rawData.forEach((item: any) => {
        const [year, month] = item.date.split('-');
        const monthKey = `${year}年${month}月`;
        if (!groups[monthKey]) groups[monthKey] = { items: [], monthTotal: 0 };
        groups[monthKey].items.push(item);
        groups[monthKey].monthTotal += Number(item.totalHours || 0);
      });
      setGroupedHistory(groups);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [shop]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const deleteHistory = async (kintaiId: number) => {
    try {
      const res = await fetch(`http://localhost:8000/kintai/${kintaiId}`, { method: 'DELETE' });
      if (res.ok) await fetchHistory();
    } catch (e) {
      alert("削除に失敗しました");
    }
  };

  return { shop, groupedHistory, loading, deleteHistory };
};