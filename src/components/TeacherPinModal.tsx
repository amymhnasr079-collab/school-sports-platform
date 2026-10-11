import React, { useState } from 'react';
import { KeyRound, Lock, ShieldCheck, X } from 'lucide-react';
import { verifyTeacherPin } from '../services/authSecurity';

interface TeacherPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TeacherPinModal: React.FC<TeacherPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyTeacherPin(pin)) {
      setErrorMsg(null);
      setPin('');
      onSuccess();
    } else {
      setErrorMsg('رمز الدخول غير صحيح. التحكم والتعديل محصور بمعلمة المادة فقط.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      dir="rtl"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#DFCDB6] overflow-hidden">
        {/* Header */}
        <div className="bg-[#4A2E1B] text-white p-5 flex items-center justify-between border-b border-[#382012]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#D4A76A]/20 text-[#D4A76A] border border-[#D4A76A]/40 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                دخول معلمة الرياضة المدرسية
              </h3>
              <p className="text-[11px] text-[#F5ECE0]">
                التحكم الكامل وتعديل السجلات وحفظ الجداول
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/70 hover:text-white rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-xs text-[#6C533D] leading-relaxed">
            المنصة حالياً في <strong>وضع العرض والاطلاع</strong>. للتبديل إلى حساب المعلمة (الأستاذة سالمة الحكماني) للتحكم وإضافة السجلات، يُرجى إدخال الرمز السري الخاص بكِ:
          </p>

          <div>
            <label className="block text-xs font-black text-[#4A2E1B] mb-1.5">
              رمز التحكم السري:
            </label>
            <div className="relative">
              <input
                type="password"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setErrorMsg(null);
                }}
                autoFocus
                placeholder="أدخلي الرمز..."
                className="w-full rounded-2xl border border-[#DFCDB6] bg-[#FAF7F2] px-4 py-3 text-sm text-[#2C1A11] font-mono tracking-widest text-center focus:border-[#7C4E2E] focus:bg-white outline-hidden shadow-inner"
              />
              <Lock className="w-4 h-4 text-[#A06938] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <span className="block text-[10px] text-[#7D6752] mt-1 text-center">
              (الرمز الافتراضي: 1234)
            </span>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl text-xs font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] text-center">
              {errorMsg}
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#7D6752] hover:text-[#4A2E1B] rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-black rounded-xl shadow-xs transition-colors"
            >
              تأكيد الدخول وتفعيل التعديل ✓
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
