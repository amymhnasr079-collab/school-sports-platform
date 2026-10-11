import {
  ParticipationLevel,
  SchoolDay,
  SportThemeColor,
  Student,
  UniformLog,
  UniformStatus,
} from './types';

export const GRADES = [
  { value: 1, label: 'الصف الأول' },
  { value: 2, label: 'الصف الثاني' },
  { value: 3, label: 'الصف الثالث' },
  { value: 4, label: 'الصف الرابع' },
  { value: 5, label: 'الصف الخامس' },
  { value: 6, label: 'الصف السادس' },
  { value: 7, label: 'الصف السابع' },
  { value: 8, label: 'الصف الثامن' },
  { value: 9, label: 'الصف التاسع' },
  { value: 10, label: 'الصف العاشر' },
  { value: 11, label: 'الصف الحادي عشر' },
  { value: 12, label: 'الصف الثاني عشر' },
];

export const SECTIONS = ['1', '2', '3', '4', '5'];

export const PERIODS = [
  { value: 1, label: 'الحصة الأولى' },
  { value: 2, label: 'الحصة الثانية' },
  { value: 3, label: 'الحصة الثالثة' },
  { value: 4, label: 'الحصة الرابعة' },
  { value: 5, label: 'الحصة الخامسة' },
  { value: 6, label: 'الحصة السادسة' },
  { value: 7, label: 'الحصة السابعة' },
  { value: 8, label: 'الحصة الثامنة' },
];

export const SCHOOL_DAYS: SchoolDay[] = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];

export const UNIFORM_STATUS_OPTIONS: Array<{
  value: UniformStatus;
  label: string;
  shortLabel: string;
  colorClass: string;
  activeClass: string;
  weight: number | null;
}> = [
  {
    value: 'full',
    label: 'ملتزمة بالزي الرياضي',
    shortLabel: 'ملتزمة بالزي',
    colorClass: 'text-[#6E421B] bg-[#F7EFE4] border-[#DFCDB6]',
    activeClass: 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-xs',
    weight: 1,
  },
  {
    value: 'none',
    label: 'غير ملتزمة بالزي',
    shortLabel: 'غير ملتزمة',
    colorClass: 'text-[#9A381E] bg-[#FDF3F0] border-[#F8CEC4]',
    activeClass: 'bg-[#8A2B15] text-white border-[#8A2B15] shadow-xs',
    weight: 0,
  },
  {
    value: 'partial',
    label: 'ملتزمة جزئيًا',
    shortLabel: 'ملتزمة جزئيًا',
    colorClass: 'text-[#8C5523] bg-[#FAF3EA] border-[#ECCFA9]',
    activeClass: 'bg-[#8C5523] text-white border-[#8C5523] shadow-xs',
    weight: 0.5,
  },
  {
    value: 'excused',
    label: 'لديها عذر مقبول',
    shortLabel: 'عذر مقبول',
    colorClass: 'text-[#6E5B47] bg-[#F5EFE8] border-[#DECFC0]',
    activeClass: 'bg-[#6E5B47] text-white border-[#6E5B47] shadow-xs',
    weight: 1,
  },
  {
    value: 'absent',
    label: 'غائبة (تُستثنى من النسبة)',
    shortLabel: 'غائبة',
    colorClass: 'text-[#6B7280] bg-[#F3F4F6] border-[#E5E7EB]',
    activeClass: 'bg-[#6B7280] text-white border-[#6B7280] shadow-xs',
    weight: null,
  },
];

export const PARTICIPATION_CRITERIA = [
  { key: 'positiveParticipation' as const, label: 'المشاركة الإيجابية' },
  { key: 'answeringQuestions' as const, label: 'الإجابة عن الأسئلة' },
  { key: 'sportsSkills' as const, label: 'تنفيذ المهارات الرياضية' },
  { key: 'teamwork' as const, label: 'التعاون والعمل الجماعي' },
  { key: 'safetyCompliance' as const, label: 'الالتزام بتعليمات السلامة' },
  { key: 'gamesInteraction' as const, label: 'التفاعل مع الألعاب والأنشطة' },
  { key: 'initiativeLeadership' as const, label: 'المبادرة والقيادة' },
];

export const PARTICIPATION_LEVELS: Array<{
  value: ParticipationLevel;
  label: string;
  score: number;
  activeClass: string;
  textClass: string;
}> = [
  {
    value: 'excellent',
    label: 'ممتازة',
    score: 4,
    activeClass: 'bg-[#4A2E1B] text-white border-[#4A2E1B]',
    textClass: 'text-[#4A2E1B]',
  },
  {
    value: 'very_good',
    label: 'جيدة جدًا',
    score: 3,
    activeClass: 'bg-[#7C4E2E] text-white border-[#7C4E2E]',
    textClass: 'text-[#7C4E2E]',
  },
  {
    value: 'good',
    label: 'جيدة',
    score: 2,
    activeClass: 'bg-[#A06938] text-white border-[#A06938]',
    textClass: 'text-[#A06938]',
  },
  {
    value: 'needs_encouragement',
    label: 'تحتاج إلى تشجيع',
    score: 1,
    activeClass: 'bg-[#7D6B58] text-white border-[#7D6B58]',
    textClass: 'text-[#7D6B58]',
  },
];

