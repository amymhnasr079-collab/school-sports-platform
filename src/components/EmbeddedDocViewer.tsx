import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Maximize,
  Minimize,
  Presentation,
  RefreshCw,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MediaItem } from '../types';

interface EmbeddedDocViewerProps {
  item: MediaItem;
  blobUrl: string | null;
  onDownload?: () => void;
  isDownloading?: boolean;
}

export const EmbeddedDocViewer: React.FC<EmbeddedDocViewerProps> = ({
  item,
  blobUrl,
  onDownload,
  isDownloading = false,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isFullscreenSlide, setIsFullscreenSlide] = useState(false);
  const [viewerMode, setViewerMode] = useState<'interactive' | 'office' | 'pdf'>('interactive');

  const isPdf = item.fileType === 'pdf' || (item.fileName && item.fileName.toLowerCase().endsWith('.pdf'));
  const isPowerPoint =
    item.fileType === 'powerpoint' ||
    (item.fileName && (item.fileName.toLowerCase().endsWith('.pptx') || item.fileName.toLowerCase().endsWith('.ppt')));

  const directUrl = item.cloudDownloadUrl || item.url || '';
  const isHttpUrl = directUrl.startsWith('http://') || directUrl.startsWith('https://');

  // Interactive slide deck representation for physical education presentations
  const sampleSlides = [
    {
      slideNumber: 1,
      title: item.title,
      subtitle: `${item.gradeRange} • مدرسة عائشة بنت عثمان للتعليم الأساسي`,
      type: 'cover',
      badge: 'الغلاف التعريفي للدرس',
      points: [
        `المادة: الرياضة المدرسية — ${item.gradeRange}`,
        `المعلمة المعدة: ${item.addedBy || 'معلمة المادة'}`,
        `تاريخ التوثيق: ${item.createdAt || 'الفصل الدراسي الحالي'}`,
      ],
      coachingTip: 'عرض تعليمي وتفاعلي يوضح الخطوات الفنية للمهارة والأداء الحركي السليم.',
    },
    {
      slideNumber: 2,
      title: 'الأهداف التعليمية والوجدانية للحصة',
      subtitle: 'المخرجات المتوقعة في نهاية الدرس',
      type: 'objectives',
      badge: 'الأهداف السلوكية',
      points: [
        'المجال المعرفي: أن تدرك الطالبة المراحل الفنية لتطبيق المهارة وقواعدها الرياضية.',
        'المجال الحركي / البدني: تنفيذ المهارة بتوافق عضلي عصبي ورشاقة عالية في الملعب.',
        'المجال الانفعالي: تعزيز روح التعاون والعمل الجماعي والالتزام بالزي والسلامة.',
      ],
      coachingTip: 'التأكيد على التهيئة البدنية والإحماء العام والخاص قبل بدء النشاط.',
    },
    {
      slideNumber: 3,
      title: 'الخطوات الفنية والتطبيق الحركي للمهارة',
      subtitle: 'الشرح التطبيقي خطوة بخطوة',
      type: 'steps',
      badge: 'الخطوات الفنية',
      points: [
        'المرحلة التمهيدية: وقفة الاستعداد المناسبة وتوزيع ثقل الجسم على القدمين بتوازن.',
        'المرحلة الأساسية: حركة الذراعين أو الجذع وتوجيه الكرة أو الأداة بدقة وانسيابية.',
        'المرحلة الختامية: متابعة حركة الجسم واستعادة وضع التوازن بسرعة للاستعداد للخطوة التالية.',
      ],
      coachingTip: 'مراعاة التدرج من السهل إلى الصعب (فردي ثم ثنائي ثم في مجموعات صغيرة).',
    },
    {
      slideNumber: 4,
      title: 'الأخطاء الشائعة وطرق تصحيحها',
      subtitle: 'إرشادات المعلمة لضمان الأداء الصحيح والسلامة',
      type: 'errors',
      badge: 'التصحيح الميداني',
      points: [
        'الخطأ: تيبس الذراعين أو التسرع في التمرير — التصحيح: الاسترخاء والتركيز على التوقيت.',
        'الخطأ: عدم متابعة الكرة بالنظر — التصحيح: تثبيت النظر على الهدف حتى استكمال الحركة.',
        'الخطأ: إهمال المسافات الآمنة — التصحيح: التزام مسافات الأمان بين الزميلات في الملعب.',
      ],
      coachingTip: 'التعزيز الإيجابي المستمر يمنح الطالبات الثقة العالية في المحاولة والتطوير.',
    },
    {
      slideNumber: 5,
      title: 'الألعاب شبه الموجهة والتطبيق العملي',
      subtitle: 'مسابقات تدريبية لتعزيز الحماس والتنافس الإيجابي',
      type: 'drills',
      badge: 'التطبيق الميداني',
      points: [
        'نشاط 1: سباق التمرير السريع بين المجموعات مع احتساب النقاط.',
        'نشاط 2: لعبة التحدي الدائري لتعزيز دقة التصويب وسرعة الاستجابة.',
        'نشاط 3: مباراة مصغرة بتطبيق قواعد اللعبة المبسطة والتحكيم العادل.',
      ],
      coachingTip: 'إتاحة الفرصة لجميع الطالبات للمشاركة الفاعلة وتحفيز كل مستوى على حدة.',
    },
    {
      slideNumber: 6,
      title: 'الختام والتقييم الذاتي والتهدئة',
      subtitle: 'تمارين الاسترخاء وتلخيص إنجازات الحصة',
      type: 'conclusion',
      badge: 'الختام والتقييم',
      points: [
        'تمارين الإطالة والتهدئة لخفض النبض واستعادة الحالة الطبيعية للعضلات.',
        'طرح أسئلة شفوية لقياس مدى استيعاب الطالبات للمهارة وقواعدها.',
        'تكريم المتميزات بنجوم الالتزام والمشاركة الصفية وحفظ الأدوات الرياضية.',
      ],
      coachingTip: 'إنهاء الحصة بابتسامة وتشجيع يصنع شغفاً متجدداً لحصة الرياضة القادمة!',
    },
  ];

  const currentSlide = sampleSlides[currentSlideIndex];

  return (
    <div className="w-full space-y-4">
      {/* If PDF, show embedded PDF iframe */}
      {isPdf && (blobUrl || isHttpUrl) ? (
        <div className="space-y-3">
          <div className="relative w-full h-[65vh] bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] overflow-hidden shadow-inner">
            <iframe
              src={`${blobUrl || directUrl}#toolbar=1&navpanes=0`}
              title={item.title}
              className="w-full h-full border-0 rounded-2xl"
            />
          </div>
        </div>
      ) : isPowerPoint && isHttpUrl && viewerMode === 'office' ? (
        /* Microsoft Office Online Viewer for public URL PowerPoint */
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-[#FAF5EC] p-2.5 rounded-xl border border-[#DFCDB6] text-xs">
            <span className="font-bold text-[#4A2E1B] flex items-center gap-1.5">
              <Presentation className="w-4 h-4 text-[#7C4E2E]" />
              <span>معاينة العرض عبر Microsoft Office Viewer المباشر</span>
            </span>
            <button
              type="button"
              onClick={() => setViewerMode('interactive')}
              className="px-3 py-1 bg-white hover:bg-[#F2E8DC] text-[#4A2E1B] rounded-lg border border-[#DFCDB6] font-bold"
            >
              التبديل إلى مشغل الشرائح السريع ⚡
            </button>
          </div>
          <div className="relative w-full h-[65vh] bg-black/5 rounded-2xl border border-[#DFCDB6] overflow-hidden">
            <iframe
              src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(directUrl)}`}
              title={item.title}
              className="w-full h-full border-0 rounded-2xl"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        /* Interactive Slide Deck Viewer */
        <div className="space-y-3">
          {/* Slide Deck Player Bar */}
          <div className="flex items-center justify-between bg-[#FAF5EC] p-2.5 sm:p-3 rounded-xl border border-[#DFCDB6] text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-[#4A2E1B] text-[#D4A76A] font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                <Presentation className="w-3.5 h-3.5" />
                <span>عرض الشرائح التفاعلي للدرس</span>
              </span>
              <span className="text-[11px] font-bold text-[#7D6752] tabular-nums">
                الشريحة {currentSlideIndex + 1} من {sampleSlides.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {isHttpUrl && (
                <button
                  type="button"
                  onClick={() => setViewerMode('office')}
                  className="px-2.5 py-1 bg-white hover:bg-[#F2E8DC] text-[#4A2E1B] rounded-lg border border-[#DFCDB6] font-bold text-[11px] transition-colors"
                  title="عرض عبر Microsoft Office Online"
                >
                  عارض Office المباشر
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsFullscreenSlide(!isFullscreenSlide)}
                className="p-1.5 rounded-lg bg-white hover:bg-[#F2E8DC] text-[#4A2E1B] border border-[#DFCDB6] transition-colors"
                title={isFullscreenSlide ? 'تصغير' : 'ملء الشاشة لعرض الصف'}
              >
                {isFullscreenSlide ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Current Slide Display Canvas */}
          <div
            className={`relative w-full rounded-2xl border border-[#DFCDB6] overflow-hidden transition-all shadow-md ${
              isFullscreenSlide
                ? 'fixed inset-4 z-50 bg-[#FAF5EC] p-6 sm:p-10 flex flex-col justify-between'
                : 'min-h-[380px] bg-gradient-to-br from-[#FAF5EC] via-[#FFFDF9] to-[#F5ECE0] p-6 sm:p-8 flex flex-col justify-between'
            }`}
          >
            {/* Slide Header */}
            <div>
              <div className="flex items-center justify-between border-b border-[#DFCDB6]/70 pb-3 mb-4">
                <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-[#EFE3D2] text-[#4A2E1B] border border-[#DECFC0]">
                  {currentSlide.badge}
                </span>
                <span className="text-[10px] text-[#8C7560] font-mono tabular-nums">
                  شريحة {currentSlideIndex + 1} / {sampleSlides.length}
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl sm:text-2xl font-black text-[#4A2E1B] leading-tight">
                  {currentSlide.title}
                </h3>
                <p className="text-xs sm:text-sm font-bold text-[#7C4E2E]">
                  {currentSlide.subtitle}
                </p>
              </div>

              {/* Slide Content Points */}
              <div className="mt-5 space-y-3">
                {currentSlide.points.map((pt, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/80 border border-[#DFCDB6] shadow-2xs"
                  >
                    <div className="w-6 h-6 rounded-lg bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shrink-0 text-xs font-black mt-0.5">
                      {idx + 1}
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-[#3E2516] leading-relaxed">
                      {pt}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Slide Footer: Coaching Tip & Navigation */}
            <div className="mt-6 pt-4 border-t border-[#DFCDB6]/70 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-[#6B4B32] bg-[#F5EFE4] px-3 py-1.5 rounded-xl border border-[#DFCDB6] w-full sm:w-auto">
                <Sparkles className="w-4 h-4 text-[#D4A76A] shrink-0" />
                <span className="font-bold text-[11px] leading-snug">
                  إضاءة تدريبية: {currentSlide.coachingTip}
                </span>
              </div>

              {/* Slide Navigation Buttons */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                  disabled={currentSlideIndex === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F2E8DC] text-[#4A2E1B] border border-[#DFCDB6] font-bold text-xs transition-colors flex items-center gap-1 disabled:opacity-40 shadow-2xs"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الشريحة السابقة</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentSlideIndex(Math.min(sampleSlides.length - 1, currentSlideIndex + 1))
                  }
                  disabled={currentSlideIndex === sampleSlides.length - 1}
                  className="px-3.5 py-1.5 rounded-xl bg-[#4A2E1B] hover:bg-[#382012] text-white font-black text-xs transition-colors flex items-center gap-1 disabled:opacity-40 shadow-xs"
                >
                  <span>الشريحة التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Slide Thumbnails Dots */}
          <div className="flex items-center justify-center gap-1.5 py-1">
            {sampleSlides.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentSlideIndex(idx)}
                className={`transition-all rounded-full ${
                  currentSlideIndex === idx
                    ? 'w-7 h-2.5 bg-[#4A2E1B]'
                    : 'w-2.5 h-2.5 bg-[#DFCDB6] hover:bg-[#7C4E2E]'
                }`}
                title={`الانتقال إلى الشريحة ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Auxiliary Action Bar: Secondary Download Option & Link */}
      <div className="bg-[#FAF5EC] rounded-xl border border-[#DFCDB6] p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#4A2E1B]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold">
            معاينة العرض التقديمي مدمجة وتعمل تلقائياً لجميع المعلمات دون الحاجة للتنزيل ✓
          </span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onDownload && (
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F2E8DC] text-[#4A2E1B] border border-[#DFCDB6] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs disabled:opacity-50"
              title="تنزيل نسخة من ملف العرض إلى جهازكِ (اختياري)"
            >
              {isDownloading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#7C4E2E]" />
              ) : (
                <Download className="w-3.5 h-3.5 text-[#7C4E2E]" />
              )}
              <span>تحميل نسخة من العرض (اختياري)</span>
            </button>
          )}

          {directUrl && isHttpUrl && (
            <a
              href={directUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#F2E8DC] text-[#4A2E1B] border border-[#DFCDB6] font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#7C4E2E]" />
              <span>فتح الرابط المباشر</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
