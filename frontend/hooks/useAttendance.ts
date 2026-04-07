import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [modal, setModal] = useState<any>({
    show: false, title: '', message: '', onConfirm: () => {}, type: 'info'
  });

  // 3.5秒の無音判定用タイマー
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // --- 1. 時間計算ロジック ---
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

  const dailyTotal = staffList.reduce((sum, staff) => sum + calculateHours(staff), 0);

  // --- 2. 【取得】 ---
  const loadSavedData = useCallback(async () => {
    if (!shop || !date) return;
    try {
      const response = await fetch(`http://localhost:8000/kintai/?shop=${shop}&date=${date}`);
      const data = await response.json();
      if (data && data.length > 0 && data[0].content) {
        setStaffList(JSON.parse(data[0].content));
      } else {
        setStaffList([
          { id: '1', name: '', startTime: '17:30', endTime: '22:00', breakMinutes: 0 },
        ]);
      }
    } catch (error) { console.error(error); }
  }, [date, shop]);

  useEffect(() => { loadSavedData(); }, [loadSavedData]);

  // --- 3. 【音声入力：高精度版】 ---
  const startListening = (staffId: string, onStart: () => void, onEnd: () => void) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ja-JP';
    recognition.continuous = true;
    recognition.interimResults = true;

    // 💡 3.5秒無音が続いたら自動停止
    const resetTimer = () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();
      }, 3000);
    };

    recognition.onstart = () => {
      onStart();
      resetTimer();
    };

    recognition.onresult = (event: any) => {
      resetTimer(); // 喋っている間はタイマーをリセット
      const lastIndex = event.results.length - 1;
      const result = event.results[lastIndex];

      if (result.isFinal) {
        let text = result[0].transcript
          .replace(/[０-９]/g, (s: string) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0)) // 全角数字を半角
          .replace(/半/g, "30分")
          .replace(/正午/g, "12時");

        const extractTime = (sentence: string, keywords: string[]) => {
          for (const word of keywords) {
            if (sentence.includes(word)) {
              // キーワードの直前のテキストを解析
              const part = sentence.split(word)[0];
              const timeMatch = part.match(/(\d{1,2})時(?:(\d{1,2})分)?$/) || part.match(/(\d{1,2})[:：](\d{1,2})$/);
              
              if (timeMatch) {
                let h = parseInt(timeMatch[1]);
                let m = timeMatch[2] ? timeMatch[2].padStart(2, '0') : "00";
                
                // 💡 精度向上：1-8時と言われたら午後(13-20時)と判断する補助ロジック
                if (h >= 1 && h <= 8) h += 12;
                
                return `${String(h).padStart(2, '0')}:${m}`;
              }
            }
          }
          return null;
        };

        const start = extractTime(text, ["入り", "から", "スタート", "開始"]);
        const end = extractTime(text, ["上がり", "まで", "終了", "終わり", "出し"]);

        if (start || end) {
          setStaffList(prev => prev.map(s => s.id === staffId ? {
            ...s,
            startTime: start || s.startTime,
            endTime: end || s.endTime
          } : s));
        }
      }
    };

    recognition.onend = () => {
      onEnd();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };

    recognition.start();
  };

  // --- 4. 【保存】 ---
  const executeSave = async () => {
    try {
      const payload = {
        shop, date, totalHours: dailyTotal,
        content: JSON.stringify(staffList)
      };
      await fetch("http://localhost:8000/kintai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setModal((prev: any) => ({ ...prev, show: false }));
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (e) { alert("保存に失敗しました"); }
  };

  const handleSaveClick = () => {
    setModal({
      show: true,
      title: "データを保存しますか？",
      message: `${date} のデータを上書き保存します。`,
      type: 'success',
      onConfirm: executeSave
    });
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    router.push(`/${shop}?date=${newDate}`);
  };

  return {
    shop, date, handleDateChange, staffList, dailyTotal, modal, setModal, handleSaveClick, showToast,
    addStaff: () => setStaffList(prev => [...prev, { id: Date.now().toString(), name: '', startTime: '17:30', endTime: '22:00', breakMinutes: 0 }]),
    updateStaff: (id: string, f: string, v: any) => setStaffList(prev => prev.map(s => s.id === id ? { ...s, [f]: v } : s)),
    deleteStaff: (id: string) => setStaffList(prev => prev.filter(s => s.id !== id)),
    startListening, calculateHours
  };
};