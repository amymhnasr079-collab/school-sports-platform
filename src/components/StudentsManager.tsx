import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  FileSpreadsheet,
  FlaskConical,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { AuthUser, Student } from '../types';
import {
  generateExplicitSampleStudents,
  getGradeLabel,
  GRADES,
  SECTIONS,
} from '../constants';

interface StudentsManagerProps {
  students: Student[];
  currentUser: AuthUser;
  onSaveStudents: (nextStudents: Student[]) => void;
  onManualScanRecovery?: () => { totalStudents: number; recoveredCount: number };
}

export const StudentsManager: React.FC<StudentsManagerProps> = ({
  students,
  currentUser,
  onSaveStudents,
  onManualScanRecovery,
}) => {
  const canEdit = currentUser.permissions.includes('edit');
  const canDelete = currentUser.permissions.includes('delete');
  const csvInputRef = useRef<HTMLInputElement>(null);

  // View Mode: 'class' (by grade & section) vs 'all' (all students across all grades)
  const [viewMode, setViewMode] = useState<'class' | 'all'>('class');

  // Active Selected Class Tab (in 'class' view)
  const [selectedGrade, setSelectedGrade] = useState<number>(5);
  const [selectedSection, setSelectedSection] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filters for 'all' view
  const [allViewGradeFilter, setAllViewGradeFilter] = useState<number | 'all'>('all');
  const [allViewSectionFilter, setAllViewSectionFilter] = useState<string | 'all'>('all');

  // Quick Inline Add / Edit Student
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  // Bulk names paste area
  const [bulkNamesText, setBulkNamesText] = useState('');
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkGrade, setBulkGrade] = useState<number>(selectedGrade);
  const [bulkSection, setBulkSection] = useState<string>(selectedSection);

  // Feedback note & type
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'info' | 'warning'>('success');

  // Overall counts per grade
  const gradeCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const g of GRADES) {
      counts[g.value] = students.filter((s) => s.grade === g.value).length;
    }
    return counts;
  }, [students]);

  // Populated grades list (grades that actually have students)
  const populatedGrades = useMemo(() => {
    return GRADES.filter((g) => (gradeCounts[g.value] || 0) > 0);
  }, [gradeCounts]);

  // Students for currently selected Grade & Section
  const classStudents = useMemo(() => {
    return students
      .filter((s) => s.grade === selectedGrade && s.section === selectedSection)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedGrade, selectedSection]);

  const filteredClassStudents = useMemo(() => {
    if (!searchQuery.trim()) return classStudents;
    const q = searchQuery.trim().toLowerCase();
    return classStudents.filter((s) => s.name.toLowerCase().includes(q));
  }, [classStudents, searchQuery]);

  // Students for 'all' view
  const allFilteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (allViewGradeFilter !== 'all' && s.grade !== allViewGradeFilter) return false;
        if (allViewSectionFilter !== 'all' && s.section !== allViewSectionFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          return s.name.toLowerCase().includes(q) || (s.healthNotes && s.healthNotes.toLowerCase().includes(q));
        }
        return true;
      })
      .sort((a, b) => {
        if (a.grade !== b.grade) return a.grade - b.grade;
        if (a.section !== b.section) return a.section.localeCompare(b.section);
        return a.name.localeCompare(b.name);
      });
  }, [students, allViewGradeFilter, allViewSectionFilter, searchQuery]);

  const showToast = (msg: string, type: 'success' | 'info' | 'warning' = 'success', duration = 4500) => {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(null), duration);
  };

  const handleAddOrEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !studentName.trim()) return;

    if (editingStudentId) {
      const updated = students.map((s) =>
        s.id === editingStudentId
          ? {
              ...s,
              name: studentName.trim(),
              grade: selectedGrade,
              section: selectedSection,
              healthNotes: healthNotes.trim(),
            }
          : s
      );
      onSaveStudents(updated);
      setEditingStudentId(null);
      showToast(`تم تعديل وتثبيت بيانات الطالبة «${studentName.trim()}» بنجاح.`);
    } else {
      const newSt: Student = {
        id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: studentName.trim(),
        grade: selectedGrade,
        section: selectedSection,
        healthNotes: healthNotes.trim(),
        createdAt: new Date().toISOString(),
      };
      onSaveStudents([...students, newSt]);
      showToast(`تمت إضافة وتثبيت الطالبة «${newSt.name}» في ${getGradeLabel(selectedGrade)} — شعبة ${selectedSection}.`);
    }

    setStudentName('');
    setHealthNotes('');
  };

  const handleStartEdit = (st: Student) => {
    setEditingStudentId(st.id);
    setStudentName(st.name);
    setHealthNotes(st.healthNotes || '');
    setSelectedGrade(st.grade);
    setSelectedSection(st.section);
    window.scrollTo({ top: 180, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingStudentId(null);
    setStudentName('');
    setHealthNotes('');
  };

  const handleBulkAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !bulkNamesText.trim()) return;

    const names = bulkNamesText
      .split(/\r?\n/)
      .map((n) => n.trim())
      .filter(Boolean);

    if (names.length === 0) return;

    const newStudents: Student[] = names.map((name, i) => ({
      id: `st-bulk-${Date.now()}-${i}`,
      name,
      grade: bulkGrade,
      section: bulkSection,
      createdAt: new Date().toISOString(),
    }));

    onSaveStudents([...students, ...newStudents]);
    setBulkNamesText('');
    setShowBulkPaste(false);
    setSelectedGrade(bulkGrade);
    setSelectedSection(bulkSection);
    showToast(
      `✓ تمت إضافة وتثبيت ${newStudents.length} طالبة بنجاح في ${getGradeLabel(bulkGrade)} — الشعبة ${bulkSection}!`
    );
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      const lines = reader.result
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);

      const imported: Student[] = [];
      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const cols = rawLine.split(/[;,]/).map((c) => c.replace(/^["']|["']$/g, '').trim());

        if (i === 0 && (cols[0].includes('اسم') || cols[0].toLowerCase().includes('name'))) {
          continue;
        }

        const stName = cols[0];
        if (!stName) continue;

        const parsedGrade = cols[1] ? parseInt(cols[1].replace(/\D/g, ''), 10) : selectedGrade;
        const validGrade = !isNaN(parsedGrade) && parsedGrade >= 1 && parsedGrade <= 12 ? parsedGrade : selectedGrade;
        const stSection = cols[2] || selectedSection;
        const notes = cols[3] || '';

        imported.push({
          id: `st-csv-${Date.now()}-${i}`,
          name: stName,
          grade: validGrade,
          section: stSection,
          healthNotes: notes,
          createdAt: new Date().toISOString(),
        });
      }

      if (imported.length > 0) {
        onSaveStudents([...students, ...imported]);
        showToast(`✓ تم استيراد وتثبيت ${imported.length} طالبة من ملف CSV بنجاح.`);
      } else {
        showToast('لم يتم العثور على أسماء صالحة في الملف.', 'warning');
      }
      if (csvInputRef.current) csvInputRef.current.value = '';
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Permanent explicit lock & save
  const handlePermanentSaveAndLock = () => {
    onSaveStudents([...students]);
    try {
      localStorage.setItem('aisha_sports_permanent_students_v1', JSON.stringify(students));
      localStorage.setItem('aisha_students_roster_master', JSON.stringify(students));
      localStorage.setItem('aisha_school_sports_platform_beige_v1_backup', JSON.stringify(students));
    } catch {
      // ignore
    }
    showToast(
      `✓ تم تثبيت وتأكيد حفظ جميع أسماء الطالبات (${students.length} طالبة) بنجاح في ذاكرة المنصة الدائمة والنسخ الاحتياطية!`,
      'success',
      6000
    );
  };

  // Scan & recover students from previous storage keys or cache
  const handleScanAndRecover = () => {
    if (onManualScanRecovery) {
      const res = onManualScanRecovery();
      if (res.recoveredCount > 0) {
        showToast(
          `✓ تم فحص الذاكرة واسترجاع ${res.recoveredCount} طالبة إضافية بنجاح! إجمالي الطالبات المثبتات الآن: ${res.totalStudents} طالبة.`,
          'success',
          6000
        );
      } else {
        showToast(
          `✓ تم فحص الذاكرة والنسخ الاحتياطية: جميع الأسماء (${res.totalStudents} طالبة) مثبتة ومحفوظة مسبقاً.`,
          'info',
          5000
        );
      }
    } else {
      showToast('الذاكرة محدثة بالفعل.', 'info');
    }
  };

  // Export full student roster as Excel CSV with UTF-8 BOM
  const handleExportStudentsCsv = () => {
    if (students.length === 0) {
      showToast('لا توجد طالبات مسجلات لتصديرها.', 'warning');
      return;
    }
    const headers = ['اسم الطالبة', 'الصف', 'الشعبة', 'الملاحظات الصحية'];
    const rows = students.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${getGradeLabel(s.grade)}"`,
      `"${s.section}"`,
      `"${(s.healthNotes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `سجل_طالبات_مدرسة_عائشة_بنت_عثمان_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('✓ تم تنزيل ملف أسماء الطالبات كملف Excel/CSV على جهازكِ.');
  };

  const handleLoadSample = () => {
    if (!canEdit) return;
    const samples = generateExplicitSampleStudents();
    onSaveStudents([...students, ...samples]);
    showToast('تم تحميل بيانات تجريبية واضحة للاختبار في الصفين الخامس والتاسع.');
  };

  const handleClearSample = () => {
    if (!canDelete) return;
    onSaveStudents(students.filter((s) => !s.isSample));
    showToast('تم مسح البيانات التجريبية.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Verification & Permanent Retention Status */}
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 shadow-[0_2px_8px_rgba(74,46,27,0.04)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#DFCDB6] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shrink-0 border border-[#382012] shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-black text-[#4A2E1B]">
                  إدارة وتثبيت قوائم طالبات المدرسة
                </h2>
                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
                  <span>تثبيت تلقائي دائم ✓</span>
                </span>
              </div>
              <p className="text-xs text-[#7D6752] mt-0.5">
                حفظ مؤكد لقوائم الطالبات عبر جميع الصفوف (1–12) مع استرجاع تلقائي وتصدير للنسخ الاحتياطية
              </p>
            </div>
          </div>

          {/* Quick Actions & Permanent Safety Tools */}
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvUpload}
              className="hidden"
            />

            {/* Permanent Save & Lock */}
            <button
              type="button"
              onClick={handlePermanentSaveAndLock}
              className="px-3.5 py-2 text-xs font-black text-white bg-[#4A2E1B] hover:bg-[#382012] rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              title="تثبيت وحفظ جميع الأسماء في كافة وحدات الذاكرة"
            >
              <Lock className="w-3.5 h-3.5 text-[#D4A76A]" />
              <span>تثبيت وحفظ دائم</span>
            </button>

            {/* Scan & Recover from Storage */}
            <button
              type="button"
              onClick={handleScanAndRecover}
              className="px-3.5 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#FAF5EC] rounded-xl transition-colors flex items-center gap-1.5 border border-[#DFCDB6] shadow-2xs"
              title="فحص ذاكرة المتصفح والنسخ الاحتياطية واسترجاع الأسماء"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#7C4E2E]" />
              <span>فحص واسترجاع الأسماء</span>
            </button>

            {/* Export Roster as Excel CSV */}
            <button
              type="button"
              onClick={handleExportStudentsCsv}
              className="px-3 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#FAF5EC] rounded-xl transition-colors flex items-center gap-1.5 border border-[#DFCDB6] shadow-2xs"
              title="حفظ نسخة كاملة من الأسماء كملف Excel على جهازك"
            >
              <Download className="w-3.5 h-3.5 text-[#7C4E2E]" />
              <span>تنزيل Excel</span>
            </button>

            {/* Import CSV */}
            {canEdit && (
              <button
                type="button"
                onClick={() => csvInputRef.current?.click()}
                className="px-3 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#FAF5EC] rounded-xl transition-colors flex items-center gap-1.5 border border-[#DFCDB6] shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#7C4E2E]" />
                <span>استيراد CSV</span>
              </button>
            )}

            {/* Quick Bulk Paste */}
            {canEdit && (
              <button
                type="button"
                onClick={() => setShowBulkPaste(!showBulkPaste)}
                className="px-3 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#FAF5EC] rounded-xl transition-colors flex items-center gap-1.5 border border-[#DFCDB6] shadow-2xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#7C4E2E]" />
                <span>لصق قائمة سريعة</span>
              </button>
            )}

            {canEdit && !students.some((s) => s.isSample) && (
              <button
                type="button"
                onClick={handleLoadSample}
                className="px-3 py-2 text-xs font-bold text-[#7D6752] bg-white hover:bg-[#FAF5EC] rounded-xl transition-colors flex items-center gap-1 border border-[#DFCDB6]"
                title="تحميل عينة أسماء للاختبار"
              >
                <FlaskConical className="w-3.5 h-3.5 text-[#8A5932]" />
                <span>عينة تجريبية</span>
              </button>
            )}

            {canEdit && students.some((s) => s.isSample) && (
              <button
                type="button"
                onClick={handleClearSample}
                className="px-3 py-2 text-xs font-bold text-[#A8422B] bg-white hover:bg-[#FAF1EC] rounded-xl transition-colors flex items-center gap-1 border border-[#E9C8BC]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح العينة</span>
              </button>
            )}

            {!canEdit && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] text-xs font-bold shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-[#059669]" />
                <span>سجل أسماء الطالبات معتمد ومثبت (عرض واطلاع فقط)</span>
              </div>
            )}
          </div>
        </div>

        {/* Total Roster Summary & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#5A402D] font-bold">
              إجمالي الطالبات المثبتات في المنصة:
            </span>
            <span className="px-3 py-1 bg-[#4A2E1B] text-white font-black text-xs rounded-xl shadow-2xs tabular-nums">
              {students.length} طالبة
            </span>
            <span className="text-xs text-[#7D6752]">
              موزعات على {populatedGrades.length} صفاً دراسياً
            </span>
          </div>

          {/* Toggle between Class View and All Students View */}
          <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#DFCDB6]">
            <button
              type="button"
              onClick={() => setViewMode('class')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                viewMode === 'class'
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'text-[#7D6752] hover:text-[#4A2E1B]'
              }`}
            >
              تصفح حسب الصف والشعبة
            </button>
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                viewMode === 'all'
                  ? 'bg-[#4A2E1B] text-white shadow-xs'
                  : 'text-[#7D6752] hover:text-[#4A2E1B]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>عرض جميع الطالبات ({students.length})</span>
            </button>
          </div>
        </div>

        {/* In Class View: Grades Quick Selector Bar */}
        {viewMode === 'class' && (
          <div className="space-y-3 pt-2 border-t border-[#DFCDB6]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black text-[#5A402D]">
                  اختاري الصف الدراسي للاستعراض أو الإضافة:
                </label>
                <span className="text-[11px] text-[#7D6752]">
                  الأرقام تشير لعدد الطالبات المسجلات في كل صف
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                {GRADES.map((g) => {
                  const isSelected = selectedGrade === g.value;
                  const count = gradeCounts[g.value] || 0;
                  return (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => {
                        setSelectedGrade(g.value);
                        setEditingStudentId(null);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-xs'
                          : count > 0
                          ? 'bg-white text-[#4A2E1B] border-[#DFCDB6] hover:bg-[#FAF5EC] font-black'
                          : 'bg-white/80 text-[#8C7560] border-[#E8DDD0] hover:bg-[#FAF5EC]'
                      }`}
                    >
                      <span>{g.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-black ${
                          isSelected
                            ? 'bg-[#D4A76A] text-[#2C1A11]'
                            : count > 0
                            ? 'bg-[#FAF5EC] text-[#7C4E2E] border border-[#DFCDB6]'
                            : 'bg-gray-100 text-gray-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#DFCDB6]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#5A402D]">الشعبة:</span>
                <div className="flex items-center gap-1">
                  {SECTIONS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setSelectedSection(sec);
                        setEditingStudentId(null);
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        selectedSection === sec
                          ? 'bg-[#7C4E2E] text-white border-[#7C4E2E]'
                          : 'bg-white text-[#5A402D] border-[#DFCDB6] hover:bg-[#FAF5EC]'
                      }`}
                    >
                      الشعبة {sec}
                    </button>
                  ))}
                </div>
              </div>

              <div className="text-xs text-[#7D6752] font-bold">
                الصف المحدد حالياً: <strong className="text-[#4A2E1B]">{getGradeLabel(selectedGrade)} — الشعبة {selectedSection}</strong> ({classStudents.length} طالبة)
              </div>
            </div>
          </div>
        )}

        {/* Feedback Alert Message */}
        {feedback && (
          <div
            className={`p-3 rounded-xl border text-xs font-bold shadow-2xs flex items-center gap-2 ${
              feedbackType === 'success'
                ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                : feedbackType === 'warning'
                ? 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
                : 'bg-white border-[#DFCDB6] text-[#7C4E2E]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#059669]" />
            <span>{feedback}</span>
          </div>
        )}
      </div>

      {/* Populated Grades Quick Jumper (If current selected class has 0 students but other classes have students) */}
      {viewMode === 'class' && classStudents.length === 0 && students.length > 0 && (
        <div className="bg-[#FFFDF7] rounded-2xl border border-[#E8DDD0] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-[#A06938] shrink-0" />
            <div className="text-xs text-[#4A2E1B]">
              <span className="font-extrabold">ملاحظة:</span> الصف المحدد حالياً ({getGradeLabel(selectedGrade)} — شعبة {selectedSection}) فارغ، ولكن لديكِ{' '}
              <strong className="text-[#7C4E2E]">{students.length} طالبة</strong> مثبتة ومحفوظة في الصفوف التالية:
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {populatedGrades.map((pg) => (
              <button
                key={pg.value}
                type="button"
                onClick={() => setSelectedGrade(pg.value)}
                className="px-2.5 py-1 rounded-lg bg-white border border-[#DFCDB6] text-xs font-bold text-[#4A2E1B] hover:bg-[#FAF5EC] transition-colors"
              >
                {pg.label} ({gradeCounts[pg.value]})
              </button>
            ))}
            <button
              type="button"
              onClick={() => setViewMode('all')}
              className="px-3 py-1 rounded-lg bg-[#4A2E1B] text-white text-xs font-black shadow-2xs hover:bg-[#382012]"
            >
              عرض الكل ({students.length})
            </button>
          </div>
        </div>
      )}

      {/* Inline Form: Add or Edit Student */}
      {canEdit && (
        <form
          onSubmit={handleAddOrEditStudent}
          className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-[0_2px_8px_rgba(74,46,27,0.03)] space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#4A2E1B] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#7C4E2E]" />
              <span>
                {editingStudentId
                  ? `تعديل بيانات الطالبة في ${getGradeLabel(selectedGrade)} (شعبة ${selectedSection})`
                  : `إضافة طالبة جديدة إلى ${getGradeLabel(selectedGrade)} (شعبة ${selectedSection})`}
              </span>
            </h3>
            {editingStudentId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-[#7C4E2E] hover:underline"
              >
                إلغاء التعديل
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6">
              <label className="block text-xs font-bold text-[#5A402D] mb-1">
                اسم الطالبة الثلاثي أو الرباعي
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="أدخلي اسم الطالبة الكامل..."
                className="w-full rounded-xl border border-[#DFCDB6] bg-[#FAF7F2] px-3 py-2 text-xs font-bold text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-[#5A402D] mb-1">
                ملاحظة صحية / لياقية (اختياري)
              </label>
              <input
                type="text"
                value={healthNotes}
                onChange={(e) => setHealthNotes(e.target.value)}
                placeholder="مثال: حساسية، إعفاء مؤقت..."
                className="w-full rounded-xl border border-[#DFCDB6] bg-[#FAF7F2] px-3 py-2 text-xs text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
              />
            </div>

            <div className="sm:col-span-2 flex items-end">
              <button
                type="submit"
                className="w-full py-2 px-3 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                {editingStudentId ? <Check className="w-4 h-4 text-[#D4A76A]" /> : <Plus className="w-4 h-4 text-[#D4A76A]" />}
                <span>{editingStudentId ? 'حفظ التعديل' : 'إضافة وتثبيت'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Bulk Paste Box (Optional) */}
      {showBulkPaste && canEdit && (
        <form
          onSubmit={handleBulkAdd}
          className="p-5 rounded-2xl bg-[#FAF5EC] border border-[#DFCDB6] space-y-3"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-[#4A2E1B] block">
                لصق سريع لأسماء الطالبات دفعة واحدة: ضعي كل اسم في سطر جديد
              </span>
              <span className="text-[11px] text-[#7D6752]">
                يمكنكِ نسخ قائمة الأسماء من ملف Word أو Excel ولصقها هنا مباشرة.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowBulkPaste(false)}
              className="text-xs text-[#7C4E2E] hover:underline self-end sm:self-auto"
            >
              إغلاق
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
            <div>
              <label className="block text-xs font-bold text-[#5A402D] mb-1">الصف المستهدف:</label>
              <select
                value={bulkGrade}
                onChange={(e) => setBulkGrade(Number(e.target.value))}
                className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-1.5 text-xs font-bold text-[#4A2E1B]"
              >
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#5A402D] mb-1">الشعبة:</label>
              <select
                value={bulkSection}
                onChange={(e) => setBulkSection(e.target.value)}
                className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-1.5 text-xs font-bold text-[#4A2E1B]"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    الشعبة {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            rows={5}
            value={bulkNamesText}
            onChange={(e) => setBulkNamesText(e.target.value)}
            placeholder="فاطمة سالم الحجرية&#10;مريم أحمد السعدية&#10;عائشة محمد الغنبوصية&#10;ريم خميس الهاشمية..."
            className="w-full rounded-xl border border-[#DFCDB6] bg-white p-3 text-xs text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-[#D4A76A]" />
            <span>إضافة وتثبيت الأسماء دفعة واحدة</span>
          </button>
        </form>
      )}

      {/* VIEW MODE 1: Class View Table */}
      {viewMode === 'class' && (
        <div className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden shadow-[0_2px_8px_rgba(74,46,27,0.03)]">
          <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DDD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#4A2E1B]">
                قائمة طالبات {getGradeLabel(selectedGrade)} — الشعبة {selectedSection} ({classStudents.length} طالبة)
              </h3>
            </div>

            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8C7560] absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث في هذا الصف..."
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white pr-8.5 pl-3 py-1.5 text-xs text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {classStudents.length === 0 ? (
            <div className="p-10 text-center space-y-3 bg-[#FAF7F2]">
              <Users className="w-10 h-10 text-[#C4B2A0] mx-auto" />
              <h4 className="text-sm font-bold text-[#4A2E1B]">
                لا توجد طالبات مسجلات في هذا الصف حتى الآن
              </h4>
              <p className="text-xs text-[#7D6752] max-w-sm mx-auto">
                اكتبي اسم الطالبة في الخانة أعلاه واضغطي «إضافة وتثبيت»، أو الصقي قائمة الأسماء دفعة واحدة.
              </p>
              {students.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode('all')}
                  className="px-4 py-2 bg-[#FAF5EC] hover:bg-[#F2E8DC] text-[#4A2E1B] text-xs font-bold rounded-xl border border-[#DFCDB6] transition-colors"
                >
                  استعراض جميع طالبات المدرسة المسجلات ({students.length} طالبة)
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8DDD0] text-[#5A402D] font-bold">
                    <th className="py-3 px-3.5 w-12 text-center">#</th>
                    <th className="py-3 px-3.5 min-w-[220px]">اسم الطالبة</th>
                    <th className="py-3 px-3.5 min-w-[120px]">الصف والشعبة</th>
                    <th className="py-3 px-3.5 min-w-[180px]">الملاحظات الصحية</th>
                    <th className="py-3 px-3.5 text-left w-24">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5ECE0]">
                  {filteredClassStudents.map((st, idx) => (
                    <tr
                      key={st.id}
                      className="hover:bg-[#FAF5EC]/70 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center font-bold text-[#8C7560] tabular-nums">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="font-extrabold text-[#2C1A11] text-sm">{st.name}</span>
                        {st.isSample && (
                          <span className="mr-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            تجريبي
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-[#5A402D] font-semibold">
                        {getGradeLabel(st.grade)} — {st.section}
                      </td>

                      <td className="py-3 px-3.5 text-[#7D6752]">
                        {st.healthNotes || '—'}
                      </td>

                      <td className="py-3 px-3.5 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleStartEdit(st)}
                              className="p-1.5 text-[#7C4E2E] hover:bg-[#FAF5EC] rounded-lg transition-colors"
                              title="تعديل اسم وبيانات الطالبة"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onSaveStudents(students.filter((s) => s.id !== st.id))}
                              className="p-1.5 text-[#A8422B] hover:bg-[#FAF1EC] rounded-lg transition-colors"
                              title="حذف الطالبة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: All School Students Table */}
      {viewMode === 'all' && (
        <div className="bg-white rounded-2xl border border-[#E8DDD0] overflow-hidden shadow-[0_2px_8px_rgba(74,46,27,0.03)] space-y-0">
          <div className="p-4 bg-[#FAF7F2] border-b border-[#E8DDD0] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#4A2E1B]">
                السجل الشامل لجميع طالبات المدرسة ({allFilteredStudents.length} من أصل {students.length})
              </h3>
              <p className="text-[11px] text-[#7D6752]">
                عرض كافة الأسماء المسجلة في النظام مع إمكانية التصفية السريعة
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={allViewGradeFilter}
                onChange={(e) =>
                  setAllViewGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="rounded-xl border border-[#DFCDB6] bg-white px-2.5 py-1.5 text-xs font-bold text-[#4A2E1B]"
              >
                <option value="all">جميع الصفوف (1–12)</option>
                {GRADES.map((g) => (
                  <option key={g.value} value={g.value}>
                    {g.label} ({gradeCounts[g.value] || 0})
                  </option>
                ))}
              </select>

              <select
                value={allViewSectionFilter}
                onChange={(e) => setAllViewSectionFilter(e.target.value)}
                className="rounded-xl border border-[#DFCDB6] bg-white px-2.5 py-1.5 text-xs font-bold text-[#4A2E1B]"
              >
                <option value="all">جميع الشعب</option>
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    الشعبة {s}
                  </option>
                ))}
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8C7560] absolute right-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث بالاسم..."
                  className="rounded-xl border border-[#DFCDB6] bg-white pr-8.5 pl-3 py-1.5 text-xs text-[#2C1A11] focus:border-[#7C4E2E] focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {allFilteredStudents.length === 0 ? (
            <div className="p-10 text-center space-y-2 bg-[#FAF7F2]">
              <Users className="w-10 h-10 text-[#C4B2A0] mx-auto" />
              <h4 className="text-sm font-bold text-[#4A2E1B]">
                {students.length === 0
                  ? 'لا توجد طالبات مسجلات في المنصة حالياً'
                  : 'لا توجد طالبات تطابق خيارات البحث والتصفية'}
              </h4>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] border-b border-[#E8DDD0] text-[#5A402D] font-bold">
                    <th className="py-3 px-3.5 w-12 text-center">#</th>
                    <th className="py-3 px-3.5 min-w-[220px]">اسم الطالبة</th>
                    <th className="py-3 px-3.5 min-w-[140px]">الصف الدراسي</th>
                    <th className="py-3 px-3.5 min-w-[90px]">الشعبة</th>
                    <th className="py-3 px-3.5 min-w-[180px]">الملاحظات الصحية</th>
                    <th className="py-3 px-3.5 text-left w-24">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F5ECE0]">
                  {allFilteredStudents.map((st, idx) => (
                    <tr
                      key={st.id}
                      className="hover:bg-[#FAF5EC]/70 transition-colors"
                    >
                      <td className="py-3 px-3.5 text-center font-bold text-[#8C7560] tabular-nums">
                        {idx + 1}
                      </td>

                      <td className="py-3 px-3.5">
                        <span className="font-extrabold text-[#2C1A11] text-sm">{st.name}</span>
                        {st.isSample && (
                          <span className="mr-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            تجريبي
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3.5 text-[#4A2E1B] font-bold">
                        {getGradeLabel(st.grade)}
                      </td>

                      <td className="py-3 px-3.5 text-[#5A402D] font-semibold">
                        الشعبة {st.section}
                      </td>

                      <td className="py-3 px-3.5 text-[#7D6752]">
                        {st.healthNotes || '—'}
                      </td>

                      <td className="py-3 px-3.5 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                handleStartEdit(st);
                                setViewMode('class');
                              }}
                              className="p-1.5 text-[#7C4E2E] hover:bg-[#FAF5EC] rounded-lg transition-colors"
                              title="تعديل اسم وبيانات الطالبة"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => onSaveStudents(students.filter((s) => s.id !== st.id))}
                              className="p-1.5 text-[#A8422B] hover:bg-[#FAF1EC] rounded-lg transition-colors"
                              title="حذف الطالبة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