export const MOTIVATIONAL_QUOTES = [
  '«العقل السليم في الجسم السليم — خطوة رياضية اليوم تصنع بطلة الغد!»',
  '«الالتزام بالزي الرياضي عنوان الانضباط والاستعداد للإبداع في الملعب.»',
  '«روح الفريق والتعاون تجعل من كل حصة رياضة تجربة ممتعة ومليئة بالإنجاز.»',
  '«الرياضة المدرسية تبني الثقة بالنفس، والقيادة، واللياقة المتجددة.»',
];

export const THEME_COLORS: Record<
  SportThemeColor,
  {
    bg: string;
    border: string;
    accent: string;
    text: string;
    hexPrimary: string;
    hexSecondary: string;
  }
> = {
  turquoise: {
    bg: 'bg-[#FAF3E6]',
    border: 'border-[#E8D6B7]',
    accent: 'bg-[#945C2C] text-white',
    text: 'text-[#844E20]',
    hexPrimary: '#945C2C',
    hexSecondary: '#FAF3E6',
  },
  blue: {
    bg: 'bg-[#F5EFE6]',
    border: 'border-[#DFCDB6]',
    accent: 'bg-[#4A2E1B] text-white',
    text: 'text-[#4A2E1B]',
    hexPrimary: '#4A2E1B',
    hexSecondary: '#F5EFE6',
  },
  purple: {
    bg: 'bg-[#F8F2E8]',
    border: 'border-[#DFCDB4]',
    accent: 'bg-[#7C4E2E] text-white',
    text: 'text-[#7C4E2E]',
    hexPrimary: '#7C4E2E',
    hexSecondary: '#F8F2E8',
  },
  orange: {
    bg: 'bg-[#FAF5ED]',
    border: 'border-[#E8DFC9]',
    accent: 'bg-[#A06938] text-white',
    text: 'text-[#A06938]',
    hexPrimary: '#A06938',
    hexSecondary: '#FAF5ED',
  },
};

export function calculateUniformCompliance(logs: UniformLog[]) {
  let fullCount = 0;
  let partialCount = 0;
  let noneCount = 0;
  let absentCount = 0;
  let excusedCount = 0;

  for (const log of logs) {
    for (const rec of Object.values(log.records)) {
      if (rec.status === 'full') fullCount++;
      else if (rec.status === 'partial') partialCount++;
      else if (rec.status === 'none') noneCount++;
      else if (rec.status === 'absent') absentCount++;
      else if (rec.status === 'excused') excusedCount++;
    }
  }

  const totalRecorded = fullCount + partialCount + noneCount + absentCount + excusedCount;
  const presentCount = totalRecorded - absentCount;

  const weightedCompliant = fullCount * 1.0 + excusedCount * 1.0 + partialCount * 0.5;
  const compliancePercentage =
    presentCount > 0 ? Math.round((weightedCompliant / presentCount) * 100) : 0;

  const strictFullPercentage =
    presentCount > 0 ? Math.round(((fullCount + excusedCount) / presentCount) * 100) : 0;

  return {
    fullCount,
    partialCount,
    noneCount,
    absentCount,
    excusedCount,
    totalRecorded,
    presentCount,
    compliancePercentage,
    strictFullPercentage,
  };
}

export function generateExplicitSampleStudents(): Student[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'sample-st-1',
      name: '[بيانات تجريبية للاختبار] طالبة نموذجية 1 - الصف الخامس',
      grade: 5,
      section: '1',
      studentNumber: 'TEST-501',
      healthNotes: 'بيانات تجريبية لاختبار النظام',
      isSample: true,
      createdAt: now,
    },
    {
      id: 'sample-st-2',
      name: '[بيانات تجريبية للاختبار] طالبة نموذجية 2 - الصف الخامس',
      grade: 5,
      section: '1',
      studentNumber: 'TEST-502',
      healthNotes: '',
      isSample: true,
      createdAt: now,
    },
    {
      id: 'sample-st-3',
      name: '[بيانات تجريبية للاختبار] طالبة نموذجية 3 - الصف الخامس',
      grade: 5,
      section: '1',
      studentNumber: 'TEST-503',
      healthNotes: '',
      isSample: true,
      createdAt: now,
    },
    {
      id: 'sample-st-4',
      name: '[بيانات تجريبية للاختبار] طالبة نموذجية 4 - الصف التاسع',
      grade: 9,
      section: '2',
      studentNumber: 'TEST-901',
      healthNotes: '',
      isSample: true,
      createdAt: now,
    },
    {
      id: 'sample-st-5',
      name: '[بيانات تجريبية للاختبار] طالبة نموذجية 5 - الصف التاسع',
      grade: 9,
      section: '2',
      studentNumber: 'TEST-902',
      healthNotes: '',
      isSample: true,
      createdAt: now,
    },
  ];
}

export function getGradeLabel(grade: number): string {
  return GRADES.find((g) => g.value === grade)?.label || `الصف ${grade}`;
}
