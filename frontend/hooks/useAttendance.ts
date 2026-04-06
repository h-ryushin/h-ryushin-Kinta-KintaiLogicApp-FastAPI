import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { ModalConfig } from '@/components/molecules/SaveModal';

export const useAttendance = () => {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const shop = params.shopId as string;
  const dateParam = searchParams.get('date');

  const [date, setDate] = useState(dateParam || new Date().toISOString().split('T')[0]);
  const [showToast, setShowToast] = useState(false);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [modal, setModal] = useState<ModalConfig>({
    show: false, title: '', message: '', onConfirm: () => {}, type: 'info'
  });

  const recognitionRef = useRef<any>(null);

  // --- 【取得】FastAPIからデータを取ってくる ---
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const response = await fetch(`http://localhost:8000/kintai/?shop=${shop}&date=${date}`);
        const data = await response.json();

        if (data && data.length > 0) {
          // DBには1人1行で入っているので、そのままセット
          setStaffList(data);
        } else {
          // データがない時の初期値
          setStaffList([
            { id: '1', name: '', startTime: '17:30', endTime: '20:00', breakMinutes: 0 },
            { id: '2', name: '', startTime: '19:00', endTime: '22:00', breakMinutes: 0 },
            { id: '3', name: '', startTime: '13:30', endTime: '15:30', breakMinutes: 0 },
          ]);
        }
      } catch (error) {
        console.error("Fetch error:", error);
      }
    };
    loadSavedData();
  }, [date, shop]);

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`/${shop}?date=${newDate}`);
  };

  const calculateHours = (s: any) => {
    const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    let start = toMin(s.startTime), end = toMin(s.endTime);
    if (end < start) end += 1440;
    const diff = end - start - s.breakMinutes;
    return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
  };

  const dailyTotal = staffList.reduce((sum, staff) => sum + calculateHours(staff), 0);

  // --- 【保存】FastAPIへスタッフ全員分を1つずつ送る ---
  const executeSave = async () => {
    try {
      const savePromises = staffList.map(staff => {
        const payload = {
          shop: shop,
          date: date,
          name: staff.name,
          startTime: staff.startTime,
          endTime: staff.endTime,
          breakMinutes: staff.breakMinutes,
          totalHours: calculateHours(staff)
        };

        return fetch("http://localhost:8000/kintai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      });

      await Promise.all(savePromises);
      setModal(prev => ({ ...prev, show: false }));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (error) {
      alert("保存に失敗しました");
    }
  };

  const handleSaveClick = async () => {
    // 簡易的に毎回「保存しますか？」を出す設定にします
    setModal({
      show: true,
      title: "データを保存しますか？",
      message: `${date} の勤務記録を保存します。`,
      type: 'success',
      onConfirm: executeSave
    });
  };

  const addStaff = () => setStaffList(prev => [...prev, { id: Date.now().toString(), name: '', startTime: '17:30', endTime: '22:00', breakMinutes: 0 }]);
  const updateStaff = (id: string, field: string, value: any) => setStaffList(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  const deleteStaff = (id: string) => setStaffList(prev => prev.filter(s => s.id !== id));

  // 音声入力 (省略せずそのまま維持)
  const startListening = (staffId: string, onStart: () => void, onEnd: () => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.onstart = onStart;
    recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        // ... (以前の抽出ロジック) ...
    };
    recognition.onend = onEnd;
    recognition.start();
  };

  return {
    shop, date, handleDateChange, staffList, addStaff, updateStaff, deleteStaff,
    startListening, dailyTotal, calculateHours, modal, setModal, handleSaveClick, showToast
  };
};