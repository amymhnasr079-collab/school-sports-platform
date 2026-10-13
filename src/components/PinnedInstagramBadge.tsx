import React, { useState } from 'react';
import { Instagram, ExternalLink, Copy, Check, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { PLATFORM_INSTAGRAM_URL, PLATFORM_INSTAGRAM_HANDLE } from '../constants';

interface PinnedInstagramBadgeProps {
  className?: string;
}

export const PinnedInstagramBadge: React.FC<PinnedInstagramBadgeProps> = ({ className = '' }) => {
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    navigator.clipboard.writeText(PLATFORM_INSTAGRAM_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <aside
      aria-label="حساب الإنستغرام المثبت لمنصة طاقة وانطلاقة"
      className={`fixed bottom-5 left-5 z-40 transition-all duration-300 no-print select-none ${className}`}
    >
      {isMinimized ? (
        // Minimized floating circular badge
        <div className="relative group">
          <button
            type="button"
            onClick={() => setIsMinimized(false)}
            aria-label="إظهار بطاقة حساب الإنستغرام المثبتة"
            className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white p-0.5 shadow-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center cursor-pointer ring-3 ring-white/80"
            title="حساب الإنستغرام الرسمي @um_musk21 (انقر للفتح)"
          >
            <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#F77737] flex items-center justify-center">
              <Instagram className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            {/* Live pulsing ring indicator */}
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD1D1D] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#F77737] border-2 border-white"></span>
            </span>
          </button>
          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2C1A11] text-white text-xs font-black shadow-lg whitespace-nowrap">
            <span>حساب الإنستغرام الرسمي</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#D4A76A]" />
          </div>
        </div>
      ) : (
        // Expanded permanent pinned badge card
        <div className="relative group">
          {/* Subtle Ambient Glow */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] rounded-3xl blur-xs opacity-60 group-hover:opacity-100 transition duration-300 animate-pulse"></div>

          <div className="relative bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-3.5 shadow-2xl border-2 border-[#FD1D1D]/30 max-w-[320px] sm:max-w-[340px]">
            {/* Top header row with pin status and minimize button */}
            <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-[#F5E8D3]">
              <div className="flex items-center gap-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FD1D1D] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FD1D1D]"></span>
                </span>
                <span className="text-[11px] font-black tracking-wide text-[#7D6752] flex items-center gap-1">
                  <span>📌 حساب مثبت ودائم</span>
                  <Sparkles className="w-3 h-3 text-[#E1306C]" />
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-lg text-[#7D6752] hover:text-[#2C1A11] hover:bg-[#FAF7F2] transition-colors"
                  title="نسخ رابط الحساب"
                  aria-label="نسخ رابط الإنستغرام"
                >
                  {copied ? (
                    <span className="flex items-center gap-1 text-[10px] text-[#059669] font-black">
                      <Check className="w-3 h-3" /> تم
                    </span>
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className="p-1 rounded-lg text-[#7D6752] hover:text-[#2C1A11] hover:bg-[#FAF7F2] transition-colors text-xs font-bold"
                  title="تصغير الزر العائم"
                  aria-label="تصغير الزر"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Main Interactive CTA Link */}
            <a
              href={PLATFORM_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-br from-[#FAF7F2] to-[#FFF5EB] hover:from-[#FFF0E0] hover:to-[#FFE4D1] border border-[#E8DDD0] hover:border-[#F77737]/40 transition-all cursor-pointer group/link"
              title="انقر للانتقال مباشرة لحساب الإنستغرام"
            >
              {/* Instagram Icon with brand gradient */}
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white flex items-center justify-center shrink-0 shadow-md group-hover/link:scale-105 transition-transform">
                <Instagram className="w-6 h-6 text-white drop-shadow-xs" />
              </div>

              {/* Text Info */}
              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-black text-[#2C1A11] group-hover/link:text-[#833AB4] transition-colors">
                    إنستغرام «طاقة وانطلاقة»
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#F77737] shrink-0" />
                </div>
                <div className="text-[11px] font-bold text-[#E1306C] mt-0.5 tracking-wider dir-ltr text-right">
                  {PLATFORM_INSTAGRAM_HANDLE}
                </div>
                <div className="text-[10px] text-[#7D6752] truncate mt-0.5">
                  إعداد: أ. سالمة الحكماني · تغطيات مباشرة
                </div>
              </div>
            </a>

            {/* Direct Visit Button */}
            <div className="mt-2 pt-2 border-t border-[#F5E8D3]/60 flex items-center justify-between gap-2">
              <span className="text-[10px] text-[#7D6752]">زيارة الحساب الرسمي:</span>
              <a
                href={PLATFORM_INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white text-[11px] font-black hover:opacity-95 shadow-xs transition-transform hover:scale-105"
              >
                <span>متابعة الآن</span>
                <span className="text-[10px]">↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
