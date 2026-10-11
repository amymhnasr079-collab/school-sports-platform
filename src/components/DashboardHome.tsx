import React, { useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  Award,
  BarChart3,
  Calendar,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Database,
  Download,
  Eye,
  FileCheck,
  Flame,
  GraduationCap,
  Lock,
  Presentation,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { ActiveTab, AppDatabase, AuthUser } from '../types';
import { calculateUniformCompliance, getGradeLabel, MOTIVATIONAL_QUOTES } from '../constants';
import { OfficialSchoolEmblemIllustration } from './OfficialSchoolEmblem';

interface DashboardHomeProps {
  db: AppDatabase;
  currentUser: AuthUser;
  onNavigate: (tab: ActiveTab) => void;
  onUpdateLogo: (dataUrl: string | null) => void;
  onOpenShareModal?: () => void;
  onOpenPinModal?: () => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({
  db,
  currentUser,
  onNavigate,
  onUpdateLogo,
  onOpenShareModal,
  onOpenPinModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pinNotification, setPinNotification] = useState<string | null>(null);

  const showPinToast = (msg: string) => {
    setPinNotification(msg);
    setTimeout(() => {
      setPinNotification(null);
    }, 4000);
  };
  const canEdit = currentUser.permissions.includes('edit');

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthPrefix = todayStr.slice(0, 7);

  const dailyUniformLogs = useMemo(
    () => db.uniformLogs.filter((l) => l.date === todayStr),
    [db.uniformLogs, todayStr]
  );

  const monthlyUniformLogs = useMemo(
    () => db.uniformLogs.filter((l) => l.date.startsWith(currentMonthPrefix)),
    [db.uniformLogs, currentMonthPrefix]
  );

  const allTimeStats = useMemo(
    () => calculateUniformCompliance(db.uniformLogs),
    [db.uniformLogs]
  );
  const dailyStats = useMemo(
    () => calculateUniformCompliance(dailyUniformLogs),
    [dailyUniformLogs]
  );
  const monthlyStats = useMemo(
    () => calculateUniformCompliance(monthlyUniformLogs),
    [monthlyUniformLogs]
  );

  const participationRate = useMemo(() => {
    let totalScore = 0;
    let count = 0;
    const scoreMap = {
      excellent: 100,
      very_good: 85,
      good: 70,
      needs_encouragement: 50,
    };

    for (const log of db.participationLogs) {
      for (const rec of Object.values(log.records)) {
        const avg =
          (scoreMap[rec.positiveParticipation] +
            scoreMap[rec.answeringQuestions] +
            scoreMap[rec.sportsSkills] +
            scoreMap[rec.teamwork] +
            scoreMap[rec.safetyCompliance] +
            scoreMap[rec.gamesInteraction] +
            scoreMap[rec.initiativeLeadership]) /
          7;
        totalScore += avg;
        count++;
      }
    }
    return count > 0 ? Math.round(totalScore / count) : 0;
  }, [db.participationLogs]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress logo to max 600px width/height and PNG/JPEG format (~40KB-70KB)
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 600;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/png');
          onUpdateLogo(compressed);
          showPinToast('تم رفع وتثبيت شعار المدرسة بنجاح في المنصة والقاعدة السحابية ✓');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePinCurrentLogo = () => {
    onUpdateLogo(db.schoolInfo.logoDataUrl || null);
    showPinToast('تم تثبيت وقفل شعار المدرسة الحالي بنجاح ولن يُحذف عند الخروج والدخول ✓');
  };

  const handleDownloadLogo = () => {
    if (db.schoolInfo.logoDataUrl) {
      const a = document.createElement('a');
      a.href = db.schoolInfo.logoDataUrl;
      a.download = `شعار_مدرسة_عائشة_بنت_عثمان_${new Date().toISOString().split('T')[0]}.png`;
      a.click();
      showPinToast('تم حفظ الشعار على جهازكِ بنجاح ✓');
    } else {
      // Create SVG blob download of official emblem
      showPinToast('الشعار الرسمي مدمج ومثبت في المنصة دائماً ✓');
    }
  };

  const quickModules: Array<{
    id: ActiveTab;
    title: string;
    subtitle: string;
    metricText: string;
    icon: React.ReactNode;
    iconBg: string;
    accentColor: string;
  }> = [
    {
      id: 'uniform',
      title: 'استمارة متابعة الزي الرياضي',
      subtitle: 'استبانة رصد يومي (ملتزمة / غير ملتزمة) مع حفظ السجل اليومي المستقل',
      metricText: `${db.uniformLogs.length} استمارة محفوظة`,
      icon: <ClipboardCheck className="w-5 h-5 text-[#7C4E2E]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      accentColor: 'hover:border-[#4A2E1B]',
    },
    {
      id: 'students',
      title: 'خانة الصفوف وإدارة الطالبات',
      subtitle: 'اختيار الصف (1–12) وإضافة وتعديل أسماء الطالبات والشعب بسهولة',
      metricText: `${db.students.length} طالبة مسجلة`,
      icon: <Users className="w-5 h-5 text-[#4A2E1B]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      accentColor: 'hover:border-[#4A2E1B]',
    },
    {
      id: 'participation',
      title: 'المشاركة الصفية والمهارات',
      subtitle: 'تقييم المهارات الحركية، العمل الجماعي، السلامة، والقيادة الرياضية',
      metricText: `${db.participationLogs.length} تقييم حصة`,
      icon: <CheckCircle2 className="w-5 h-5 text-[#7C4E2E]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      accentColor: 'hover:border-[#4A2E1B]',
    },
    {
      id: 'activities',
      title: 'الأنشطة والمسابقات الرياضية',
      subtitle: 'توثيق بطولات المدرسة ومسابقات اللياقة ومهرجانات الطالبات التفاعلية',
      metricText: `${db.activities.length} نشاط مسجل`,
      icon: <Activity className="w-5 h-5 text-[#4A2E1B]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      accentColor: 'hover:border-[#4A2E1B]',
    },
    {
      id: 'schedule',
      title: 'الجدول المدرسي الأسبوعي',
      subtitle: 'جدول الأحد إلى الخميس، أوقات الحصص وتوزيع الملاعب والصفوف',
      metricText: `${db.schedule.slots.length} حصة مجدولة`,
      icon: <Calendar className="w-5 h-5 text-[#8A5932]" />,
      iconBg: 'bg-[#FAF3E8] border border-[#E8DCC9]',
      accentColor: 'hover:border-[#4A2E1B]',
    },
    {
      id: 'stickers',
      title: 'الملصقات التحفيزية والأوسمة',
      subtitle: 'مكتبة أوسمة مبهجة (نجمة الالتزام، بطلة المشاركة) وتكريم الطالبات',
      metricText: `${db.stickers.length} وسام متاح`,
      icon: <Award className="w-5 h-5 text-[#7C4E2E]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      accentColor: 'hover:border-[#4A2E1B]',
    },
    {
      id: 'media',
      title: 'الفيديوهات والعروض التقديمية',
      subtitle: 'المكتبة الرقمية: حفظ وتنزيل عروض PowerPoint وفيديوهات المهارات من جهازكِ وكانفا',
      metricText: `${db.mediaItems?.length || 0} مورد (حفظ من الجهاز ✓)`,
      icon: <Presentation className="w-5 h-5 text-[#7C4E2E]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      accentColor: 'hover:border-[#4A2E1B]',
    },
    {
      id: 'reports',
      title: 'التقارير والإحصائيات',
      subtitle: 'مؤشرات الأداء، سجل تقدم كل طالبة، وتصدير CSV وطباعة هادئة',
      metricText: `الالتزام ${allTimeStats.compliancePercentage}%`,
      icon: <BarChart3 className="w-5 h-5 text-[#4A2E1B]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      accentColor: 'hover:border-[#4A2E1B]',
    },
    {
      id: 'guide',
      title: 'الأمان والنسخ الاحتياطي',
      subtitle: 'حفظ دائم للسجلات، تصدير JSON، وتبديل صلاحيات المستخدمين',
      metricText: 'محفوظ ومؤمن',
      icon: <Database className="w-5 h-5 text-[#8A5932]" />,
      iconBg: 'bg-[#FAF3E8] border border-[#E8DCC9]',
      accentColor: 'hover:border-[#4A2E1B]',
    },
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================
          HERO BANNER: Deep Warm Mocha Brown & Caramel Gold Beige
          ======================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-l from-[#3D2517] via-[#4F3320] to-[#2B180E] text-white p-6 sm:p-9 shadow-[0_16px_48px_rgba(43,24,14,0.25)] border border-[#5C3922]">
        {/* Amber & Caramel Glow Accent */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_top_right,rgba(197,139,80,0.35),transparent_60%)]"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-[#C58B50]/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Right: Main Platform Title & Official Leadership */}
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-3.5">
              {/* Ministry and Country Metadata */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-bold text-white/95">
                <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 backdrop-blur-xs">
                  سلطنة عُمان
                </span>
                <span aria-hidden="true" className="text-[#C58B50]">·</span>
                <span className="bg-white/10 px-2.5 py-1 rounded-lg border border-white/20 backdrop-blur-xs text-[#FAF4EB]">
                  وزارة التعليم
                </span>
                <span aria-hidden="true" className="text-[#C58B50]">·</span>
                <span>المديرية العامة للتعليم</span>
                <span aria-hidden="true" className="text-[#C58B50]">·</span>
                <span className="tabular-nums font-mono text-[#F5E8D3]">{db.schoolInfo.academicYear}</span>
              </div>

              {/* Main Headline with Highlighted Energy Tag */}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-xs">
                    منصة الرياضة المدرسية التفاعلية
                  </h1>
                  <span className="inline-flex items-center gap-1.5 text-xl sm:text-2xl font-black text-[#F5E8D3] bg-[#C58B50]/25 px-3.5 py-1 rounded-2xl border border-[#C58B50]/60 shadow-[0_2px_14px_rgba(197,139,80,0.2)] backdrop-blur-xs">
                    <Sparkles className="w-4 h-4 text-[#D4A76A]" />
                    <span>(طاقة وانطلاقة)</span>
                  </span>
                </div>

                <p className="text-base sm:text-lg font-bold text-[#F5ECE0] mt-2 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#D4A76A]" />
                  <span>مدرسة عائشة بنت عثمان للتعليم الأساسي (1–12)</span>
                </p>
              </div>

              <p className="text-xs sm:text-sm text-white/85 max-w-2xl leading-relaxed">
                منظومة إلكترونية متكاملة لإدارة ومتابعة حصص الرياضة المدرسية، رصد التزام الطالبات بالزي الرياضي، تقييم المشاركة والمهارات الحركية، وتنظيم السجلات والتقارير المدرسية بكفاءة وموثوقية عالية.
              </p>
            </div>

            {/* School Leadership Badges in Warm Glass */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/15">
              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 transition-all">
                <div className="flex items-center gap-1.5 text-[11px] text-[#F5E8D3] font-bold">
                  <Award className="w-3.5 h-3.5 text-[#D4A76A]" />
                  <span>إعداد وتصميم المنصة</span>
                </div>
                <p className="text-sm font-black text-white mt-1">
                  الأستاذة سالمة الحكماني
                </p>
                <p className="text-[10px] text-white/75 mt-0.5">معلمة الرياضة المدرسية</p>
              </div>

              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 transition-all">
                <div className="flex items-center gap-1.5 text-[11px] text-[#F5E8D3] font-bold">
                  <UserCheck className="w-3.5 h-3.5 text-[#D4A76A]" />
                  <span>مديرة المدرسة</span>
                </div>
                <p className="text-sm font-black text-white mt-1">
                  الأستاذة فايزه الغنبوصي
                </p>
                <p className="text-[10px] text-white/75 mt-0.5">الإدارة المدرسية المعتمدة</p>
              </div>

              <div className="bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 transition-all">
                <div className="flex items-center gap-1.5 text-[11px] text-[#F5E8D3] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4A76A]" />
                  <span>مشرفة المادة</span>
                </div>
                <p className="text-sm font-black text-white mt-1">
                  الأستاذة منيره الجابري
                </p>
                <p className="text-[10px] text-white/75 mt-0.5">الإشراف التربوي والرياضي</p>
              </div>
            </div>

            {/* Quick Share Link CTA in Hero */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenShareModal}
                className="px-4 py-2 bg-[#D4A76A] hover:bg-[#C58B50] text-[#2B180E] font-black text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                title="نسخ ومشاركة رابط العرض فقط للمديرة"
              >
                <Send className="w-4 h-4 text-[#2B180E]" />
                <span>مشاركة الرابط للمديرة (عرض واطلاع دون تعديل) 🔗</span>
              </button>

              {!canEdit && (
                <button
                  type="button"
                  onClick={onOpenPinModal}
                  className="px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs rounded-xl border border-white/25 transition-colors flex items-center gap-1.5"
                  title="التبديل إلى تحكم المعلمة برمز PIN"
                >
                  <Lock className="w-3.5 h-3.5 text-[#D4A76A]" />
                  <span>دخول المعلمة لتفعيل التعديل</span>
                </button>
              )}
            </div>
          </div>

          {/* Left: Official School Emblem (شعار المدرسة على يسار الواجهة) */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center bg-white/10 backdrop-blur-md rounded-3xl p-5 sm:p-6 border border-white/20 text-center shadow-[inset_0_1px_8px_rgba(255,255,255,0.15)] relative">
            {/* Pinned Badge */}
            <div className="mb-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1C3A27]/80 text-[#A7F3D0] border border-[#059669]/60 text-[10px] font-black backdrop-blur-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-[#34D399]" />
              <span>شعار المدرسة الحالي مثبت ودائم ✓</span>
            </div>

            <div className="relative group p-1 flex flex-col items-center">
              {db.schoolInfo.logoDataUrl ? (
                <div className="w-36 h-36 rounded-2xl bg-white p-3 flex items-center justify-center border-2 border-[#C58B50]/60 shadow-[0_4px_20px_rgba(0,0,0,0.2)] overflow-hidden">
                  <img
                    src={db.schoolInfo.logoDataUrl}
                    alt="شعار مدرسة عائشة بنت عثمان"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="filter drop-shadow-[0_4px_16px_rgba(0,0,0,0.25)] transition-transform group-hover:scale-102">
                  <OfficialSchoolEmblemIllustration className="w-36 h-36" />
                </div>
              )}

              {/* Upload & Customize School Emblem Buttons */}
              {canEdit && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoFileChange}
                    className="hidden"
                  />

                  {/* Explicit Pin Button */}
                  <button
                    type="button"
                    onClick={handlePinCurrentLogo}
                    className="px-3 py-1.5 text-xs font-black bg-[#C58B50] hover:bg-[#B3793F] text-[#2B180E] rounded-xl transition-all flex items-center gap-1 shadow-sm"
                    title="تثبيت وقفل الشعار الحالي ليظل ثابتاً في كافة السجلات"
                  >
                    <Lock className="w-3.5 h-3.5 text-[#2B180E]" />
                    <span>تثبيت الشعار الحالي ✓</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-bold bg-white/15 hover:bg-white/25 text-white rounded-xl backdrop-blur-md transition-all flex items-center gap-1 border border-white/20 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#D4A76A]" />
                    <span>{db.schoolInfo.logoDataUrl ? 'تغيير الشعار' : 'رفع صورة شعار'}</span>
                  </button>

                  {db.schoolInfo.logoDataUrl && (
                    <button
                      type="button"
                      onClick={() => onUpdateLogo(null)}
                      title="العودة للشعار الرسمي المعتمد"
                      className="p-1.5 text-xs bg-[#B91C1C] hover:bg-[#991B1B] text-white rounded-xl transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {db.schoolInfo.logoDataUrl && (
                    <button
                      type="button"
                      onClick={handleDownloadLogo}
                      title="تنزيل الشعار إلى جهازكِ"
                      className="p-1.5 text-xs bg-white/15 hover:bg-white/25 text-[#F5E8D3] rounded-xl transition-colors border border-white/20"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="mt-3 space-y-1">
              <span className="inline-block text-[11px] font-black tracking-wider text-[#F5E8D3] bg-[#C58B50]/25 px-3.5 py-0.5 rounded-full border border-[#C58B50]/50">
                الشعار الرسمي المعتمد
              </span>
              <p className="text-sm font-black text-white pt-0.5">
                مدرسة عائشة بنت عثمان (1–12)
              </p>
              <p className="text-xs font-bold text-[#F5ECE0]">
                طاقة وانطلاقة نحو التميز الرياضي
              </p>
              <p className="text-[11px] font-medium text-white/85 max-w-xs leading-relaxed pt-1">
                {db.schoolInfo.motivationalBanner}
              </p>
            </div>

            {/* Quick Action Navigation in Hero */}
            <div className="mt-4.5 flex flex-wrap justify-center gap-2 w-full">
              <button
                type="button"
                onClick={() => onNavigate('uniform')}
                className="px-4 py-2 bg-[#C58B50] text-[#2B180E] hover:bg-[#B3793F] text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 hover:scale-102"
              >
                <FileCheck className="w-3.5 h-3.5 text-[#2B180E]" />
                <span>فتح استمارة الزي اليوم</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('students')}
                className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl transition-all border border-white/20 hover:scale-102"
              >
                <Users className="w-3.5 h-3.5 text-[#D4A76A]" />
                <span>خانة الصفوف والطالبات</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          DAILY INSPIRATION: Warm Beige & Mocha Plaque
          ======================================================== */}
      <section className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-4.5 shadow-[0_2px_12px_rgba(74,46,27,0.04)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white text-[#7C4E2E] flex items-center justify-center shrink-0 border border-[#DFCDB6] shadow-2xs">
            <Flame className="w-5 h-5 text-[#A06938]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-black text-[#4A2E1B]">إشراقة النشاط الرياضي اليومية</h2>
              <span className="text-[10px] font-bold text-[#4A2E1B] bg-[#F5EAD9] px-2 py-0.5 rounded-md border border-[#DFCDB6]">
                طاقة وانطلاقة
              </span>
            </div>
            <p className="text-xs font-bold text-[#6D533D] mt-1 leading-relaxed">
              «{MOTIVATIONAL_QUOTES[0]}»
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-xs font-bold text-[#4A2E1B] bg-white px-3 py-1.5 rounded-xl border border-[#DFCDB6] tabular-nums flex items-center gap-1.5 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-[#A06938]" />
            <span>تاريخ اليوم: {todayStr}</span>
          </div>
        </div>
      </section>

      {/* ========================================================
          KEY PERFORMANCE INDICATORS (مؤشرات الأداء والالتزام)
          ======================================================== */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-black text-[#2C1A11]">مؤشرات الأداء والالتزام المدرسي</h2>
            <span className="text-[11px] font-bold text-[#4A2E1B] bg-[#F7EFE4] px-2.5 py-0.5 rounded-full border border-[#DFCDB6]">
              محدث تلقائيًا
            </span>
          </div>
          <span className="text-xs text-[#7D6752] hidden sm:inline-block">
            * يُستثنى الغياب رسميًا من مقام نسبة الالتزام
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Daily Uniform Compliance */}
          <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-[0_4px_16px_rgba(74,46,27,0.03)] hover:border-[#7C4E2E] transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#5A402D]">الالتزام بالزي اليوم</span>
              <span className="text-[11px] font-bold text-[#7C4E2E] bg-[#F7EFE4] px-2 py-0.5 rounded-lg border border-[#DFCDB6]">
                سجل اليوم
              </span>
            </div>
            <div className="my-3.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#7C4E2E] tabular-nums">
                  {dailyStats.compliancePercentage}%
                </span>
                <span className="text-xs text-[#7D6752]">
                  من أصل {dailyStats.presentCount} حاضرة
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#F5ECE0] rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-[#C58B50] to-[#7C4E2E] rounded-full transition-all duration-500"
                  style={{ width: `${dailyStats.compliancePercentage}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-[#7D6752] flex items-center justify-between pt-2.5 border-t border-[#F7EFE4]">
              <span>الاستمارات: {dailyUniformLogs.length}</span>
              <span>الغياب المستثنى: {dailyStats.absentCount}</span>
            </div>
          </div>

          {/* Card 2: Monthly Uniform Compliance */}
          <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-[0_4px_16px_rgba(74,46,27,0.03)] hover:border-[#4A2E1B] transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#5A402D]">الالتزام الشهري التراكمي</span>
              <span className="text-[11px] font-bold text-[#4A2E1B] bg-[#F5EFE6] px-2 py-0.5 rounded-lg border border-[#DFCDB6]">
                الشهر الحالي
              </span>
            </div>
            <div className="my-3.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#4A2E1B] tabular-nums">
                  {monthlyStats.compliancePercentage}%
                </span>
                <span className="text-xs text-[#7D6752]">
                  حضور: {monthlyStats.presentCount}
                </span>
              </div>
              <div className="w-full h-2.5 bg-[#F5ECE0] rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-[#A06938] to-[#4A2E1B] rounded-full transition-all duration-500"
                  style={{ width: `${monthlyStats.compliancePercentage}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-[#7D6752] flex items-center justify-between pt-2.5 border-t border-[#F7EFE4]">
              <span>إجمالي الاستمارات: {monthlyUniformLogs.length}</span>
              <span>ملتزمات: {monthlyStats.fullCount}</span>
            </div>
          </div>

          {/* Card 3: Classroom Participation */}
          <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-[0_4px_16px_rgba(74,46,27,0.03)] hover:border-[#8A5932] transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#5A402D]">المشاركة الصفية والتفاعل</span>
              <span className="text-[11px] font-bold text-[#6E421B] bg-[#FAF3E8] px-2 py-0.5 rounded-lg border border-[#E8DCC9]">
                7 معايير
              </span>
            </div>
            <div className="my-3.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#8A5932] tabular-nums">
                  {participationRate}%
                </span>
                <span className="text-xs text-[#7D6752]">متوسط المهارات</span>
              </div>
              <div className="w-full h-2.5 bg-[#F5ECE0] rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-[#D4A76A] to-[#8A5932] rounded-full transition-all duration-500"
                  style={{ width: `${participationRate}%` }}
                />
              </div>
            </div>
            <div className="text-[11px] text-[#7D6752] flex items-center justify-between pt-2.5 border-t border-[#F7EFE4]">
              <span>تقييمات الحصص: {db.participationLogs.length}</span>
              <span>الأوسمة الممنوحة: {db.awardedStickers.length}</span>
            </div>
          </div>

          {/* Card 4: Registered Students & Activities */}
          <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-[0_4px_16px_rgba(74,46,27,0.03)] hover:border-[#5A3821] transition-all flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#5A402D]">طالبات المدرسة المسجلات</span>
              <span className="text-[11px] font-bold text-[#5A3821] bg-[#F7EFE4] px-2 py-0.5 rounded-lg border border-[#DFCDB6]">
                الصفوف 1–12
              </span>
            </div>
            <div className="my-3.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#5A3821] tabular-nums">
                  {db.students.length}
                </span>
                <span className="text-xs text-[#7D6752]">طالبة مسجلة</span>
              </div>
              <div className="w-full h-2.5 bg-[#FAF5ED] rounded-full overflow-hidden mt-3">
                <div
                  className="h-full bg-[#5A3821] rounded-full transition-all duration-500"
                  style={{ width: db.students.length > 0 ? '100%' : '15%' }}
                />
              </div>
            </div>
            <div className="text-[11px] text-[#7D6752] flex items-center justify-between pt-2.5 border-t border-[#F7EFE4]">
              <span>الأنشطة: {db.activities.length}</span>
              <span>الحصص المجدولة: {db.schedule.slots.length}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          QUICK ACCESS TILES: 8 Platform Modules
          ======================================================== */}
      <section className="space-y-3.5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-[#2C1A11]">أقسام واستمارات المنصة المدرسية</h2>
          <span className="text-xs text-[#7D6752]">وصول فوري ومباشر إلى كل خدمة</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickModules.map((mod) => (
            <button
              key={mod.id}
              type="button"
              onClick={() => onNavigate(mod.id)}
              className={`group text-right bg-white rounded-2xl border border-[#E8DDD0] ${mod.accentColor} p-5 transition-all hover:shadow-[0_8px_25px_rgba(74,46,27,0.08)] hover:-translate-y-0.5 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-11 h-11 rounded-2xl ${mod.iconBg} flex items-center justify-center transition-transform group-hover:scale-105`}>
                    {mod.icon}
                  </div>
                  <span className="text-[11px] font-bold text-[#4A2E1B] bg-[#F7EFE4] px-2.5 py-1 rounded-lg border border-[#DFCDB6] tabular-nums">
                    {mod.metricText}
                  </span>
                </div>
                <h3 className="text-sm font-black text-[#2C1A11] group-hover:text-[#4A2E1B] transition-colors">
                  {mod.title}
                </h3>
                <p className="text-xs text-[#7D6752] mt-1.5 leading-relaxed">{mod.subtitle}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#F7EFE4] flex items-center justify-between text-xs font-bold text-[#7C4E2E]">
                <span>فتح القسم</span>
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ========================================================
          RECENT LOGS SNAPSHOT: Direct Confidence in Saved Data
          ======================================================== */}
      {db.uniformLogs.length > 0 && (
        <section className="bg-white rounded-2xl border border-[#E8DDD0] p-5 shadow-[0_2px_12px_rgba(74,46,27,0.03)] space-y-3.5">
          <div className="flex items-center justify-between border-b border-[#F7EFE4] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#7C4E2E]" />
              <h3 className="text-sm font-black text-[#2C1A11]">
                آخر استمارات الزي الرياضي المحفوظة في السجل اليومي
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('uniform')}
              className="text-xs font-bold text-[#7C4E2E] hover:underline flex items-center gap-1"
            >
              <span>عرض جميع السجلات</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {db.uniformLogs.slice(0, 3).map((log) => {
              const logStats = calculateUniformCompliance([log]);
              return (
                <div
                  key={log.id}
                  onClick={() => onNavigate('uniform')}
                  className="cursor-pointer bg-[#FAF7F2] hover:bg-[#F2ECE0] rounded-xl border border-[#E8DDD0] p-3.5 transition-colors flex items-center justify-between text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-black text-[#2C1A11]">
                      {getGradeLabel(log.grade)} — شعبة {log.section}
                    </div>
                    <div className="text-[11px] text-[#7D6752] tabular-nums">
                      التاريخ: {log.date} · الحصة {log.period}
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-base font-black text-[#7C4E2E] tabular-nums block">
                      {logStats.compliancePercentage}%
                    </span>
                    <span className="text-[10px] text-[#7D6752]">
                      حضور: {logStats.presentCount}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Pin Notification Toast */}
      {pinNotification && (
        <div className="fixed bottom-6 left-6 z-50 flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-xl text-xs font-black bg-[#1C3A27] text-[#A7F3D0] border border-[#059669] transition-all animate-in fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
          <span>{pinNotification}</span>
        </div>
      )}
    </div>
  );
};

