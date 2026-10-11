import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  Printer,
  TrendingUp,
} from 'lucide-react';
import { AppDatabase } from '../types';
import {
  calculateUniformCompliance,
  getGradeLabel,
  GRADES,
  PARTICIPATION_CRITERIA,
  SECTIONS,
} from '../constants';
import { SchoolLogoView } from './OfficialSchoolEmblem';

interface ReportsDashboardProps {
  db: AppDatabase;
}

export const ReportsDashboard: React.FC<ReportsDashboardProps> = ({ db }) => {
  const [filterGrade, setFilterGrade] = useState<number | 'all'>('all');
  const [filterSection, setFilterSection] = useState<string | 'all'>('all');

  const filteredUniformLogs = useMemo(() => {
    return db.uniformLogs.filter((log) => {
      if (filterGrade !== 'all' && log.grade !== filterGrade) return false;
      if (filterSection !== 'all' && log.section !== filterSection) return false;
      return true;
    });
  }, [db.uniformLogs, filterGrade, filterSection]);

  const overallUniformStats = useMemo(
    () => calculateUniformCompliance(filteredUniformLogs),
    [filteredUniformLogs]
  );

  const handleExportCsv = () => {
    const headers = ['التاريخ', 'الصف', 'الشعبة', 'الحصة', 'نسبة الالتزام %'];
    const rows = filteredUniformLogs.map((l) => {
      const st = calculateUniformCompliance([l]);
      return [l.date, getGradeLabel(l.grade), l.section, String(l.period), `${st.compliancePercentage}%`];
    });

    const csvContent =
      '\uFEFF' +
      [headers, ...rows]
        .map((r) => r.map((c) => `"${c}"`).join(','))
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الزي_الرياضي.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 space-y-5 shadow-[0_2px_8px_rgba(74,46,27,0.04)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DFCDB6] pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white p-1 border border-[#DFCDB6] shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
              <SchoolLogoView logoDataUrl={db.schoolInfo.logoDataUrl} className="w-full h-full" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#4A2E1B]">
                لوحة التقارير والإحصائيات التحليلية
              </h2>
              <p className="text-xs text-[#7D6752] mt-0.5">
                إحصائيات الالتزام بالزي والمشاركة لمدرسة عائشة بنت عثمان (طاقة وانطلاقة) مع تصدير CSV وطباعة
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 no-print">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2 text-xs font-bold text-[#4A2E1B] bg-white hover:bg-[#F7EFE4] border border-[#DFCDB6] rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#7C4E2E]" />
              <span>تصدير CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-bold text-white bg-[#4A2E1B] hover:bg-[#382012] rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4 text-[#D4A76A]" />
              <span>طباعة / حفظ PDF</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 no-print">
          <div>
            <label className="block text-xs font-bold text-[#5A402D] mb-1">الصف</label>
            <select
              value={filterGrade}
              onChange={(e) =>
                setFilterGrade(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden"
            >
              <option value="all">جميع الصفوف (1–12)</option>
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
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden"
            >
              <option value="all">جميع الشعب</option>
              {SECTIONS.map((s) => (
                <option key={s} value={s}>
                  الشعبة {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-[0_2px_8px_rgba(74,46,27,0.03)]">
          <span className="text-xs font-bold text-[#7D6752]">نسبة الالتزام الإجمالية</span>
          <span className="text-3xl font-black text-[#4A2E1B] block mt-2 tabular-nums">
            {overallUniformStats.compliancePercentage}%
          </span>
          <span className="text-[11px] text-[#6E421B] font-medium block mt-1">تُستثنى حالات الغياب من المقام</span>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-[0_2px_8px_rgba(74,46,27,0.03)]">
          <span className="text-xs font-bold text-[#7D6752]">إجمالي الطالبات الحاضرات</span>
          <span className="text-3xl font-black text-[#7C4E2E] block mt-2 tabular-nums">
            {overallUniformStats.presentCount}
          </span>
          <span className="text-[11px] text-[#7D6752] block mt-1">طالبة في السجلات المحفوظة</span>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-[0_2px_8px_rgba(74,46,27,0.03)]">
          <span className="text-xs font-bold text-[#7D6752]">حالات الغياب المستثناة</span>
          <span className="text-3xl font-black text-[#8C7560] block mt-2 tabular-nums">
            {overallUniformStats.absentCount}
          </span>
          <span className="text-[11px] text-[#8C7560] block mt-1">مستبعدة تلقائيًا من الحساب</span>
        </div>
      </div>
    </div>
  );
};
