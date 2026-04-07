import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';

export const useAttendance = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const shop = (params?.shopId as string) || '';
  const dateParam = searchParams.get('date');

  const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [showToast, setShowToast] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [modal, setModal] = useState<any>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'info' });

  const calculateHours = (s: any) => {
    if (!s.startTime || !s.endTime) return 0;
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    let start = toMin(s.startTime), end = toMin(s.endTime);
    if (end < start) end += 1440;
    const diff = end - start - (Number(s.breakMinutes) || 0);
    return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
  };

  const fetchDailyData = useCallback(async () => {
    if (!shop || !date) return;
    try {
      const res = await fetch(`http://localhost:8000/kintai/?shop=${shop}&date=${date}`);
      const data = await res.json();
      
      if (Array.isArray(data) && data.length > 0 && data[0].content) {
        try {
          setStaffList(JSON.parse(data[0].content));
        } catch (e) {
          setStaffList([]);
        }
      } else {
        // 初期状態
        setStaffList([
          { id: Date.now().toString(), name: '', startTime: '17:30', endTime: '22:00', breakMinutes: 0 }
        ]);
      }
    } catch (e) { console.error(e); }
  }, [shop, date]);

  useEffect(() => { fetchDailyData(); }, [fetchDailyData]);

  const handleSaveClick = () => {
    const dailyTotal = staffList.reduce((sum, s) => sum + calculateHours(s), 0);
    setModal({
      show: true,
      title: "保存しますか？",
      message: `${date} の全データを上書き保存します。`,
      type: 'info',
      onConfirm: async () => {
        const payload = {
          shop, date, totalHours: dailyTotal,
          content: JSON.stringify(staffList)
        };
        await fetch("http://localhost:8000/kintai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        setModal((prev: any) => ({ ...prev, show: false }));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 2000);
      }
    });
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`/${shop}?date=${newDate}`);
  };

  return {
    shop, date, handleDateChange, staffList, modal, setModal, handleSaveClick, showToast, dailyTotal: staffList.reduce((sum, s) => sum + calculateHours(s), 0),
    addStaff: () => setStaffList([...staffList, { id: Date.now().toString(), name: '', startTime: '17:30', endTime: '22:00', breakMinutes: 0 }]),
    updateStaff: (id: string, f: string, v: any) => setStaffList(staffList.map(s => s.id === id ? { ...s, [f]: v } : s)),
    deleteStaff: (id: string) => setStaffList(staffList.filter(s => s.id !== id)),
    calculateHours, startListening: () => {}
  };
};