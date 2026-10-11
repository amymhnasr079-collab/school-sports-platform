import React, { useMemo, useState } from 'react';
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  FileCheck,
  History,
  Info,
  Printer,
  Save,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import {
  AuthUser,
  Student,
  UniformLog,
  UniformStudentRecord,
} from '../types';
import {
  calculateUniformCompliance,
  getGradeLabel,
  GRADES,
  PERIODS,
  SECTIONS,
} from '../constants';

interface UniformTrackerProps {
  students: Student[];
  uniformLogs: UniformLog[];
  currentUser: AuthUser;
  onSaveUniformLog: (log: UniformLog) => void;
  onDeleteUniformLog: (logId: string) => void;
  onNavigateToStudents: () => void;
}

export const UniformTracker: React.FC<UniformTrackerProps> = ({
  students,
  uniformLogs,
  currentUser,
  onSaveUniformLog,
  onDeleteUniformLog,
  onNavigateToStudents,
}) => {
  const canEdit = currentUser.permissions.includes('edit');
  const canDelete = currentUser.permissions.includes('delete');

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedGrade, setSelectedGrade] = useState<number>(5);
  const [selectedSection, setSelectedSection] = useState<string>('1');
  const [selectedPeriod, setSelectedPeriod] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [records, setRecords] = useState<Record<string, UniformStudentRecord>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<string | null>(null);

  // Filter students for the currently chosen class
  const classStudents = useMemo(
    () =>
      students.filter(
        (s) => s.grade === selectedGrade && s.section === selectedSection
      ),
    [students, selectedGrade, selectedSection]
  );

  // Existing log for this date and period
  const existingLog = useMemo(
    () =>
      uniformLogs.find(
        (l) =>
          l.date === selectedDate &&
          l.grade === selectedGrade &&
          l.section === selectedSection &&
          l.period === selectedPeriod
      ),
    [uniformLogs, selectedDate, selectedGrade, selectedSection, selectedPeriod]
  );

  // Initialize records when class or log changes
  React.useEffect(() => {
    if (existingLog) {
      setRecords(existingLog.records);
    } else {
      const initial: Record<string, UniformStudentRecord> = {};
      for (const st of classStudents) {
        initial[st.id] = { status: 'full', note: '' };
      }
      setRecords(initial);
    }
  }, [existingLog, classStudents]);

  const filteredClassStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.trim().toLowerCase();
    return classStudents.filter((s) => s.name.toLowerCase().includes(q));
  }, [classStudents, searchQuery]);

  const setStudentStatus = (
    studentId: string,
    status: 'full' | 'none' | 'partial' | 'absent' | 'excused'
  ) => {
    if (!canEdit) return;
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        status,
        note: prev[studentId]?.note || '',
      },
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    if (!canEdit) return;
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        status: prev[studentId]?.status || 'full',
        note,
      },
    }));
  };

  const handleSetAll = (status: 'full' | 'none') => {
    if (!canEdit) return;
    const next: Record<string, UniformStudentRecord> = { ...records };
    for (const st of classStudents) {
      next[st.id] = {
        status,
        note: next[st.id]?.note || '',
      };
    }
    setRecords(next);
  };

  const handleSaveSurvey = () => {
    if (!canEdit) return;
    const logId =
      existingLog?.id ||
      `uni-${selectedDate}-G${selectedGrade}-S${selectedSection}-P${selectedPeriod}`;

    const fullRecords: Record<string, UniformStudentRecord> = {};
    for (const st of classStudents) {
      fullRecords[st.id] = records[st.id] || { status: 'full', note: '' };
    }

    const newLog: UniformLog = {
      id: logId,
      date: selectedDate,
      grade: selectedGrade,
      section: selectedSection,
      period: selectedPeriod,
      records: fullRecords,
      updatedAt: new Date().toISOString(),
      updatedBy: currentUser.name,
    };

    onSaveUniformLog(newLog);
    setFeedbackBanner(
      `✓ تم حفظ استمارة متابعة الزي الرياضي ليوم ${selectedDate} (${getGradeLabel(selectedGrade)} / شعبة ${selectedSection}) بنجاح في السجل اليومي الدائم!`
    );
    setTimeout(() => setFeedbackBanner(null), 5000);
  };

  // Live compliance preview
  const currentStats = useMemo(() => {
    const tempLog: UniformLog = {
      id: 'preview',
      date: selectedDate,
      grade: selectedGrade,
      section: selectedSection,
      period: selectedPeriod,
      records,
      updatedAt: '',
      updatedBy: '',
    };
    return calculateUniformCompliance([tempLog]);
  }, [records, selectedDate, selectedGrade, selectedSection, selectedPeriod]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Survey Header in Warm Brown & Soft Beige Palette */}
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 shadow-[0_2px_8px_rgba(74,46,27,0.04)] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DFCDB6] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#7C4E2E] flex items-center justify-center shrink-0 border border-[#DFCDB6]">
              <FileCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#4A2E1B]">
                استمارة متابعة الزي الرياضي اليومية
              </h2>
              <p className="text-xs text-[#7D6752] mt-0.5">
                استبانة رصد سريعة ومباشرة (ملتزمة بالزي الرياضي / غير ملتزمة) مع حفظ يومي مستقل لكل صف
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-bold text-[#6D533D] bg-[#F7EFE4] hover:bg-[#EFE4D3] rounded-xl transition-colors flex items-center gap-1.5 border border-[#DFCDB6]"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الاستمارة</span>
            </button>

            {canEdit && classStudents.length > 0 && (
              <button
                type="button"
                onClick={handleSaveSurvey}
                className="px-5 py-2 text-xs font-bold text-white bg-[#4A2E1B] hover:bg-[#382012] rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-[#D4A76A]" />
                <span>حفظ الاستمارة اليومية للصف</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters: Grade, Section, Date, Period */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div>
            <label className="block text-xs font-bold text-[#5A402D] mb-1.5">
              تاريخ الحصة
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#4A2E1B] focus:outline-hidden tabular-nums shadow-2xs"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A402D] mb-1.5">الصف</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(Number(e.target.value))}
              className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#4A2E1B] focus:outline-hidden shadow-2xs"
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
              className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#4A2E1B] focus:outline-hidden shadow-2xs"
            >
              {SECTIONS.map((sec) => (
                <option key={sec} value={sec}>
                  الشعبة {sec}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A402D] mb-1.5">الحصة</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(Number(e.target.value))}
              className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#4A2E1B] focus:outline-hidden shadow-2xs"
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#5A402D] mb-1.5">
              بحث باسم الطالبة
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#7D6752] absolute right-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحثي عن طالبة..."
                className="w-full rounded-xl border border-[#DFCDB6] bg-white pr-8.5 pl-3 py-2 text-xs text-[#4A2E1B] focus:border-[#4A2E1B] focus:outline-hidden shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* Quick Batch Select & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DFCDB6] text-xs">
          <div className="flex items-center gap-2 text-[#7D6752]">
            <span className="font-bold text-[#4A2E1B]">
              {getGradeLabel(selectedGrade)} — الشعبة {selectedSection}
            </span>
            <span aria-hidden="true">·</span>
            <span>طالبات الشعبة: {classStudents.length}</span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#7C4E2E]">
              {existingLog ? '✓ استمارة محفوظة مسبقًا' : 'استمارة جديدة اليوم'}
            </span>
          </div>

          {canEdit && classStudents.length > 0 && (
            <div className="flex items-center gap-2 no-print">
              <span className="text-[#5A402D] text-[11px]">تحديد سريع لكامل الصف:</span>
              <button
                type="button"
                onClick={() => handleSetAll('full')}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#F7EFE4] text-[#6E421B] font-bold text-[11px] transition-colors flex items-center gap-1 border border-[#DFCDB6]"
              >
                <Check className="w-3 h-3" />
                <span>الجميع ملتزمات بالزي</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetAll('none')}
                className="px-2.5 py-1 rounded-lg bg-[#FDF3F0] hover:bg-[#FCE6E1] text-[#9A381E] font-bold text-[11px] transition-colors flex items-center gap-1 border border-[#F8CEC4]"
              >
                <X className="w-3 h-3" />
                <span>الجميع غير ملتزمات</span>
              </button>
            </div>
          )}
        </div>

        {feedbackBanner && (
          <div className="p-3.5 rounded-xl bg-white border border-[#DFCDB6] text-[#7C4E2E] text-xs font-bold flex items-center justify-between shadow-xs">
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

      {/* Summary KPI Cards in Soft Beige & Warm Brown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DDD0] p-4 text-center">
          <span className="text-xs font-bold text-[#7D6752] block">نسبة الالتزام بالصف</span>
          <span className="text-2xl font-black text-[#7C4E2E] tabular-nums mt-1 block">
            {currentStats.compliancePercentage}%
          </span>
          <span className="text-[10px] text-[#7D6752] block mt-0.5">
            حضور: {currentStats.presentCount}
          </span>
        </div>

        <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DDD0] p-4 text-center">
          <span className="text-xs font-bold text-[#7D6752] block">ملتزمة بالزي الرياضي</span>
          <span className="text-2xl font-black text-[#6E421B] tabular-nums mt-1 block">
            {currentStats.fullCount}
          </span>
          <span className="text-[10px] text-[#7D6752] block mt-0.5">بالزي المعتمد</span>
        </div>

        <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DDD0] p-4 text-center">
          <span className="text-xs font-bold text-[#7D6752] block">غير ملتزمة بالزي</span>
          <span className="text-2xl font-black text-[#9A381E] tabular-nums mt-1 block">
            {currentStats.noneCount}
          </span>
          <span className="text-[10px] text-[#7D6752] block mt-0.5">مخالفة أو بدون زي</span>
        </div>

        <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DDD0] p-4 text-center">
          <span className="text-xs font-bold text-[#7D6752] block">غائبة (مستثناة)</span>
          <span className="text-2xl font-black text-[#6B7280] tabular-nums mt-1 block">
            {currentStats.absentCount}
          </span>
          <span className="text-[10px] text-[#7D6752] block mt-0.5">خارج مقام النسبة</span>
        </div>
      </div>

      {/* Survey Sheet Form */}
      <div className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden shadow-[0_2px_8px_rgba(74,46,27,0.02)] print-container">
        <div className="p-4 bg-[#F5EFE6] border-b border-[#E8DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#4A2E1B]">
              استبيان الالتزام بالزي الرياضي ({getGradeLabel(selectedGrade)} — الشعبة {selectedSection})
            </h3>
            <span className="text-xs text-[#7D6752]">
              اختاري مباشرة حالة الطالبة (ملتزمة بالزي أو غير ملتزمة بالزي)
            </span>
          </div>

          {canEdit && classStudents.length > 0 && (
            <button
              type="button"
              onClick={handleSaveSurvey}
              className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto no-print"
            >
              <Save className="w-3.5 h-3.5 text-[#D4A76A]" />
              <span>حفظ الاستمارة اليومية</span>
            </button>
          )}

          {!canEdit && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-xs font-bold no-print">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>استمارة الزي معتمدة (وضع الاطلاع والطباعة فقط دون تعديل)</span>
            </div>
          )}
        </div>

        {classStudents.length === 0 ? (
          <div className="p-10 text-center space-y-3 bg-[#FAF7F2]">
            <Users className="w-10 h-10 text-[#B8A793] mx-auto" />
            <h4 className="text-sm font-bold text-[#4A2E1B]">
              لا توجد طالبات مسجلات في هذا الصف حاليًا
            </h4>
            <p className="text-xs text-[#7D6752] max-w-sm mx-auto">
              أضيفي أسماء طالبات هذا الصف من خانة إدارة الصفوف والطالبات للبدء في رصد الاستمارة اليومية.
            </p>
            {students.length > 0 && (
              <p className="text-xs text-[#7C4E2E] font-bold bg-[#FAF5EC] py-1.5 px-3 rounded-lg border border-[#DFCDB6] inline-block">
                ملاحظة: لديكِ {students.length} طالبة مسجلة ومثبتة في صفوف أخرى! اختاري الصف المسجل من القائمة المنسدلة أعلاه.
              </p>
            )}
            <div>
              <button
                type="button"
                onClick={onNavigateToStudents}
                className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#382012] text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
              >
                فتح خانة الصفوف وإضافة الأسماء
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF7F2] border-b border-[#E8DDD0] text-[#5A402D] font-black">
                  <th className="py-3 px-3.5 w-12 text-center">#</th>
                  <th className="py-3 px-3.5 min-w-[200px]">اسم الطالبة</th>
                  <th className="py-3 px-3.5 min-w-[340px] text-center">
                    الاستبانة: حالة الزي الرياضي
                  </th>
                  <th className="py-3 px-3.5 min-w-[150px]">خيارات أخرى (غياب/عذر)</th>
                  <th className="py-3 px-3.5 min-w-[180px]">ملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5ECE0]">
                {filteredClassStudents.map((st, idx) => {
                  const rec = records[st.id] || { status: 'full', note: '' };
                  const isFull = rec.status === 'full';
                  const isNone = rec.status === 'none';

                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-[#FAF5EC]/70 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center font-bold text-[#7D6752] tabular-nums">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3.5">
                        <div className="font-extrabold text-[#2C1A11] text-sm">{st.name}</div>
                        {st.healthNotes && (
                          <div className="text-[10px] text-[#8A5932] mt-0.5">
                            ملاحظة صحية: {st.healthNotes}
                          </div>
                        )}
                      </td>

                      {/* Main Questionnaire Survey Options: ملزم بالزي أو غير ملتزم */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center justify-center gap-2">
                          {/* Option 1: ملتزمة بالزي الرياضي */}
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setStudentStatus(st.id, 'full')}
                            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              isFull
                                ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-xs'
                                : 'bg-[#F7EFE4] text-[#6E421B] border-[#DFCDB6] hover:bg-[#EFE4D3]'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 text-[#D4A76A]" />
                            <span>ملتزمة بالزي</span>
                          </button>

                          {/* Option 2: غير ملتزمة بالزي الرياضي */}
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setStudentStatus(st.id, 'none')}
                            className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              isNone
                                ? 'bg-[#8A2B15] text-white border-[#8A2B15] shadow-xs'
                                : 'bg-[#FDF3F0] text-[#9A381E] border-[#F8CEC4] hover:bg-[#FCE6E1]'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>غير ملتزمة</span>
                          </button>
                        </div>
                      </td>

                      {/* Secondary Options: غائبة / عذر مقبول / جزئي */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setStudentStatus(st.id, 'absent')}
                            className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                              rec.status === 'absent'
                                ? 'bg-[#6B7280] text-white border-[#6B7280]'
                                : 'bg-[#F9FAFB] text-[#6B7280] border-[#E5E7EB] hover:bg-[#E5E7EB]'
                            }`}
                            title="تُستثنى الطالبة من مقام النسبة"
                          >
                            غائبة
                          </button>
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setStudentStatus(st.id, 'excused')}
                            className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                              rec.status === 'excused'
                                ? 'bg-[#6E5B47] text-white border-[#6E5B47]'
                                : 'bg-[#F5EFE8] text-[#6E5B47] border-[#DECFC0] hover:bg-[#EADBCA]'
                            }`}
                          >
                            عذر
                          </button>
                          <button
                            type="button"
                            disabled={!canEdit}
                            onClick={() => setStudentStatus(st.id, 'partial')}
                            className={`px-2 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                              rec.status === 'partial'
                                ? 'bg-[#8C5523] text-white border-[#8C5523]'
                                : 'bg-[#FAF3EA] text-[#8C5523] border-[#ECCFA9] hover:bg-[#F5E3CE]'
                            }`}
                          >
                            جزئي
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3.5">
                        <input
                          type="text"
                          disabled={!canEdit}
                          value={rec.note}
                          onChange={(e) => handleNoteChange(st.id, e.target.value)}
                          placeholder="ملاحظة..."
                          className="w-full rounded-lg border border-[#DFCDB6] bg-white px-2.5 py-1 text-xs text-[#2C1A11] focus:border-[#4A2E1B] focus:outline-hidden"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {classStudents.length > 0 && canEdit && (
          <div className="p-4 bg-[#F5EFE6] border-t border-[#E8DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            <span className="text-xs text-[#7D6752]">
              اضغطي على الزر لحفظ هذه الاستمارة بتاريخ مستقل ({selectedDate}) في السجل الدائم.
            </span>
            <button
              type="button"
              onClick={handleSaveSurvey}
              className="px-6 py-2.5 text-xs font-bold text-white bg-[#4A2E1B] hover:bg-[#382012] rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4 text-[#D4A76A]" />
              <span>حفظ الاستمارة اليومية لهذا الصف</span>
            </button>
          </div>
        )}
      </div>

      {/* Historical Archive of Saved Surveys */}
      <div className="bg-[#FAF7F2] rounded-2xl border border-[#E8DDD0] p-5 sm:p-6 space-y-4 no-print">
        <div className="flex items-center gap-2 text-[#4A2E1B]">
          <History className="w-5 h-5 text-[#7C4E2E]" />
          <h3 className="text-sm font-bold">
            أرشيف استمارات الزي الرياضي المحفوظة ({uniformLogs.length})
          </h3>
        </div>

        {uniformLogs.length === 0 ? (
          <p className="text-xs text-[#7D6752] py-4 text-center">
            لا توجد استمارات محفوظة مسبقًا حتى الآن.
          </p>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl border border-[#E8DDD0]">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-[#F5EFE6] border-b border-[#E8DDD0] text-[#5A402D] font-bold">
                  <th className="py-2.5 px-3">التاريخ</th>
                  <th className="py-2.5 px-3">الصف والشعبة</th>
                  <th className="py-2.5 px-3">الحصة</th>
                  <th className="py-2.5 px-3">نسبة الالتزام</th>
                  <th className="py-2.5 px-3 text-left">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F5ECE0]">
                {uniformLogs
                  .slice()
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((log) => {
                    const st = calculateUniformCompliance([log]);
                    return (
                      <tr key={log.id} className="hover:bg-[#FAF5EC]/70">
                        <td className="py-2.5 px-3 font-bold text-[#2C1A11] tabular-nums">
                          {log.date}
                        </td>
                        <td className="py-2.5 px-3">
                          {getGradeLabel(log.grade)} — الشعبة {log.section}
                        </td>
                        <td className="py-2.5 px-3">الحصة {log.period}</td>
                        <td className="py-2.5 px-3 font-black text-[#7C4E2E] tabular-nums">
                          {st.compliancePercentage}%
                        </td>
                        <td className="py-2.5 px-3 text-left">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedDate(log.date);
                                setSelectedGrade(log.grade);
                                setSelectedSection(log.section);
                                setSelectedPeriod(log.period);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF5ED] text-[#4A2E1B] hover:bg-[#F2ECE0] font-bold border border-[#DFCDB6]"
                            >
                              عرض / تعديل
                            </button>
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => onDeleteUniformLog(log.id)}
                                className="p-1 text-[#DC2626] hover:bg-[#FEE2E2] rounded-lg"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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
