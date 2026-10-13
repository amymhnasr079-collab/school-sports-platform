import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  History,
  Printer,
  Save,
  Search,
  Trash2,
  Users,
  Dices,
} from 'lucide-react';
import {
  AuthUser,
  ParticipationLevel,
  ParticipationLog,
  ParticipationStudentRecord,
  Student,
} from '../types';
import {
  getGradeLabel,
  GRADES,
  PARTICIPATION_CRITERIA,
  PARTICIPATION_LEVELS,
  PERIODS,
  SECTIONS,
} from '../constants';

interface ParticipationTrackerProps {
  students: Student[];
  participationLogs: ParticipationLog[];
  currentUser: AuthUser;
  onSaveParticipationLog: (log: ParticipationLog) => void;
  onDeleteParticipationLog: (logId: string) => void;
  onNavigateToStudents: () => void;
  onNavigateToTools?: () => void;
}

const DEFAULT_STUDENT_PARTICIPATION: ParticipationStudentRecord = {
  positiveParticipation: 'excellent',
  answeringQuestions: 'excellent',
  sportsSkills: 'excellent',
  teamwork: 'excellent',
  safetyCompliance: 'excellent',
  gamesInteraction: 'excellent',
  initiativeLeadership: 'very_good',
  note: '',
};

export const ParticipationTracker: React.FC<ParticipationTrackerProps> = ({
  students,
  participationLogs,
  currentUser,
  onSaveParticipationLog,
  onDeleteParticipationLog,
  onNavigateToStudents,
  onNavigateToTools,
}) => {
  const canEdit = currentUser.permissions.includes('edit');
  const canDelete = currentUser.permissions.includes('delete');

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedGrade, setSelectedGrade] = useState<number>(5);
  const [selectedSection, setSelectedSection] = useState<string>('1');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [records, setRecords] = useState<Record<string, ParticipationStudentRecord>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  const classStudents = useMemo(
    () =>
      students.filter(
        (s) => s.grade === selectedGrade && s.section === selectedSection
      ),
    [students, selectedGrade, selectedSection]
  );

  const existingLog = useMemo(
    () =>
      participationLogs.find(
        (l) =>
          l.date === selectedDate &&
          l.grade === selectedGrade &&
          l.section === selectedSection &&
          l.period === selectedPeriod
      ),
    [participationLogs, selectedDate, selectedGrade, selectedSection, selectedPeriod]
  );

  useEffect(() => {
    if (existingLog) {
      setRecords(existingLog.records);
    } else {
      const initial: Record<string, ParticipationStudentRecord> = {};
      for (const st of classStudents) {
        initial[st.id] = { ...DEFAULT_STUDENT_PARTICIPATION };
      }
      setRecords(initial);
    }
  }, [existingLog, classStudents]);

  const filteredClassStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.trim().toLowerCase();
    return classStudents.filter((s) => s.name.toLowerCase().includes(q));
  }, [classStudents, searchQuery]);

  const handleCriterionChange = (
    studentId: string,
    criterionKey: keyof Omit<ParticipationStudentRecord, 'note'>,
    level: ParticipationLevel
  ) => {
    if (!canEdit) return;
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || DEFAULT_STUDENT_PARTICIPATION),
        [criterionKey]: level,
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    if (!canEdit) return;
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || DEFAULT_STUDENT_PARTICIPATION),
        note,
      },
    }));
  };

  const handleSave = () => {
    if (!canEdit) return;
    const logId =
      existingLog?.id ||
      `part-${selectedDate}-G${selectedGrade}-S${selectedSection}-P${selectedPeriod}`;

    const fullRecords: Record<string, ParticipationStudentRecord> = {};
    for (const st of classStudents) {
      fullRecords[st.id] = records[st.id] || { ...DEFAULT_STUDENT_PARTICIPATION };
    }

    const newLog: ParticipationLog = {
      id: logId,
      date: selectedDate,
      grade: selectedGrade,
      section: selectedSection,
      period: selectedPeriod,
      records: fullRecords,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };

    onSaveParticipationLog(newLog);
    setFeedbackBanner(
      `تم حفظ تقييم المشاركة الصفية ليوم ${selectedDate} بنجاح.`
    );
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 space-y-5 shadow-[0_2px_8px_rgba(74,46,27,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DFCDB6] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shrink-0 border border-[#382012] shadow-xs">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#4A2E1B]">سجل متابعة المشاركة الصفية والمهارات</h2>
              <p className="text-xs text-[#7D6752] mt-0.5">
                تقييم للمشاركة، المهارات الرياضية، العمل الجماعي، السلامة، والقيادة بمستويات التقدير الأربعة
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            {onNavigateToTools && (
              <button
                type="button"
                onClick={onNavigateToTools}
                className="px-3.5 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#F7EFE4] rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap border border-[#DFCDB6] shadow-2xs"
                title="فتح العجلة الدوارة لاختيار طالبة أو تشغيل المؤقت للحصة"
              >
                <Dices className="w-4 h-4 text-[#C58B50]" />
                <span>القرعة والمؤقت 🎡⏱️</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#F7EFE4] rounded-xl transition-colors flex items-center gap-1.5 whitespace-nowrap border border-[#DFCDB6] shadow-2xs"
            >
              <Printer className="w-4 h-4 text-[#7C4E2E]" />
              <span>طباعة التقييم</span>
            </button>
            {canEdit && classStudents.length > 0 && (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold text-white bg-[#4A2E1B] hover:bg-[#382012] rounded-xl transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Save className="w-4 h-4 text-[#D4A76A]" />
                <span>{existingLog ? 'حفظ التعديلات' : 'حفظ التقييم'}</span>
              </button>
            )}

            {!canEdit && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-xs font-bold whitespace-nowrap">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>تقييم المهارات معتمد (عرض واطلاع فقط)</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#5A402D] mb-1.5">التاريخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] focus:outline-hidden tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A402D] mb-1.5">الصف الدراسي</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(Number(e.target.value))}
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
            <label className="block text-xs font-bold text-[#5A402D] mb-1.5">الشعبة</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] focus:outline-hidden"
            >
              {SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  الشعبة {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A402D] mb-1.5">الحصة الدراسية</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] focus:outline-hidden"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A402D] mb-1.5">بحث باسم الطالبة</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7D6752] absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحثي عن طالبة..."
                className="w-full rounded-xl border border-[#DFCDB6] bg-white pr-8.5 pl-3 py-2 text-xs text-[#4A2E1B] focus:border-[#7C4E2E] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {feedbackBanner && (
          <div className="p-3.5 rounded-xl bg-white border border-[#DFCDB6] text-[#7C4E2E] text-xs font-bold flex items-center justify-between">
            <span>{feedbackBanner}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-[#7C4E2E] hover:underline"
            >
              إغلاق
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden print-container shadow-[0_2px_8px_rgba(74,46,27,0.03)]">
        {classStudents.length === 0 ? (
          <div className="p-10 text-center space-y-3 bg-[#FAF7F2]">
            <Users className="w-10 h-10 text-[#B8A793] mx-auto" />
            <h3 className="text-sm font-bold text-[#4A2E1B]">
              لا توجد طالبات مسجلات في {getGradeLabel(selectedGrade)} — الشعبة {selectedSection}
            </h3>
            {students.length > 0 && (
              <p className="text-xs text-[#7C4E2E] font-bold bg-[#FAF5EC] py-1.5 px-3 rounded-lg border border-[#DFCDB6] inline-block">
                ملاحظة: لديكِ {students.length} طالبة مسجلة ومثبتة في صفوف أخرى! يمكنكِ اختيار الصف من القائمة المنسدلة أعلاه.
              </p>
            )}
            <div>
              <button
                type="button"
                onClick={onNavigateToStudents}
                className="px-4 py-2 text-xs font-bold bg-[#4A2E1B] text-white rounded-xl hover:bg-[#382012] transition-colors shadow-xs"
              >
                الانتقال إلى إدارة الطالبات
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-[#FAF5EC] border-b border-[#DFCDB6] text-xs font-bold text-[#4A2E1B]">
                  <th className="py-3.5 px-3 w-10 text-center">#</th>
                  <th className="py-3.5 px-3 min-w-[180px]">اسم الطالبة</th>
                  {PARTICIPATION_CRITERIA.map((crit) => (
                    <th key={crit.key} className="py-3.5 px-2.5 min-w-[140px]">
                      {crit.label}
                    </th>
                  ))}
                  <th className="py-3.5 px-3 min-w-[200px]">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5ECE0] text-xs">
                {filteredClassStudents.map((student, idx) => {
                  const rec = records[student.id] || DEFAULT_STUDENT_PARTICIPATION;
                  return (
                    <tr key={student.id} className="hover:bg-[#FAF5EC]/70 transition-colors">
                      <td className="py-3 px-3 text-center font-bold text-[#7D6752] tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-3 px-3 font-extrabold text-sm text-[#2C1A11]">
                        {student.name}
                      </td>
                      {PARTICIPATION_CRITERIA.map((crit) => {
                        const val = rec[crit.key];
                        return (
                          <td key={crit.key} className="py-3 px-2.5">
                            <select
                              disabled={!canEdit}
                              value={val}
                              onChange={(e) =>
                                handleCriterionChange(
                                  student.id,
                                  crit.key,
                                  e.target.value as ParticipationLevel
                                )
                              }
                              className="w-full rounded-lg border border-[#DFCDB6] bg-[#FAF7F2] px-2 py-1.5 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E]"
                            >
                              {PARTICIPATION_LEVELS.map((lvl) => (
                                <option key={lvl.value} value={lvl.value}>
                                  {lvl.label}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      })}
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={rec.note}
                          onChange={(e) => handleNoteChange(student.id, e.target.value)}
                          placeholder="ملاحظة..."
                          className="w-full rounded-lg border border-[#DFCDB6] bg-white px-2.5 py-1.5 text-xs text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
