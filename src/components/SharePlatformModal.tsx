import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Eye,
  Key,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  Instagram,
} from 'lucide-react';
import {
  generateShareUrl,
  generateWhatsAppShareText,
  getTeacherPin,
  setTeacherPin,
} from '../services/authSecurity';
import { UserRole } from '../types';
import { PLATFORM_INSTAGRAM_URL, PLATFORM_INSTAGRAM_HANDLE } from '../constants';

interface SharePlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToRolePreview: (role: UserRole) => void;
  schoolName: string;
}

export const SharePlatformModal: React.FC<SharePlatformModalProps> = ({
  isOpen,
  onClose,
  onSwitchToRolePreview,
  schoolName,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [showPinChange, setShowPinChange] = useState<boolean>(false);
  const [currentPin, setCurrentPinState] = useState<string>(getTeacherPin());
  const [newPin, setNewPin] = useState<string>('');
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const principalUrl = generateShareUrl('principal');
  const supervisorUrl = generateShareUrl('supervisor');
  const viewerUrl = generateShareUrl('viewer');

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 3000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 3000);
    }
  };

  const openWhatsApp = (role: 'principal' | 'supervisor' | 'viewer') => {
    const text = generateWhatsAppShareText(role, schoolName);
    const encoded = encodeURIComponent(text);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;
    // Using window.open or direct link
    window.location.href = waUrl;
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setPinFeedback('يجب أن يتكون رمز الدخول من 4 أرقام أو أحرف على الأقل.');
      return;
    }
    const ok = setTeacherPin(newPin.trim());
    if (ok) {
      setCurrentPinState(newPin.trim());
      setNewPin('');
      setShowPinChange(false);
      setPinFeedback('تم تحديث رمز التحكم السري للمعلمة بنجاح ✓');
      setTimeout(() => setPinFeedback(null), 4000);
    } else {
      setPinFeedback('تعذر حفظ الرمز، يُرجى المحاولة ثانية.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#DFCDB6] overflow-hidden my-8">
        {/* Modal Header */}
        <div className="bg-gradient-to-l from-[#3D2517] via-[#4F3320] to-[#2B180E] text-white p-5 sm:p-6 flex items-center justify-between border-b border-[#5C3922]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#C58B50]/20 text-[#F5E8D3] border border-[#C58B50]/40 flex items-center justify-center shrink-0 shadow-xs">
              <Send className="w-6 h-6 text-[#D4A76A]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                مشاركة رابط المنصة مع الإدارة المدرسية
              </h2>
              <p className="text-xs text-[#F5ECE0] mt-0.5">
                وضع العرض والاطلاع فقط دون إمكانية التعديل — التحكم الكامل محصور بمعلمة المادة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Security Guarantee Notice */}
          <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-4 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-[#059669] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-black text-[#4A2E1B]">
                ضمان الأمان وحماية السجلات من أي تعديل:
              </h4>
              <p className="text-[#6C533D] leading-relaxed">
                عند إرسال هذا الرابط لمديرة المدرسة أو المشرفة، ستفتح المنصة في <strong>وضع العرض والاطلاع فقط</strong>. لن تتمكن المديرة من حذف أو تعديل أو إضافة أي طالبة أو حصة أو استمارة، ولا يمكن لأحد الانتقال لوضع التحكم والتعديل إلا بإدخال رمزكِ السري الخاص.
              </p>
            </div>
          </div>

          {/* Card 1: Principal Share Link (Main Focus) */}
          <div className="rounded-2xl border-2 border-[#D4A76A] bg-white p-4 sm:p-5 space-y-3.5 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#FAF5EC] border border-[#DFCDB6] flex items-center justify-center text-[#7C4E2E]">
                  <UserCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-[#4A2E1B]">
                    رابط مديرة المدرسة: الأستاذة فايزه الغنبوصي
                  </h3>
                  <span className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0]">
                    ✓ وضع العرض والاطلاع الرسمي (بدون تعديل)
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onSwitchToRolePreview('principal');
                  onClose();
                }}
                className="text-xs font-bold text-[#7C4E2E] hover:text-[#4A2E1B] flex items-center gap-1 hover:underline"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة ما ستشاهده المديرة</span>
              </button>
            </div>

            {/* URL Display Box */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E8DDD0]">
              <input
                type="text"
                readOnly
                value={principalUrl}
                className="flex-1 bg-transparent text-xs text-[#2C1A11] font-mono outline-hidden select-all"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(principalUrl, 'principal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 shadow-2xs ${
                  copiedType === 'principal'
                    ? 'bg-[#059669] text-white'
                    : 'bg-[#4A2E1B] hover:bg-[#382012] text-white'
                }`}
              >
                {copiedType === 'principal' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ بنجاح ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#D4A76A]" />
                    <span>نسخ الرابط للمديرة</span>
                  </>
                )}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => openWhatsApp('principal')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] border border-[#25D366]/30 flex items-center gap-1.5 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                <span>إرسال عبر واتساب للمديرة</span>
              </button>
              <span className="text-[11px] text-[#7D6752]">
                (يتضمن رسالة رسمية مهذبة مرفقة بالرابط)
              </span>
            </div>
          </div>

          {/* Card 2: Supervisor Share Link */}
          <div className="rounded-2xl border border-[#DFCDB6] bg-white p-4 space-y-3 shadow-2xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-[#FAF5EC] border border-[#DFCDB6] flex items-center justify-center text-[#7C4E2E]">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-black text-[#4A2E1B]">
                    رابط مشرفة المادة: الأستاذة منيره الجابري
                  </h3>
                  <span className="text-[10px] text-[#7D6752]">
                    عرض واطلاع ومتابعة الحصص دون تعديل
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(supervisorUrl, 'supervisor')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                    copiedType === 'supervisor'
                      ? 'bg-[#059669] text-white border-[#059669]'
                      : 'bg-white hover:bg-[#FAF7F2] text-[#4A2E1B] border-[#DFCDB6]'
                  }`}
                >
                  {copiedType === 'supervisor' ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>تم النسخ ✓</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 text-[#7C4E2E]" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openWhatsApp('supervisor')}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#128C7E] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center gap-1"
                >
                  <MessageSquare className="w-3 h-3 text-[#25D366]" />
                  <span>واتساب</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 3: Teacher's Secret PIN Control */}
          <div className="rounded-2xl border border-[#DFCDB6] bg-[#FAF5EC] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-[#4A2E1B]">
                    رمز أمان المعلمة السري (للتحكم والتعديل)
                  </h4>
                  <p className="text-[11px] text-[#7D6752]">
                    الرمز الحالي للتحكم:{' '}
                    <span className="font-mono font-black text-[#4A2E1B] bg-white px-2 py-0.5 rounded-md border border-[#DFCDB6]">
                      {currentPin}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPinChange(!showPinChange)}
                className="text-xs font-bold text-[#7C4E2E] hover:text-[#4A2E1B] underline"
              >
                {showPinChange ? 'إلغاء' : 'تغيير الرمز السري'}
              </button>
            </div>

            {showPinChange && (
              <form onSubmit={handleUpdatePin} className="pt-2 border-t border-[#DFCDB6] space-y-2.5">
                <label className="block text-xs font-bold text-[#4A2E1B]">
                  أدخلي الرمز السري الجديد (4 أرقام على الأقل):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="مثال: 9876"
                    maxLength={10}
                    className="w-36 rounded-xl border border-[#DFCDB6] bg-white px-3 py-1.5 text-xs font-mono font-bold text-[#2C1A11] outline-hidden focus:border-[#7C4E2E]"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-bold rounded-xl shadow-2xs"
                  >
                    حفظ الرمز الجديد
                  </button>
                </div>
              </form>
            )}

            {pinFeedback && (
              <p className="text-xs font-bold text-[#059669] bg-[#ECFDF5] p-2 rounded-xl border border-[#A7F3D0]">
                {pinFeedback}
              </p>
            )}
          </div>

          {/* Official Instagram Account Card */}
          <div className="rounded-2xl border border-[#F8D7DA] bg-gradient-to-r from-[#FFF5F5] via-[#FFF8F0] to-[#FAF5EC] p-3.5 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white shadow-xs shrink-0">
                <Instagram className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black text-[#4A2E1B] flex items-center gap-1.5">
                  <span>حساب الإنستغرام:</span>
                  <span className="font-mono dir-ltr text-[#A06938] font-bold">
                    {PLATFORM_INSTAGRAM_HANDLE}
                  </span>
                </div>
                <div className="text-[10px] text-[#7D6752]">
                  متابعة وتغطية أنشطة وفعاليات مادة الرياضة المدرسية
                </div>
              </div>
            </div>

            <a
              href={PLATFORM_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white font-bold text-xs shadow-2xs hover:opacity-95 flex items-center gap-1.5 transition-transform hover:scale-105"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>زيارة الحساب مباشرة ↗</span>
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF7F2] p-4 border-t border-[#E8DDD0] flex items-center justify-between">
          <span className="text-[11px] text-[#7D6752]">
            مدرسة عائشة بنت عثمان (1–12) · منصة الرياضة المدرسية التفاعلية
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4A2E1B] hover:bg-[#382012] text-white shadow-xs transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
