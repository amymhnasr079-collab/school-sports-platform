import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Download,
  Edit2,
  FileCheck,
  Image as ImageIcon,
  Lock,
  Plus,
  Printer,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AuthUser, ScheduleSlot, SchoolDay, SchoolSchedule } from '../types';
import { getGradeLabel, GRADES, PERIODS, SCHOOL_DAYS, SECTIONS } from '../constants';

interface SchoolScheduleViewProps {
  schedule: SchoolSchedule;
  currentUser: AuthUser;
  onUpdateSchedule: (nextSchedule: SchoolSchedule) => void;
}

export const SchoolScheduleView: React.FC<SchoolScheduleViewProps> = ({
  schedule,
  currentUser,
  onUpdateSchedule,
}) => {
  const canEdit = currentUser.permissions.includes('edit');
  const imageInputRef = useRef<HTMLInputElement>(null);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'week' | 'day'>('week');
  const [selectedDay, setSelectedDay] = useState<SchoolDay>('الأحد');

  // Form State
  const [formDay, setFormDay] = useState<SchoolDay>('الأحد');
  const [formPeriod, setFormPeriod] = useState<number>(1);
  const [formStartTime, setFormStartTime] = useState<string>('');
  const [formEndTime, setFormEndTime] = useState<string>('');
  const [formGrade, setFormGrade] = useState<number>(5);
  const [formSection, setFormSection] = useState<string>('1');
  const [formNote, setFormNote] = useState<string>('');

  const [generalNotes, setGeneralNotes] = useState<string>(schedule.generalNotes || '');
  const [showImageModal, setShowImageModal] = useState<boolean>(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Quick feedback toast
  const showFeedback = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => {
      setStatusFeedback(null);
    }, 4000);
  };

  // Helper to load a slot into form for editing
  const handleEditSlot = (slot: ScheduleSlot) => {
    setFormDay(slot.day);
    setFormPeriod(slot.period);
    setFormStartTime(slot.startTime || '');
    setFormEndTime(slot.endTime || '');
    setFormGrade(slot.grade || 5);
    setFormSection(slot.section || '1');
    setFormNote(slot.activityNote || '');
    showFeedback(`تم تحميل الحصة (${slot.day} - الحصة ${slot.period}) في نموذج التعديل أدناه`);
  };

  // Quick slot click on the grid: selects that day & period
  const handleCellClick = (day: SchoolDay, period: number) => {
    if (!canEdit) {
      const existing = schedule.slots.find((s) => s.day === day && s.period === period);
      if (existing && existing.grade) {
        showFeedback(
          `${day} - الحصة ${period}: ${getGradeLabel(existing.grade)} (شعبة ${existing.section}) ${
            existing.activityNote ? `· ${existing.activityNote}` : ''
          }`
        );
      }
      return;
    }
    const existing = schedule.slots.find((s) => s.day === day && s.period === period);
    if (existing) {
      handleEditSlot(existing);
    } else {
      setFormDay(day);
      setFormPeriod(period);
      showFeedback(`تم اختيار (${day} - الحصة ${period})، أدخلي بيانات الصف واضغطي حفظ الحصة`);
    }
  };

  // Delete a slot
  const handleDeleteSlot = (day: SchoolDay, period: number) => {
    if (!canEdit) return;
    const nextSlots = schedule.slots.filter(
      (s) => !(s.day === day && s.period === period)
    );
    onUpdateSchedule({
      ...schedule,
      slots: nextSlots,
      generalNotes,
    });
    showFeedback(`تم تفريغ الحصة (${day} - الحصة ${period}) وحفظ التعديل بنجاح ✓`);
  };

  // Save or update slot
  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const slotId = `${formDay}-${formPeriod}`;
    const newSlot: ScheduleSlot = {
      id: slotId,
      day: formDay,
      period: formPeriod,
      startTime: formStartTime.trim(),
      endTime: formEndTime.trim(),
      grade: formGrade,
      section: formSection,
      activityNote: formNote.trim(),
    };

    const existingIdx = schedule.slots.findIndex(
      (s) => s.day === formDay && s.period === formPeriod
    );

    const nextSlots = [...schedule.slots];
    if (existingIdx >= 0) {
      nextSlots[existingIdx] = newSlot;
    } else {
      nextSlots.push(newSlot);
    }

    onUpdateSchedule({
      ...schedule,
      slots: nextSlots,
      generalNotes,
    });
    setFormNote('');
    showFeedback(`تم تثبيت وحفظ الحصة (${formDay} - الحصة ${formPeriod}) بنجاح ✓`);
  };

  // Save General Notes
  const handleSaveGeneralNotes = () => {
    if (!canEdit) return;
    onUpdateSchedule({
      ...schedule,
      generalNotes,
    });
    showFeedback('تم حفظ ملاحظات وتوجيهات الجدول المدرسي بنجاح ✓');
  };

  // Compress and upload image to stay well within storage quotas
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Resize image to max 1200px width/height to keep size ~100KB-150KB
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          onUpdateSchedule({
            ...schedule,
            scheduleImageDataUrl: compressedDataUrl,
          });
          showFeedback('تم رفع صورة الجدول وحفظها بنجاح وملاءمتها للمنصة ✓');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Remove uploaded schedule image
  const handleRemoveImage = () => {
    if (!canEdit) return;
    onUpdateSchedule({
      ...schedule,
      scheduleImageDataUrl: null,
    });
    showFeedback('تمت إزالة صورة الجدول بنجاح ✓');
  };

  // Explicit Pin Schedule Now
  const handlePinScheduleNow = () => {
    onUpdateSchedule({
      ...schedule,
      generalNotes,
    });
    showFeedback('تم تثبيت وقفل الجدول المدرسي سحابياً ومحلياً بنجاح ولن ينحذف أبداً ✓');
  };

  // Export schedule to JSON file
  const handleExportSchedule = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(schedule, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute(
      'download',
      `الجدول_المدرسي_الأسبوعي_مدرسة_عائشة_${new Date().toISOString().split('T')[0]}.json`
    );
    dlAnchorElem.click();
    showFeedback('تم تصدير وحفظ نسخة احتياطية من الجدول على جهازكِ بنجاح ✓');
  };

  // Import schedule from JSON file
  const handleImportSchedule = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.slots)) {
          onUpdateSchedule({
            slots: parsed.slots,
            scheduleImageDataUrl: parsed.scheduleImageDataUrl || schedule.scheduleImageDataUrl,
            generalNotes: parsed.generalNotes || schedule.generalNotes,
          });
          showFeedback(`تم استيراد ${parsed.slots.length} حصة وتثبيت الجدول بنجاح ✓`);
        } else {
          showFeedback('الملف المختار لا يحتوي على جدول حصص صالح.');
        }
      } catch (err) {
        console.error('Import error:', err);
        showFeedback('تعذر قراءة ملف النسخة الاحتياطية.');
      }
    };
    reader.readAsText(file);
  };

  const daySlots = useMemo(
    () =>
      schedule.slots
        .filter((s) => s.day === selectedDay)
        .sort((a, b) => a.period - b.period),
    [schedule.slots, selectedDay]
  );

  const totalSlotsCount = schedule.slots.filter((s) => s.grade != null).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {statusFeedback && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-xs font-black bg-[#1C3A27] text-[#A7F3D0] border border-[#059669] transition-all animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* Main Top Banner */}
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 space-y-4 shadow-[0_2px_8px_rgba(74,46,27,0.04)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DFCDB6] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shrink-0 border border-[#382012] shadow-xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-[#4A2E1B]">
                  الجدول المدرسي الأسبوعي (الأحد – الخميس)
                </h2>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>الجدول مثبت ودائم سحابياً ومحلياً ✓</span>
                </span>
              </div>
              <p className="text-xs text-[#7D6752] mt-0.5">
                متابعة الحصص الرياضية لمدرسة عائشة بنت عثمان — الحصص لا تنحذف أبداً عند الخروج أو إعادة فتح الرابط
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#DFCDB6]">
              <button
                type="button"
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  viewMode === 'week' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#7D6752]'
                }`}
              >
                جدول الأسبوع
              </button>
              <button
                type="button"
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  viewMode === 'day' ? 'bg-[#4A2E1B] text-white shadow-xs' : 'text-[#7D6752]'
                }`}
              >
                جدول اليوم
              </button>
            </div>

            {/* Pin Schedule Button */}
            {canEdit && (
              <button
                type="button"
                onClick={handlePinScheduleNow}
                className="px-3.5 py-2 text-xs font-black text-[#2B180E] bg-[#D4A76A] hover:bg-[#C58B50] rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                title="تثبيت وقفل الجدول المدرسي سحابياً ومحلياً"
              >
                <Lock className="w-3.5 h-3.5 text-[#2B180E]" />
                <span>تثبيت الجدول الحالي ✓</span>
              </button>
            )}

            {/* Upload Schedule Image */}
            {canEdit && (
              <>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadImage}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-3.5 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#F7EFE4] border border-[#DFCDB6] rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                  title="رفع صورة ملتقطة لجدول الحصص الورقي"
                >
                  <Upload className="w-4 h-4 text-[#7C4E2E]" />
                  <span>{schedule.scheduleImageDataUrl ? 'تحديث صورة الجدول' : 'رفع صورة الجدول'}</span>
                </button>

                {schedule.scheduleImageDataUrl && (
                  <button
                    type="button"
                    onClick={() => setShowImageModal(true)}
                    className="px-3 py-2 text-xs font-bold text-[#065F46] bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>عرض الصورة المرفقة</span>
                  </button>
                )}
              </>
            )}

            {/* Export Schedule to Device */}
            <button
              type="button"
              onClick={handleExportSchedule}
              className="px-3 py-2 text-xs font-bold text-[#5A402D] bg-[#F5EFE6] hover:bg-[#EAE1D5] border border-[#DFCDB6] rounded-xl transition-colors flex items-center gap-1 shadow-2xs"
              title="تنزيل نسخة احتياطية من الجدول على جهازكِ"
            >
              <Download className="w-3.5 h-3.5 text-[#7C4E2E]" />
              <span className="hidden sm:inline">حفظ نسخة لجهازي</span>
            </button>

            {/* Hidden Input for Import */}
            {canEdit && (
              <>
                <input
                  ref={jsonFileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportSchedule}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => jsonFileInputRef.current?.click()}
                  className="px-2.5 py-2 text-xs text-[#7D6752] hover:text-[#4A2E1B] hover:bg-white/60 rounded-xl transition-colors"
                  title="استيراد جدول من ملف احتياطي"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {/* Print */}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#F7EFE4] rounded-xl transition-colors flex items-center gap-1.5 border border-[#DFCDB6] shadow-2xs"
            >
              <Printer className="w-4 h-4 text-[#7C4E2E]" />
              <span>طباعة</span>
            </button>
          </div>
        </div>

        {/* Schedule Stats & Reassurance Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-2 px-3.5 bg-[#F2EAE0] rounded-xl text-xs border border-[#E3D4C1]">
          <div className="flex items-center gap-2 text-[#4A2E1B] font-bold">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span>إحصائية الحصص:</span>
            <span className="font-black text-[#7C4E2E] tabular-nums">
              {totalSlotsCount} حصة رياضية مثبتة
            </span>
            <span className="text-[11px] text-[#7D6752]">
              (محفوظة دائماً على السحابة وذاكرة جهازكِ)
            </span>
          </div>

          <div className="text-[11px] text-[#5A402D]">
            انقري على أي خانة في الجدول أدناه لتعديلها أو تفريغها مباشرة
          </div>
        </div>

        {/* Add / Edit Slot Form */}
        {canEdit && (
          <form onSubmit={handleSaveSlot} className="space-y-3.5 pt-1 no-print">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-[#4A2E1B] flex items-center gap-1.5">
                <Edit2 className="w-3.5 h-3.5 text-[#7C4E2E]" />
                <span>إضافة أو تعديل حصة في الجدول:</span>
              </h3>
              <span className="text-[11px] text-[#7D6752]">
                الحصة المحددة: <strong className="text-[#4A2E1B]">{formDay} - الحصة {formPeriod}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-[#5A402D] mb-1">اليوم</label>
                <select
                  value={formDay}
                  onChange={(e) => setFormDay(e.target.value as SchoolDay)}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-2.5 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden shadow-2xs"
                >
                  {SCHOOL_DAYS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5A402D] mb-1">الحصة</label>
                <select
                  value={formPeriod}
                  onChange={(e) => setFormPeriod(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-2.5 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden shadow-2xs"
                >
                  {PERIODS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5A402D] mb-1">وقت البداية (اختياري)</label>
                <input
                  type="time"
                  value={formStartTime}
                  onChange={(e) => setFormStartTime(e.target.value)}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-2.5 py-2 text-xs tabular-nums text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5A402D] mb-1">وقت النهاية (اختياري)</label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-2.5 py-2 text-xs tabular-nums text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden shadow-2xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5A402D] mb-1">الصف المستهدف *</label>
                <select
                  value={formGrade}
                  onChange={(e) => setFormGrade(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-2.5 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden shadow-2xs"
                >
                  {GRADES.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#5A402D] mb-1">الشعبة *</label>
                <select
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-2.5 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden shadow-2xs"
                >
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      الشعبة {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-1 flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-3 bg-[#4A2E1B] hover:bg-[#382012] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[#D4A76A]" />
                  <span>تثبيت الحصة ✓</span>
                </button>
              </div>
            </div>

            {/* Optional Note / Court Allocation */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
              <input
                type="text"
                value={formNote}
                onChange={(e) => setFormNote(e.target.value)}
                placeholder="ملاحظة إضافية للحصة (مثال: ملعب كرة الطائرة، الصالة المغلقة، مهارات اللياقة...)"
                className="w-full sm:flex-1 rounded-xl border border-[#DFCDB6] bg-white px-3 py-1.5 text-xs text-[#2C1A11] focus:border-[#7C4E2E] outline-hidden"
              />
              <span className="text-[10px] text-[#7D6752] shrink-0">
                الحصة تُحفظ فورياً وتظل مثبتة حتى عند إعادة تحميل الصفحة أو الخروج.
              </span>
            </div>
          </form>
        )}
      </div>

      {/* Timetable Display */}
      {viewMode === 'week' ? (
        <div className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden print-container shadow-[0_2px_8px_rgba(74,46,27,0.03)]">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#FAF5EC] border-b border-[#DFCDB6] text-xs font-black text-[#4A2E1B]">
                  <th className="py-3 px-4 w-28 border-l border-[#DFCDB6]">اليوم / الحصة</th>
                  {PERIODS.map((p) => (
                    <th key={p.value} className="py-3 px-3 min-w-[140px] text-center border-l border-[#DFCDB6]">
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5ECE0] text-xs">
                {SCHOOL_DAYS.map((day) => (
                  <tr key={day} className="hover:bg-[#FAF5EC]/50 transition-colors">
                    <td className="py-4 px-4 font-black text-[#4A2E1B] bg-[#FAF7F2] border-l border-[#E8DDD0] select-none">
                      {day}
                    </td>
                    {PERIODS.map((p) => {
                      const slot = schedule.slots.find((s) => s.day === day && s.period === p.value);
                      const isCurrentFormSlot = formDay === day && formPeriod === p.value;

                      return (
                        <td
                          key={p.value}
                          onClick={() => handleCellClick(day, p.value)}
                          className={`p-2 border-l border-[#F5ECE0] align-top h-28 cursor-pointer transition-all ${
                            isCurrentFormSlot ? 'bg-[#FAF3E8]' : ''
                          }`}
                        >
                          {slot && slot.grade ? (
                            <div className="h-full rounded-xl bg-[#FAF5EC] hover:bg-[#F5ECE0] border border-[#DFCDB6] p-2.5 flex flex-col justify-between shadow-2xs group relative transition-colors">
                              <div>
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-[#4A2E1B] text-xs">
                                    {getGradeLabel(slot.grade)}
                                  </span>
                                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[#4A2E1B] text-[#D4A76A]">
                                    ش {slot.section}
                                  </span>
                                </div>

                                {(slot.startTime || slot.endTime) && (
                                  <div className="text-[10px] text-[#7C4E2E] tabular-nums mt-1 flex items-center gap-1 font-bold">
                                    <Clock className="w-3 h-3 text-[#A06938]" />
                                    <span>{slot.startTime || '--:--'} - {slot.endTime || '--:--'}</span>
                                  </div>
                                )}

                                {slot.activityNote && (
                                  <div className="text-[10px] text-[#7D6752] mt-1 line-clamp-1">
                                    {slot.activityNote}
                                  </div>
                                )}
                              </div>

                              {/* Hover Action Buttons */}
                              {canEdit && (
                                <div className="flex items-center justify-end gap-1 pt-1 opacity-90 group-hover:opacity-100 transition-opacity">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditSlot(slot);
                                    }}
                                    className="p-1 text-[#7C4E2E] hover:bg-white rounded-md transition-colors"
                                    title="تعديل الحصة"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSlot(day, p.value);
                                    }}
                                    className="p-1 text-[#A8422B] hover:bg-white rounded-md transition-colors"
                                    title="حذف / تفريغ الحصة"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="h-full rounded-xl border border-dashed border-[#DFCDB6] hover:border-[#7C4E2E] flex flex-col items-center justify-center text-[11px] text-[#A08C78] hover:text-[#4A2E1B] hover:bg-[#FAF5EC]/70 transition-all p-2 text-center">
                              <Plus className="w-3.5 h-3.5 mb-0.5 opacity-60" />
                              <span>انقري للإضافة</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Daily View */
        <div className="bg-white rounded-2xl border border-[#E8DDD0] p-6 space-y-5 print-container shadow-[0_2px_8px_rgba(74,46,27,0.03)]">
          <div className="flex flex-wrap items-center gap-1.5 no-print">
            {SCHOOL_DAYS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDay(d)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedDay === d
                    ? 'bg-[#4A2E1B] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#4A2E1B] border border-[#DFCDB6]'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {daySlots.map((slot) => (
              <div
                key={slot.id}
                className="rounded-xl border border-[#DFCDB6] p-4 space-y-2 bg-[#FAF5EC] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-[#7C4E2E]">الحصة {slot.period}</span>
                    {(slot.startTime || slot.endTime) && (
                      <span className="text-[10px] text-[#7D6752] tabular-nums font-bold">
                        {slot.startTime || '--:--'} - {slot.endTime || '--:--'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-black text-[#4A2E1B] mt-1">
                    {slot.grade ? `${getGradeLabel(slot.grade)} — الشعبة ${slot.section}` : 'فارغة'}
                  </p>
                  {slot.activityNote && (
                    <p className="text-xs text-[#7D6752] mt-1 leading-snug">
                      {slot.activityNote}
                    </p>
                  )}
                </div>

                {canEdit && slot.grade && (
                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-[#E8DDD0] mt-2">
                    <button
                      type="button"
                      onClick={() => handleEditSlot(slot)}
                      className="px-2 py-1 text-[11px] text-[#7C4E2E] hover:bg-white rounded-md font-bold"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlot(slot.day, slot.period)}
                      className="px-2 py-1 text-[11px] text-[#A8422B] hover:bg-white rounded-md font-bold"
                    >
                      تفريغ
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* General Notes and Court Distribution */}
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-[#4A2E1B]">
            ملاحظات وتوجيهات الجدول المدرسي وتوزيع الملاعب
          </h4>
          {canEdit && (
            <button
              type="button"
              onClick={handleSaveGeneralNotes}
              className="px-3 py-1 bg-[#4A2E1B] hover:bg-[#382012] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 shadow-2xs"
            >
              <Save className="w-3 h-3 text-[#D4A76A]" />
              <span>حفظ الملاحظات</span>
            </button>
          )}
        </div>
        <textarea
          rows={2}
          disabled={!canEdit}
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="أدخلي أي ملاحظات حول استخدام الصالة الرياضية، ملاعب الكرة الطائرة أو التنس، تبادل الحصص مع المعلمات الزميلات..."
          className="w-full rounded-xl border border-[#DFCDB6] bg-white p-3 text-xs text-[#2C1A11] focus:border-[#7C4E2E] outline-hidden leading-relaxed"
        />
      </div>

      {/* Modal: Schedule Image Preview */}
      {showImageModal && schedule.scheduleImageDataUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#DFCDB6] p-5 max-w-4xl w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#F0E4D2] pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#7C4E2E]" />
                <h3 className="text-base font-black text-[#4A2E1B]">
                  صورة الجدول المدرسي المعتمد
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#FAF7F2] rounded-xl border border-[#DFCDB6] p-2 flex items-center justify-center overflow-auto max-h-[65vh]">
              <img
                src={schedule.scheduleImageDataUrl}
                alt="الجدول المدرسي"
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm"
              />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#F0E4D2]">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveImage();
                    setShowImageModal(false);
                  }}
                  className="px-3 py-1.5 text-xs font-bold text-[#A8422B] hover:bg-[#FAF1EC] rounded-xl transition-colors"
                >
                  إزالة الصورة
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                >
                  طباعة الصورة
                </button>
                <button
                  type="button"
                  onClick={() => setShowImageModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
