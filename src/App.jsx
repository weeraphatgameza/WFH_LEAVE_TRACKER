import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  User, 
  Briefcase, 
  Plane, 
  Loader2,
  AlertCircle
} from 'lucide-react';

const BANK_HOLIDAYS = {
  '2026-01-01': 'วันขึ้นปีใหม่',
  '2026-03-02': 'วันมาฆบูชา',
  '2026-04-06': 'วันพระบาทสมเด็จพระพุทธยอดฟ้าจุฬาโลกมหาราชฯ',
  '2026-04-13': 'วันสงกรานต์',
  '2026-04-14': 'วันสงกรานต์',
  '2026-04-15': 'วันสงกรานต์',
  '2026-05-01': 'วันแรงงานแห่งชาติ',
  '2026-05-04': 'วันฉัตรมงคล',
  '2026-06-03': 'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี',
  '2026-07-28': 'วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว',
  '2026-07-29': 'วันอาสาฬหบูชา',
  '2026-08-12': 'วันเฉลิมพระชนมพรรษาสมเด็จพระบรมราชชนนีพันปีหลวงฯ',
  '2026-10-13': 'วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศรฯ',
  '2026-10-23': 'วันปิยมหาราช',
  '2026-12-05': 'วันคล้ายวันพระบรมราชสมภพพระบาทสมเด็จพระบรมชนกาธิเบศรฯ',
  '2026-12-10': 'วันรัฐธรรมนูญ',
  '2026-12-31': 'วันสิ้นปี'
};

const TEAM_MEMBERS = [
  { name: 'พี่ฤทธิ์', floor: 24 },
  { name: 'พี่อี๊ด', floor: 24 },
  { name: 'พี่ตู่', floor: 3 },
  { name: 'พี่นนท์', floor: 3 },
  { name: 'พี่มิม', floor: 3 },
  { name: 'พี่พั๊นซ์', floor: 3 },
  { name: 'พี่พลอย', floor: 3 },
  { name: 'พี่เอ็ม', floor: 3 },
  { name: 'พี่เค้ก', floor: 24 },
  { name: 'น้องเกม', floor: 24 },
  { name: 'น้องรุ้ง', floor: 24 }
];

const getLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const renderThaiDate = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, day] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' });
};

