import { UserRole } from '../types';

export const TEACHER_DEFAULT_PIN = '1234';
export const PRINCIPAL_ACCESS_CODE = '2026';
export const SUPERVISOR_ACCESS_CODE = '2026';

const TEACHER_PIN_STORAGE_KEY = 'aisha_teacher_secret_pin_v1';
const AUTH_ROLE_STORAGE_KEY = 'aisha_active_user_role_v1';

export function getTeacherPin(): string {
  try {
    const saved = localStorage.getItem(TEACHER_PIN_STORAGE_KEY);
    if (saved && saved.trim().length >= 4) {
      return saved.trim();
    }
  } catch {
    // fallback
  }
  return TEACHER_DEFAULT_PIN;
}

export function setTeacherPin(newPin: string): boolean {
  if (!newPin || newPin.trim().length < 4) return false;
  try {
    localStorage.setItem(TEACHER_PIN_STORAGE_KEY, newPin.trim());
    return true;
  } catch {
    return false;
  }
}

export function verifyTeacherPin(inputPin: string): boolean {
  const currentPin = getTeacherPin();
  const trimmed = inputPin.trim();
  // Allow custom pin or default 1234 as emergency recovery
  return trimmed === currentPin || trimmed === TEACHER_DEFAULT_PIN;
}

export function getInitialRoleFromEnvironment(): UserRole {
  try {
    // 1. Check URL parameters first (e.g. ?role=principal or ?role=supervisor or ?view=1)
    if (typeof window !== 'undefined' && window.location) {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get('role')?.toLowerCase();
      const viewParam = params.get('view') || params.get('mode');

      if (roleParam === 'principal') return 'principal';
      if (roleParam === 'supervisor') return 'supervisor';
      if (roleParam === 'viewer' || roleParam === 'view' || viewParam === '1' || viewParam === 'view') {
        return 'principal'; // default view-only share to principal for convenience
      }
    }

    // 2. Check session storage for an already selected role in this browser tab
    const sessionRole = sessionStorage.getItem(AUTH_ROLE_STORAGE_KEY);
    if (sessionRole === 'principal' || sessionRole === 'supervisor' || sessionRole === 'viewer') {
      return sessionRole as UserRole;
    }
    if (sessionRole === 'teacher') {
      return 'teacher';
    }

    // 3. Check if this machine is saved as teacher
    const isTeacherMachine = localStorage.getItem('aisha_teacher_authenticated');
    if (isTeacherMachine === 'true') {
      return 'teacher';
    }
  } catch {
    // fallback
  }

  // Default to teacher on teacher's environment
  return 'teacher';
}

export function saveActiveRoleToSession(role: UserRole) {
  try {
    sessionStorage.setItem(AUTH_ROLE_STORAGE_KEY, role);
    if (role === 'teacher') {
      localStorage.setItem('aisha_teacher_authenticated', 'true');
    }
  } catch {
    // ignore
  }
}

export function generateShareUrl(role: 'principal' | 'supervisor' | 'viewer'): string {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const pathname = window.location.pathname;
  return `${origin}${pathname}?role=${role}&view=1`;
}

export function generateWhatsAppShareText(
  role: 'principal' | 'supervisor' | 'viewer',
  schoolName: string
): string {
  const url = generateShareUrl(role);
  if (role === 'principal') {
    return `السلام عليكم ورحمة الله وبركاته،\nالفاضلة مديرة المدرسة الأستاذة فايزه الغنبوصي،\nمرفق رابط منصة الرياضة المدرسية التفاعلية (طاقة وانطلاقة) بـ ${schoolName} للاطلاع والمتابعة الأكاديمية (وضع العرض فقط):\n${url}`;
  }
  if (role === 'supervisor') {
    return `السلام عليكم ورحمة الله وبركاته،\nالفاضلة مشرفة المادة الأستاذة منيره الجابري،\nمرفق رابط منصة الرياضة المدرسية التفاعلية (طاقة وانطلاقة) بـ ${schoolName} للاطلاع والمتابعة الإشرافية (وضع العرض فقط):\n${url}`;
  }
  return `رابط منصة الرياضة المدرسية التفاعلية (طاقة وانطلاقة) بـ ${schoolName} (للعرض والاطلاع):\n${url}`;
}
