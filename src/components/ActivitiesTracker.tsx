import React, { useState } from 'react';
import { Activity, Calendar, Plus, Trash2, Trophy, Users } from 'lucide-react';
import { ActivityRecord, AuthUser } from '../types';
import { getGradeLabel, GRADES, SECTIONS } from '../constants';

interface ActivitiesTrackerProps {
  activities: ActivityRecord[];
  currentUser: AuthUser;
  onAddActivity: (activity: ActivityRecord) => void;
  onUpdateActivityStatus: (id: string, status: ActivityRecord['status']) => void;
  onDeleteActivity: (id: string) => void;
}

const ACTIVITY_CATEGORIES = [
  'لياقة بدنية وجمباز',
  'ألعاب جماعية (كرة طائرة / سلة / يد)',
  'ألعاب قوى ومسابقات جري',
  'ألعاب حركية وترفيهية للصغار',
  'مبادرات صحية ورياضية مدرسية',
];

export const ActivitiesTracker: React.FC<ActivitiesTrackerProps> = ({
  activities,
  currentUser,
  onAddActivity,
  onUpdateActivityStatus,
  onDeleteActivity,
}) => {
  const canEdit = currentUser.permissions.includes('edit');
  const canDelete = currentUser.permissions.includes('delete');

  const todayStr = new Date().toISOString().split('T')[0];
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(ACTIVITY_CATEGORIES[0]);
  const [date, setDate] = useState(todayStr);
  const [grade, setGrade] = useState<number>(5);
  const [section, setSection] = useState<string>('1');
  const [participantsCount, setParticipantsCount] = useState<number>(22);
  const [status, setStatus] = useState<ActivityRecord['status']>('completed');
  const [description, setDescription] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !title.trim()) return;

    const newAct: ActivityRecord = {
      id: `act-${Date.now()}`,
      title: title.trim(),
      category,
      date,
      grade,
      section,
      description: description.trim() || 'نشاط رياضي تفاعلي لتعزيز اللياقة وروح الفريق.',
      participantsCount: Number(participantsCount) || 0,
      featuredStudentIds: [],
      status,
    };

    onAddActivity(newAct);
    setTitle('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 space-y-5 shadow-[0_2px_8px_rgba(74,46,27,0.04)]">
        <div className="flex items-center gap-3.5 border-b border-[#DFCDB6] pb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shrink-0 border border-[#382012] shadow-xs">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#4A2E1B]">متابعة التفاعل والأنشطة الرياضية</h2>
            <p className="text-xs text-[#7D6752] mt-0.5">
              توثيق الفعاليات الرياضية، المسابقات بين الفصول، ومهرجانات اللياقة البدنية (طاقة وانطلاقة)
            </p>
          </div>
        </div>

        {canEdit && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-sm font-black text-[#4A2E1B]">تسجيل نشاط رياضي جديد</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-[#5A402D] mb-1">
                  عنوان النشاط
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="عنوان المسابقة أو النشاط..."
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A402D] mb-1">تصنيف النشاط</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] focus:outline-hidden"
                >
                  {ACTIVITY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A402D] mb-1">التاريخ</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs text-[#2C1A11] tabular-nums focus:border-[#7C4E2E] focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A402D] mb-1">الصف</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] focus:outline-hidden"
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
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] focus:outline-hidden"
                >
                  {SECTIONS.map((s) => (
                    <option key={s} value={s}>
                      الشعبة {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A402D] mb-1">
                  المشاركات
                </label>
                <input
                  type="number"
                  min={1}
                  value={participantsCount}
                  onChange={(e) => setParticipantsCount(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs text-[#2C1A11] tabular-nums focus:border-[#7C4E2E] focus:outline-hidden"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-[#4A2E1B] hover:bg-[#382012] text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-4 h-4 text-[#D4A76A]" />
                  <span>إضافة النشاط</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activities.map((act) => (
          <div
            key={act.id}
            className="bg-white rounded-2xl border border-[#E8DDD0] p-5 flex flex-col justify-between space-y-4 shadow-[0_2px_8px_rgba(74,46,27,0.03)] hover:border-[#7C4E2E] transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#7D6752]">
                <span className="font-bold text-[#4A2E1B] bg-[#F7EFE4] px-2 py-0.5 rounded-md border border-[#DFCDB6]">
                  {act.category}
                </span>
                <span className="tabular-nums flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#8A5932]" />
                  {act.date}
                </span>
              </div>
              <h3 className="text-base font-black text-[#2C1A11] flex items-center gap-2">
                <Trophy className="w-4 h-4 text-[#8A5932] shrink-0" />
                <span>{act.title}</span>
              </h3>
              <p className="text-xs text-[#7D6752] leading-relaxed">{act.description}</p>
            </div>

            <div className="pt-3 border-t border-[#F5ECE0] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-extrabold text-[#4A2E1B]">
                {getGradeLabel(act.grade)} / شعبة {act.section}
              </span>
              <span className="flex items-center gap-1 tabular-nums font-bold text-[#7C4E2E]">
                <Users className="w-3.5 h-3.5" />
                {act.participantsCount} مشاركة
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
