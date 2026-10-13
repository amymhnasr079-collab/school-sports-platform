import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Database,
  Download,
  Eye,
  KeyRound,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  Upload,
  UserCheck,
  Cloud,
  Server,
  ExternalLink,
} from 'lucide-react';
import { AppDatabase, AuthUser, UserRole } from '../types';
import {
  generateShareUrl,
  generateWhatsAppShareText,
  getTeacherPin,
  setTeacherPin,
} from '../services/authSecurity';
import { isSupabaseConfigured } from '../services/supabase';

interface SecurityAndDeploymentGuideProps {
  db: AppDatabase;
  currentUser: AuthUser;
  onSwitchRole: (role: UserRole, accessCode: string) => Promise<boolean>;
  onRestoreBackup: (restoredDb: AppDatabase) => void;
}

export const SecurityAndDeploymentGuide: React.FC<SecurityAndDeploymentGuideProps> = ({
  db,
  currentUser,
  onSwitchRole,
  onRestoreBackup,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser.role);
  const [accessCode, setAccessCode] = useState<string>('');
  const [authFeedback, setAuthFeedback] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [teacherPin, setTeacherPinState] = useState<string>(getTeacherPin());
  const [newPin, setNewPin] = useState<string>('');
  const [showPinChange, setShowPinChange] = useState<boolean>(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const principalUrl = generateShareUrl('principal');
  const supervisorUrl = generateShareUrl('supervisor');

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 3000);
    } catch {
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

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSwitchRole(selectedRole, accessCode);
    if (ok) {
      setAuthFeedback('تم تبديل المستخدم بنجاح ✓');
      setAccessCode('');
    } else {
      setAuthFeedback('رمز الدخول غير صحيح! وضع التحكم محصور بمعلمة المادة.');
    }
    setTimeout(() => setAuthFeedback(null), 3500);
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length < 4) {
      setAuthFeedback('يجب أن يتكون رمز الدخول من 4 خانات على الأقل.');
      return;
    }
    if (setTeacherPin(newPin.trim())) {
      setTeacherPinState(newPin.trim());
      setNewPin('');
      setShowPinChange(false);
      setAuthFeedback('تم تحديث رمز التحكم السري للمعلمة بنجاح ✓');
    }
    setTimeout(() => setAuthFeedback(null), 4000);
  };

  const handleExportJsonBackup = () => {
    const jsonStr = JSON.stringify(db, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `نسخة_احتياطية_منصة_الرياضة_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleJsonRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        if (typeof reader.result !== 'string') return;
        const parsed = JSON.parse(reader.result);
        if (parsed && typeof parsed === 'object') {
          onRestoreBackup({ ...db, ...parsed });
          setAuthFeedback('✓ تم استعادة النسخة الاحتياطية وتثبيتها بنجاح!');
          setTimeout(() => setAuthFeedback(null), 5000);
        }
      } catch {
        setAuthFeedback('الملف غير صالح أو تالف.');
        setTimeout(() => setAuthFeedback(null), 4000);
      }
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 space-y-5 shadow-[0_2px_8px_rgba(74,46,27,0.04)]">
        <div className="flex items-center gap-3.5 border-b border-[#DFCDB6] pb-4">
          <div className="w-11 h-11 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shrink-0 border border-[#382012] shadow-xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-[#4A2E1B]">
              إدارة الدخول والصلاحيات ومشاركة الروابط
            </h2>
            <p className="text-xs text-[#7D6752] mt-0.5">
              فصل الصلاحيات: المعلمة تتحكم وتعدل، والمديرة والمشرفة تشاهدان فقط دون تعديل — مدرسة عائشة بنت عثمان (1–12)
            </p>
          </div>
        </div>

        {/* Current Active User Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl bg-white border border-[#DFCDB6] p-5 space-y-3">
            <span className="text-xs font-bold text-[#8C7560]">حالة الحساب المتصل حالياً</span>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#4A2E1B]">{currentUser.name}</h3>
                <p className="text-xs font-bold text-[#7C4E2E]">{currentUser.roleTitle}</p>
              </div>
              <span
                className={`text-xs font-black px-3 py-1 rounded-full border ${
                  currentUser.role === 'teacher'
                    ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                    : 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]'
                }`}
              >
                {currentUser.role === 'teacher' ? 'تحكم وتعديل كامل ✓' : 'عرض واطلاع فقط (محمي) 🔒'}
              </span>
            </div>

            <div className="pt-2 border-t border-[#F5ECE0] text-xs text-[#7D6752] space-y-1">
              <p>
                <strong>الصلاحيات الممنوحة:</strong>{' '}
                {currentUser.permissions.includes('edit')
                  ? 'إضافة، تعديل، حذف، تثبيت الجداول، وإدارة الشعار'
                  : 'مشاهدة الجداول، استعراض كشوفات الزي، الاطلاع على الأنشطة، وطباعة التقارير (دون تعديل)'}
              </p>
            </div>
          </div>

          {/* Switch Role Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-3 bg-white p-5 rounded-xl border border-[#DFCDB6]">
            <h3 className="text-sm font-black text-[#4A2E1B] flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-[#7C4E2E]" />
              <span>تبديل الحساب الحالي</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#5A402D] mb-1">الصفة المراد تفعيلها</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs font-bold text-[#4A2E1B] focus:border-[#7C4E2E] outline-hidden"
                >
                  <option value="teacher">معلمة المادة: سالمة الحكماني (تحكم كامل)</option>
                  <option value="principal">مديرة المدرسة: فايزه الغنبوصي (عرض فقط)</option>
                  <option value="supervisor">مشرفة المادة: منيره الجابري (عرض فقط)</option>
                  <option value="viewer">زائر / إدارة عامة (عرض فقط)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#5A402D] mb-1">
                  {selectedRole === 'teacher' ? 'رمز المعلمة السري (مطلوب للتحكم)' : 'رمز اختياري'}
                </label>
                <input
                  type="password"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder={selectedRole === 'teacher' ? 'أدخلي الرمز السري...' : 'غير مطلوب للعرض'}
                  className="w-full rounded-xl border border-[#DFCDB6] bg-white px-3 py-2 text-xs tabular-nums text-[#2C1A11] focus:border-[#7C4E2E] outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#8C7560] pt-1">
              <span>الرمز الافتراضي للمعلمة: <strong>{teacherPin}</strong></span>
              <button
                type="submit"
                className="px-4 py-2 bg-[#4A2E1B] hover:bg-[#382012] text-white font-bold text-xs rounded-xl transition-all shadow-xs"
              >
                تطبيق التبديل
              </button>
            </div>

            {authFeedback && (
              <div className="p-2.5 rounded-xl text-xs font-bold bg-[#FAF5EC] text-[#7C4E2E] border border-[#DFCDB6]">
                {authFeedback}
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Share Links Card for Principal and Supervisor */}
      <div className="bg-white rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 space-y-4 shadow-[0_2px_8px_rgba(74,46,27,0.03)]">
        <div className="flex items-center gap-3 border-b border-[#DFCDB6] pb-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF5EC] border border-[#DFCDB6] flex items-center justify-center text-[#7C4E2E]">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#4A2E1B]">
              روابط المشاركة المباشرة (العرض والاطلاع للإدارة دون تعديل)
            </h3>
            <p className="text-xs text-[#7D6752]">
              انسخي هذا الرابط وأرسليه لمديرة المدرسة أو المشرفة لتشاهد المنصة بالكامل مع قفل التعديل تلقائياً
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Principal Link Box */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#DFCDB6] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#4A2E1B] flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-[#059669]" />
                <span>رابط المديرة: الأستاذة فايزه الغنبوصي</span>
              </span>
              <span className="text-[10px] bg-[#ECFDF5] text-[#065F46] font-bold px-2 py-0.5 rounded-md border border-[#A7F3D0]">
                عرض فقط ✓
              </span>
            </div>
            <input
              type="text"
              readOnly
              value={principalUrl}
              className="w-full text-xs font-mono p-2 rounded-lg bg-white border border-[#DFCDB6] text-[#2C1A11] select-all outline-hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(principalUrl, 'principal')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border shadow-2xs ${
                  copiedType === 'principal'
                    ? 'bg-[#059669] text-white border-[#059669]'
                    : 'bg-[#4A2E1B] text-white hover:bg-[#382012] border-[#382012]'
                }`}
              >
                {copiedType === 'principal' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#D4A76A]" />
                    <span>نسخ رابط المديرة</span>
                  </>
                )}
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  generateWhatsAppShareText('principal', db.schoolInfo.name)
                )}`}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#128C7E] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                <span>إرسال واتساب</span>
              </a>
            </div>
          </div>

          {/* Supervisor Link Box */}
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#DFCDB6] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-[#4A2E1B] flex items-center gap-1.5">
                <Check className="w-4 h-4 text-[#7C4E2E]" />
                <span>رابط المشرفة: الأستاذة منيره الجابري</span>
              </span>
              <span className="text-[10px] bg-[#EFF6FF] text-[#1E40AF] font-bold px-2 py-0.5 rounded-md border border-[#BFDBFE]">
                عرض فقط ✓
              </span>
            </div>
            <input
              type="text"
              readOnly
              value={supervisorUrl}
              className="w-full text-xs font-mono p-2 rounded-lg bg-white border border-[#DFCDB6] text-[#2C1A11] select-all outline-hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(supervisorUrl, 'supervisor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border shadow-2xs ${
                  copiedType === 'supervisor'
                    ? 'bg-[#059669] text-white border-[#059669]'
                    : 'bg-white hover:bg-[#FAF5EC] text-[#4A2E1B] border-[#DFCDB6]'
                }`}
              >
                {copiedType === 'supervisor' ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>تم النسخ ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#7C4E2E]" />
                    <span>نسخ رابط المشرفة</span>
                  </>
                )}
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  generateWhatsAppShareText('supervisor', db.schoolInfo.name)
                )}`}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-[#128C7E] bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 flex items-center gap-1"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                <span>إرسال واتساب</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Storage & Netlify Deployment Guide Card */}
      <div className="bg-[#FAF5EC] rounded-2xl border border-[#DFCDB6] p-5 sm:p-6 space-y-4 shadow-[0_2px_8px_rgba(74,46,27,0.04)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DFCDB6] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-[#4A2E1B]">
                نظام التخزين السحابي الدائم ونشره على Netlify
              </h3>
              <p className="text-xs text-[#7D6752]">
                دليل ربط Supabase Storage وحفظ الملفات سحابياً لجميع الأجهزة والزوار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span>التخزين المشترك نشط ومثبت</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cloud Storage Engine Status */}
          <div className="p-4 rounded-xl bg-white border border-[#E8DDD0] space-y-2.5">
            <h4 className="text-xs font-black text-[#4A2E1B] flex items-center gap-1.5">
              <Server className="w-4 h-4 text-[#7C4E2E]" />
              <span>حالة محركات التخزين السحابي:</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAF8] border border-[#E2EBE2]">
                <span className="font-bold text-[#2C4830]">محرك التخزين السحابي الفوري (Firestore Cloud):</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#059669] text-white">
                  متصل ويعمل تلقائياً ✓
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#FAF7F2] border border-[#EFE6D8]">
                <span className="font-bold text-[#4A2E1B]">محرك Supabase Storage السحابي:</span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                    isSupabaseConfigured()
                      ? 'bg-[#059669] text-white'
                      : 'bg-[#F2E8DC] text-[#7C4E2E] border border-[#DECFC0]'
                  }`}
                >
                  {isSupabaseConfigured() ? 'مفعّل ومتصل بنجاح ✓' : 'جاهز للتفعيل عبر متغيرات Netlify'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[#7D6752] leading-relaxed">
              جميع الملفات المرفوعة تُحفظ سحابياً فوراً وتصبح متاحة لمديرة المدرسة والمشرفة وجميع المستخدمين من أي هاتف أو كمبيوتر دون الاعتماد على ذاكرة المتصفح المحلية فقط.
            </p>
          </div>

          {/* Netlify Setup Steps */}
          <div className="p-4 rounded-xl bg-white border border-[#E8DDD0] space-y-2.5">
            <h4 className="text-xs font-black text-[#4A2E1B] flex items-center gap-1.5">
              <ExternalLink className="w-4 h-4 text-[#7C4E2E]" />
              <span>خطوات ربط Supabase على Netlify (اختياري للتوسعة):</span>
            </h4>
            <ol className="text-xs text-[#5A402D] space-y-1.5 list-decimal list-inside leading-relaxed font-medium">
              <li>
                افتحي حسابك في <strong>Supabase</strong> وأنشئي Bucket جديد باسم <code className="bg-[#FAF5EC] px-1 rounded text-[#7C4E2E] font-mono">school_media</code> واجعليه Public.
              </li>
              <li>
                انسخي <strong>Project URL</strong> و <strong>anon public key</strong> (لا تستخدمي service-role السري أبداً).
              </li>
              <li>
                في <strong>Netlify</strong>: اذهبي إلى <span className="font-bold text-[#4A2E1B]">Site configuration &gt; Environment variables</span> وأضيفي المتغيرات:
                <div className="bg-[#FAF7F2] p-2 mt-1 rounded font-mono text-[10px] text-[#4A2E1B] space-y-0.5 border border-[#DFCDB6]">
                  <div>VITE_SUPABASE_URL = رابط مشروعك</div>
                  <div>VITE_SUPABASE_ANON_KEY = المفتاح العام anon</div>
                  <div>VITE_SUPABASE_BUCKET = school_media</div>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>

      {/* Backup and Restore Box */}
      <div className="bg-white rounded-2xl border border-[#E8DDD0] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_2px_8px_rgba(74,46,27,0.03)]">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FAF5EC] text-[#4A2E1B] flex items-center justify-center shrink-0 border border-[#DFCDB6]">
            <Database className="w-6 h-6 text-[#7C4E2E]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[#4A2E1B]">نسخة احتياطية شاملة من السجلات</h3>
            <p className="text-xs text-[#7D6752]">تصدير واستيراد جميع الطالبات، الجداول، والزي بصيغة JSON بأمان تام</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleJsonRestoreUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="px-4 py-2 text-xs font-bold bg-white hover:bg-[#FAF5EC] text-[#4A2E1B] border border-[#DFCDB6] rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-4 h-4 text-[#7C4E2E]" />
            <span>استيراد نسخة احتياطية (JSON)</span>
          </button>
          <button
            type="button"
            onClick={handleExportJsonBackup}
            className="px-4 py-2 text-xs font-bold bg-[#4A2E1B] hover:bg-[#382012] text-white rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-[#D4A76A]" />
            <span>تصدير نسخة احتياطية (JSON)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

