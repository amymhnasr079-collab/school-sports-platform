import React, { useState } from 'react';
import {
  Award,
  Download,
  Edit3,
  Plus,
  Printer,
  Sparkles,
} from 'lucide-react';
import {
  AuthUser,
  AwardedSticker,
  MotivationalSticker,
  Student,
} from '../types';
import { getGradeLabel, GRADES, SECTIONS, THEME_COLORS } from '../constants';
import { StickerBadgeIllustration } from './SportIllustrations';

interface StickersLibraryProps {
  stickers: MotivationalSticker[];
  awardedStickers: AwardedSticker[];
  students: Student[];
  currentUser: AuthUser;
  schoolName: string;
  teacherName: string;
  onSaveStickers: (nextStickers: MotivationalSticker[]) => void;
  onAwardSticker: (award: AwardedSticker) => void;
  onDeleteAward: (awardId: string) => void;
}

export const StickersLibrary: React.FC<StickersLibraryProps> = ({
  stickers,
  awardedStickers,
  students,
  currentUser,
  schoolName,
  teacherName,
  onSaveStickers,
  onAwardSticker,
  onDeleteAward: _onDeleteAward,
}) => {
  const canEdit = currentUser.permissions.includes('edit');
  const [selectedStickerId, setSelectedStickerId] = useState<string>(
    stickers[0]?.id || 'stk-1'
  );
  const [awardGrade, setAwardGrade] = useState<number>(5);
  const [awardSection, setAwardSection] = useState<string>('1');
  const [awardStudentName, setAwardStudentName] = useState<string>('');

  const selectedSticker =
    stickers.find((s) => s.id === selectedStickerId) || stickers[0];

  const classStudents = students.filter(
    (s) => s.grade === awardGrade && s.section === awardSection
  );

  const handleAwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !selectedSticker) return;
    const targetName = awardStudentName.trim() || 'طالبة متميزة';

    const award: AwardedSticker = {
      id: `awd-${Date.now()}`,
      stickerId: selectedSticker.id,
      studentId: '',
      studentName: targetName,
      grade: awardGrade,
      section: awardSection,
      customPhrase: selectedSticker.phrase,
      date: new Date().toISOString().split('T')[0],
      awardedBy: currentUser.name,
    };

    onAwardSticker(award);
    setAwardStudentName('');
  };

  const handleDownloadStickerPng = (sticker: MotivationalSticker) => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 520;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const palette = THEME_COLORS[sticker.colorTheme];
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = palette.hexPrimary;
    ctx.lineWidth = 14;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 24px Cairo, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('منصة الرياضة المدرسية التفاعلية (طاقة وانطلاقة) — مدرسة عائشة بنت عثمان (1–12)', 400, 80);

    ctx.fillStyle = palette.hexPrimary;
    ctx.font = 'extrabold 38px Cairo, sans-serif';
    ctx.fillText(sticker.title, 400, 260);

    ctx.fillStyle = '#4A2E1B';
    ctx.font = 'bold 22px Tajawal, sans-serif';
    ctx.fillText(`«${sticker.phrase}»`, 400, 350, 680);

    const link = document.createElement('a');
    link.download = `ملصق_${sticker.title}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_2px_8px_rgba(74,46,27,0.04)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shrink-0 border border-[#382012] shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#4A2E1B]">
              مكتبة الملصقات والأوسمة التحفيزية الرياضية
            </h2>
            <p className="text-xs text-[#7D6752] mt-0.5">
              منح أوسمة التميز وبطاقات التكريم لطالبات مدرسة عائشة بنت عثمان (طاقة وانطلاقة)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-4 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#F7EFE4] rounded-xl transition-colors flex items-center gap-1.5 border border-[#DFCDB6] shadow-2xs"
        >
          <Printer className="w-4 h-4 text-[#7C4E2E]" />
          <span>طباعة البطاقات</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-container">
        {stickers.map((stk) => {
          const theme = THEME_COLORS[stk.colorTheme] || THEME_COLORS.orange;
          const isSelected = stk.id === selectedStickerId;

          return (
            <div
              key={stk.id}
              onClick={() => setSelectedStickerId(stk.id)}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between cursor-pointer bg-white shadow-[0_2px_8px_rgba(74,46,27,0.03)] ${
                isSelected ? 'border-[#7C4E2E] ring-2 ring-[#7C4E2E]/20' : 'border-[#E8DDD0] hover:border-[#7C4E2E]/50'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <StickerBadgeIllustration
                  iconType={stk.iconType}
                  colorHex={theme.hexPrimary}
                  className="w-20 h-20"
                />
                <h3 className="text-lg font-black text-[#4A2E1B]">{stk.title}</h3>
                <p className="text-xs text-[#7D6752] leading-relaxed">«{stk.phrase}»</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F5ECE0] flex items-center justify-between no-print">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadStickerPng(stk);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-[#FAF5EC] hover:bg-[#F0E4D2] text-[#4A2E1B] text-xs font-bold flex items-center gap-1 border border-[#DFCDB6] transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#7C4E2E]" />
                  <span>حفظ صورة</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {canEdit && (
        <form
          onSubmit={handleAwardSubmit}
          className="bg-white rounded-2xl border border-[#E8DDD0] p-5 sm:p-6 space-y-4 no-print shadow-[0_2px_8px_rgba(74,46,27,0.03)]"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#8A5932]" />
            <h3 className="text-base font-black text-[#4A2E1B]">
              منح وسام ({selectedSticker?.title}) لطالبة
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#5A402D] mb-1">الصف</label>
              <select
                value={awardGrade}
                onChange={(e) => setAwardGrade(Number(e.target.value))}
                className="w-full rounded-xl border border-[#DFCDB6] bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden"
              >
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5A402D] mb-1">الشعبة</label>
              <select
                value={awardSection}
                onChange={(e) => setAwardSection(e.target.value)}
                className="w-full rounded-xl border border-[#DFCDB6] bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    الشعبة {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#5A402D] mb-1">اسم الطالبة</label>
              <input
                type="text"
                required
                value={awardStudentName}
                onChange={(e) => setAwardStudentName(e.target.value)}
                placeholder="اسم الطالبة..."
                className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs text-[#2C1A11] focus:border-[#7C4E2E] outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <Award className="w-4 h-4 text-[#D4A76A]" />
            <span>منح الوسام</span>
          </button>
        </form>
      )}
    </div>
  );
};