const getDayNameText = (dateStr) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dayNamesShort = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  return dayNamesShort[new Date(y, m - 1, d).getDay()];
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [fileSha, setFileSha] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [formError, setFormError] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [selectedDateStr, setSelectedDateStr] = useState(getLocalDateStr(new Date()));
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('WFH');
  const [isRecurring, setIsRecurring] = useState(false);

  const [leaveStartDate, setLeaveStartDate] = useState(getLocalDateStr(new Date()));
  const [leaveEndDate, setLeaveEndDate] = useState(getLocalDateStr(new Date()));

  const currentActualYear = new Date().getFullYear();
  const dynamicYears = Array.from({ length: 7 }, (_, i) => currentActualYear - 2 + i);

  const toBase64 = (str) => btoa(unescape(encodeURIComponent(str)));
  const fromBase64 = (str) => decodeURIComponent(escape(atob(str)));

  const API_ENDPOINT = `https://api.github.com/repos/${import.meta.env.VITE_GITHUB_REPO}/contents/db.json`;

  useEffect(() => {
    setLeaveStartDate(selectedDateStr);
    setLeaveEndDate(selectedDateStr);
  }, [selectedDateStr]);

  useEffect(() => {
    setFormError(null);
  }, [formName, formType, selectedDateStr, leaveStartDate, leaveEndDate, isRecurring]);

  const fetchDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 🛠️ แก้ไขเอา 'Cache-Control': 'no-cache' ออกเพื่อผ่านด่านตรวจ CORS ของ GitHub API
      const res = await fetch(API_ENDPOINT, {
        headers: {
          'Authorization': `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      if (!res.ok) throw new Error('ไม่สามารถเชื่อมต่อฐานข้อมูลบน GitHub ได้');

      const data = await res.json();
      setFileSha(data.sha);

      const rawContent = fromBase64(data.content.replace(/\s/g, ''));
      const parsed = JSON.parse(rawContent);
      setEvents(parsed.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabase();
  }, []);

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(getLocalDateStr(today));
  };

  const updateDatabase = async (newEvents, commitMessage) => {
    setSubmitting(true);
    try {
      const updatedData = { events: newEvents };
      const jsonString = JSON.stringify(updatedData, null, 2);
      
      const res = await fetch(API_ENDPOINT, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${import.meta.env.VITE_GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          message: commitMessage,
          content: toBase64(jsonString),
          sha: fileSha
        })
      });
      if (!res.ok) throw new Error('บันทึกข้อมูลไม่สำเร็จ มีการอัปเดตซ้อนจากสมาชิกคนอื่น กรุณารีเฟรชแอป');

      const data = await res.json();
      setFileSha(data.content.sha);
      setEvents(newEvents);
      return true;
    } catch (err) {
      setFormError(err.message);
      fetchDatabase();
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddEvent = async () => {
    if (!formName) {
      setFormError('⚠️ กรุณาเลือกชื่อของคุณจากรายการ');
      return;
    }

    const userObj = TEAM_MEMBERS.find(m => m.name === formName);
    const userFloor = userObj ? userObj.floor : 24;

    if (formType === 'Leave') {
      let start = new Date(leaveStartDate);
      let end = new Date(leaveEndDate);

      if (start > end) {
        setFormError('❌ วันเริ่มต้นจองต้องไม่เกินวันสิ้นสุด');
        return;
      }

      const datesToAdd = [];
      const skippedDays = [];

      while (start <= end) {
        const dayOfWeek = start.getDay();
        const loopDateStr = getLocalDateStr(start);

        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const isDuplicate = events.some(ev => ev.date === loopDateStr && ev.name === formName);
          if (isDuplicate) {
            skippedDays.push(start.getDate());
          } else {
            datesToAdd.push(loopDateStr);
          }
        }
        start.setDate(start.getDate() + 1);
      }

      if (datesToAdd.length === 0) {
        setFormError('❌ ไม่สามารถบันทึกได้ เนื่องจากคุณลงทะเบียนซ้ำหรือช่วงวันดังกล่าวเป็นวันหยุดเสาร์-อาทิตย์ทั้งหมด');
        setFormName('');
        return;
      }

      const generatedLeaves = datesToAdd.map(dateStr => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: formName,
        date: dateStr,
        type: 'Leave'
      }));

      const updatedEvents = [...events, ...generatedLeaves];
      const success = await updateDatabase(updatedEvents, `Add Leave range for ${formName}`);
      if (success) {
        setFormName('');
      }
      return;
    }

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (formType === 'WFH' && isRecurring) {
      const [selY, selM, selD] = selectedDateStr.split('-').map(Number);
      const targetDayOfWeek = new Date(selY, selM - 1, selD).getDay(); 
      
      const datesToAdd = [];
      const skippedDays = [];

      const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= totalDaysInMonth; d++) {
        const currentLoopDate = new Date(year, month, d);
        if (currentLoopDate.getDay() === targetDayOfWeek) {
          const loopDateStr = getLocalDateStr(currentLoopDate);
          
          const isUserDup = events.some(ev => ev.date === loopDateStr && ev.name === formName);
          
          let isQuotaFull = false;
          if (userFloor === 3) {
            const floor3WfhCount = events.filter(ev => {
              if (ev.date !== loopDateStr || ev.type !== 'WFH') return false;
              const evUser = TEAM_MEMBERS.find(m => m.name === ev.name);
              return evUser && evUser.floor === 3;
            }).length;
            if (floor3WfhCount >= 2) isQuotaFull = true;
          }

          if (isUserDup || isQuotaFull) {
            skippedDays.push(d);
          } else {
            datesToAdd.push(loopDateStr);
          }
        }
      }

      if (datesToAdd.length === 0) {
        setFormError('❌ ไม่สามารถจอง WFH รายสัปดาห์ได้ เนื่องจากชื่อซ้ำหรือโควต้าของทีมชั้น 3 เต็มหมดแล้ว');
        setFormName(''); 
        setIsRecurring(false);
        return;
      }

      const generatedEvents = datesToAdd.map(dateStr => ({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: formName,
        date: dateStr,
        type: 'WFH'
      }));

      const updatedEvents = [...events, ...generatedEvents];
      const success = await updateDatabase(updatedEvents, `Add recurring WFH for ${formName}`);
      if (success) {
        setFormName('');
        setIsRecurring(false);
        if (skippedDays.length > 0) {
          setFormError(`บันทึกสำเร็จบางส่วน! ข้ามวันที่โควต้าเต็ม/ชื่อซ้ำ: วันที่ ${skippedDays.join(', ')}`);
        }
      }
      return;
    }

    const isDuplicate = events.some(ev => ev.date === selectedDateStr && ev.name === formName);
    if (isDuplicate) {
      setFormError(`❌ ${formName} ได้ลงทะเบียนใช้งานในวันนี้ไปแล้ว ไม่สามารถจองซ้ำได้`);
      setFormName(''); 
      return;
    }

    if (formType === 'WFH' && userFloor === 3) {
      const floor3WfhCount = events.filter(ev => {
        if (ev.date !== selectedDateStr || ev.type !== 'WFH') return false;
        const evUser = TEAM_MEMBERS.find(m => m.name === ev.name);
        return evUser && evUser.floor === 3;
      }).length;

      if (floor3WfhCount >= 2) {
        setFormError('❌ โควต้า WFH ของพนักงานชั้น 3 เต็มแล้ว (ไม่เกิน 2 คน/วัน) ชั้นอื่นจองได้ปกติครับ');
        setFormName(''); 
        return;
      }
    }

    const newEvent = {
      id: Date.now().toString(),
      name: formName,
      date: selectedDateStr,
      type: formType
    };

    const updatedEvents = [...events, newEvent];
    const success = await updateDatabase(updatedEvents, `Add ${formType} for ${formName}`);
    if (success) setFormName('');
  };

  const handleDeleteEvent = async (id, name, type) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการนี้?')) return;
    const updatedEvents = events.filter(ev => ev.id !== id);
    await updateDatabase(updatedEvents, `Delete ${type} of ${name}`);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysArray = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }

  const changeMonth = (offset) => {
    setCurrentDate(new Date(year, month + offset, 1));
  };

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased pb-12">
      <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md sticky top-0 z-10 px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6" />
            <h1 className="text-lg font-bold tracking-wide">WFH & Leave Tracker</h1>
          </div>
          {loading && <Loader2 className="w-5 h-5 animate-spin text-white/80" />}
        </div>
      </header>

      <main className="max-w-md mx-auto px-3 mt-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-start space-x-2 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex space-x-2 items-stretch">
          <button 
            type="button"
            onClick={handleGoToToday}
            className="bg-slate-950 text-white font-bold px-4 rounded-2xl hover:bg-slate-800 active:scale-95 transition text-sm flex items-center justify-center shadow-sm whitespace-nowrap"
          >
            วันนี้
          </button>
          
          <div className="flex-1 bg-white rounded-2xl px-3 py-2 shadow-sm border border-slate-100 flex justify-between items-center">
            <button type="button" onClick={() => changeMonth(-1)} className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition">
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-1">
              <span className="text-sm font-bold text-slate-700">{monthNames[month]}</span>
              <select
                value={year}
                onChange={(e) => setCurrentDate(new Date(Number(e.target.value), month, 1))}
                className="text-sm font-bold text-blue-600 bg-slate-50 border border-slate-200 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {dynamicYears.map((y) => (
                  <option key={y} value={y}>พ.ศ. {y + 543}</option>
                ))}
              </select>
            </div>

            <button type="button" onClick={(e) => changeMonth(1)} className="p-1.5 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-3 shadow-sm border border-slate-100">
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 mb-2">
            <div>อา</div><div>จ</div><div>อ</div><div>พ</div><div>พฤ</div><div>ศ</div><div>ส</div>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {daysArray.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} className="aspect-square"></div>;

              const dateStr = getLocalDateStr(date);
              const dayOfWeek = date.getDay();
              const isWeekday = dayOfWeek > 0 && dayOfWeek < 6;
              
              const isBankHoliday = !!BANK_HOLIDAYS[dateStr];
              const dayEvents = events.filter(ev => ev.date === dateStr);

              const isGoldDay = isWeekday && !isBankHoliday && dayEvents.length === 0;
              const isSelected = selectedDateStr === dateStr;

              let bgClass = 'bg-slate-50 hover:bg-slate-100';
              if (isGoldDay) bgClass = 'bg-amber-100 text-amber-900 border border-amber-300 font-medium';
              if (isBankHoliday) bgClass = 'bg-rose-50 text-rose-700';
              if (isSelected) bgClass = 'ring-2 ring-blue-600 ring-offset-1 bg-blue-50';

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDateStr(dateStr)}
                  className={`aspect-square rounded-2xl flex flex-col justify-between p-1.5 transition relative ${bgClass}`}
                >
                  <span className={`text-xs font-semibold ${isBankHoliday ? 'text-rose-600' : ''}`}>
                    {date.getDate()}
                  </span>

                  <div className="w-full space-y-0.5 text-[9px] scale-90 origin-bottom">
                    {dayEvents.slice(0, 2).map((ev) => (
                      <div 
                        key={ev.id} 
                        className={`${
                          ev.type === 'WFH' ? 'bg-blue-600' : 'bg-rose-600'
                        } text-white rounded px-0.5 truncate text-center leading-tight`}
                      >
                        {ev.name}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[8px] text-slate-400 text-center font-bold">+{dayEvents.length - 2}</div>
                    )}
                    {isGoldDay && (
                      <div className="text-amber-600 text-center font-bold text-[10px] animate-pulse">✨</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <span className="text-xs text-slate-400 font-medium">วันที่เลือก</span>
            <div className="text-base font-bold text-slate-700 flex items-center justify-between">
              <span>{renderThaiDate(selectedDateStr)}</span>
              {BANK_HOLIDAYS[selectedDateStr] && (
                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                  {BANK_HOLIDAYS[selectedDateStr]}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">ผู้ลงทะเบียนใช้งาน</h3>
            {events.filter(ev => ev.date === selectedDateStr).length === 0 ? (
              <p className="text-sm text-slate-400 italic py-2 flex items-center space-x-1">
                <span>ไม่มีผู้ลงทะเบียน</span>
                {(() => {
                  if (!selectedDateStr) return null;
                  const [y, m, d] = selectedDateStr.split('-').map(Number);
                  const dayVal = new Date(y, m - 1, d).getDay();
                  return dayVal > 0 && dayVal < 6 && !BANK_HOLIDAYS[selectedDateStr] ? (
                    <span className="text-amber-600 font-bold not-italic">(✨ วันทองคำ)</span>
                  ) : null;
                })()}
              </p>
            ) : (
              <div className="divide-y divide-slate-50">
                {events
                  .filter(ev => ev.date === selectedDateStr)
                  .map((ev) => (
                    <div key={ev.id} className="flex justify-between items-center py-2.5">
                      <div className="flex items-center space-x-3">
                        {ev.type === 'WFH' ? (
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                            <Briefcase className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                            <Plane className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-slate-700">{ev.name}</p>
                          <p className="text-[11px] text-slate-400 font-medium">
                            {ev.type === 'WFH' ? '💻 Work From Home' : '🌴 วันลาพักผ่อน'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteEvent(ev.id, ev.name, ev.type)}
                        disabled={submitting}
                        className="p-2 text-slate-300 hover:text-red-500 active:bg-red-50 rounded-xl transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="pt-2 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">บันทึกรายการใหม่</h3>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => { setFormType('WFH'); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                  formType === 'WFH'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Work From Home
              </button>
              <button
                type="button"
                onClick={() => { setFormType('Leave'); setIsRecurring(false); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl border transition ${
                  formType === 'Leave'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                }`}
              >
                วันลาพักผ่อน
              </button>
            </div>

            {formType === 'WFH' && (
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-100 p-2 rounded-xl transition">
                <input
                  type="checkbox"
                  id="recurring-wfh"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300 transition"
                />
                <label htmlFor="recurring-wfh" className="text-xs text-slate-600 font-semibold select-none cursor-pointer">
                  สมัคร WFH ทุกวัน{getDayNameText(selectedDateStr)} ของเดือน{monthNames[month]}นี้
                </label>
              </div>
            )}

            {formType === 'Leave' && (
              <div className="grid grid-cols-2 gap-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">วันเริ่มต้น</label>
                  <input 
                    type="date" 
                    value={leaveStartDate} 
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="w-full bg-white text-xs rounded-lg border border-slate-200 p-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">วันสิ้นสุด</label>
                  <input 
                    type="date" 
                    value={leaveEndDate} 
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="w-full bg-white text-xs rounded-lg border border-slate-200 p-1.5 text-slate-700 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-2.5 rounded-xl flex items-center space-x-2 text-xs font-semibold shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <div className="flex space-x-2">
              <div className="relative flex-1">
                <User className="absolute left-3.5 top-2.5 text-slate-400 w-4 h-4 z-10 pointer-events-none" />
                <select
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-slate-50 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-blue-500 text-slate-700 appearance-none relative z-0 cursor-pointer"
                >
                  <option value="">เลือกชื่อของคุณ...</option>
                  {TEAM_MEMBERS.map((member) => (
                    <option key={member.name} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-3 pointer-events-none w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-slate-400"></div>
              </div>
              <button
                type="button"
                onClick={handleAddEvent}
                disabled={submitting || loading}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 active:scale-95 transition disabled:opacity-50 flex items-center space-x-1"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>บันทึก</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}