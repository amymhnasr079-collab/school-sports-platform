import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  Award,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Cloud,
  FileCheck,
  Home,
  ShieldCheck,
  Sparkles,
  Users,
  Eye,
  KeyRound,
  Lock,
  Share2,
  Dices,
  Instagram,
  ExternalLink,
  Palette,
  Type,
  Check,
  X,
} from 'lucide-react';
import {
  ActiveTab,
  ActivityRecord,
  AppDatabase,
  AuthUser,
  AwardedSticker,
  MediaItem,
  MotivationalSticker,
  ParticipationLog,
  ScheduleSlot,
  SchoolSchedule,
  Student,
  UniformLog,
  UserRole,
} from './types';
import { DashboardHome } from './components/DashboardHome';
import { UniformTracker } from './components/UniformTracker';
import { ParticipationTracker } from './components/ParticipationTracker';
import { ClassroomTools } from './components/ClassroomTools';
import { ActivitiesTracker } from './components/ActivitiesTracker';
import { SchoolScheduleView } from './components/SchoolScheduleView';
import { StickersLibrary } from './components/StickersLibrary';
import { ReportsDashboard } from './components/ReportsDashboard';
import { StudentsManager } from './components/StudentsManager';
import { SecurityAndDeploymentGuide } from './components/SecurityAndDeploymentGuide';
import { SchoolLogoView } from './components/OfficialSchoolEmblem';
import { SharePlatformModal } from './components/SharePlatformModal';
import { TeacherPinModal } from './components/TeacherPinModal';
import { PinnedInstagramBadge } from './components/PinnedInstagramBadge';
import {
  HeaderFontFamily,
  SportsBackdropIntensity,
  SportsEquipmentBackdrop,
  HEADER_FONT_OPTIONS,
} from './components/SportsEquipmentBackdrop';
import {
  getInitialRoleFromEnvironment,
  saveActiveRoleToSession,
  verifyTeacherPin,
} from './services/authSecurity';
import {
  saveCloudDatabase,
  subscribeToCloudDatabase,
  fetchCloudDatabase,
  testConnection,
  saveCloudSchedule,
  fetchCloudSchedule,
} from './services/firebase';
import { PLATFORM_INSTAGRAM_URL, PLATFORM_INSTAGRAM_HANDLE } from './constants';

const PRIMARY_STORAGE_KEY = 'aisha_school_sports_platform_beige_v1';
export const PERMANENT_SCHEDULE_KEY = 'aisha_permanent_school_schedule_v1';
export const PERMANENT_SCHEDULE_BACKUP_KEY = 'aisha_permanent_schedule_backup_master';
export const PERMANENT_SCHOOL_INFO_KEY = 'aisha_permanent_school_info_v1';
export const PERMANENT_SCHOOL_LOGO_KEY = 'aisha_permanent_school_logo_v1';

const SCHEDULE_STORAGE_KEYS = [
  'aisha_permanent_school_schedule_v1',
  'aisha_permanent_schedule_backup_master',
  'aisha_school_schedule_master',
  'aisha_schedule_v1',
  'school_schedule_v1',
  'school_schedule',
];

const LEGACY_STORAGE_KEYS = [
  'aisha_school_sports_platform_beige_v1',
  'aisha_school_sports_platform_v1',
  'aisha_school_sports_platform',
  'aisha_sports_platform_v1',
  'aisha_sports_db',
  'school_sports_platform_v1',
  'school_sports_platform',
  'aisha_sports_permanent_students_v1',
  'aisha_students_roster_master',
  'aisha_school_students',
  'aisha_permanent_school_schedule_v1',
  'aisha_permanent_schedule_backup_master',
  'aisha_permanent_school_info_v1',
  'aisha_permanent_school_logo_v1',
];

export function recoverStudentsFromAllStorages(currentLoadedDb?: AppDatabase): {
  recoveredDb: AppDatabase;
  recoveredCount: number;
} {
  let db: AppDatabase = currentLoadedDb ? { ...currentLoadedDb } : { ...INITIAL_FALLBACK_DB };
  const baseCount = db.students?.length || 0;
  const studentMap = new Map<string, Student>();

  // Add existing students
  if (Array.isArray(db.students)) {
    for (const s of db.students) {
      if (s && s.name && s.name.trim()) {
        const key = `${s.name.trim()}-${s.grade}-${s.section}`;
        studentMap.set(key, s);
      }
    }
  }

  // 0. Dedicated Permanent School Info & Logo Recovery
  try {
    const rawLogo = localStorage.getItem(PERMANENT_SCHOOL_LOGO_KEY);
    if (rawLogo && rawLogo.length > 20) {
      db.schoolInfo.logoDataUrl = rawLogo;
      db.schoolInfo.isLogoPinned = true;
    }
    const rawInfo = localStorage.getItem(PERMANENT_SCHOOL_INFO_KEY);
    if (rawInfo) {
      const pInfo = JSON.parse(rawInfo);
      if (pInfo && typeof pInfo === 'object') {
        db.schoolInfo = {
          ...db.schoolInfo,
          ...pInfo,
          logoDataUrl: rawLogo || pInfo.logoDataUrl || db.schoolInfo.logoDataUrl,
          isLogoPinned: true,
        };
      }
    }
  } catch {
    // ignore
  }

  // 0. Dedicated Permanent School Schedule Recovery
  for (const sk of SCHEDULE_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(sk);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const candidateSlots = Array.isArray(parsed.slots)
          ? parsed.slots
          : Array.isArray(parsed)
          ? parsed
          : [];
        if (candidateSlots.length > (db.schedule?.slots?.length || 0)) {
          db.schedule = {
            slots: candidateSlots,
            scheduleImageDataUrl:
              parsed.scheduleImageDataUrl || db.schedule?.scheduleImageDataUrl || null,
            generalNotes: parsed.generalNotes || db.schedule?.generalNotes || '',
          };
        }
      }
    } catch {
      // ignore
    }
  }

  // 1. Scan known storage keys
  for (const k of LEGACY_STORAGE_KEYS) {
    try {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        if (Array.isArray(parsed.students)) {
          for (const s of parsed.students) {
            if (s && s.name && s.name.trim()) {
              const key = `${s.name.trim()}-${s.grade}-${s.section}`;
              if (!studentMap.has(key)) {
                studentMap.set(key, s);
              }
            }
          }
        }
        if (
          parsed.schedule &&
          typeof parsed.schedule === 'object' &&
          Array.isArray(parsed.schedule.slots) &&
          parsed.schedule.slots.length > (db.schedule?.slots?.length || 0)
        ) {
          db.schedule = {
            slots: parsed.schedule.slots,
            scheduleImageDataUrl:
              parsed.schedule.scheduleImageDataUrl || db.schedule?.scheduleImageDataUrl || null,
            generalNotes: parsed.schedule.generalNotes || db.schedule?.generalNotes || '',
          };
        }
        if (Array.isArray(parsed.uniformLogs) && parsed.uniformLogs.length > (db.uniformLogs?.length || 0)) {
          db.uniformLogs = parsed.uniformLogs;
        }
        if (Array.isArray(parsed.participationLogs) && parsed.participationLogs.length > (db.participationLogs?.length || 0)) {
          db.participationLogs = parsed.participationLogs;
        }
        if (Array.isArray(parsed.activities) && parsed.activities.length > (db.activities?.length || 0)) {
          db.activities = parsed.activities;
        }
        if (Array.isArray(parsed.awardedStickers) && parsed.awardedStickers.length > (db.awardedStickers?.length || 0)) {
          db.awardedStickers = parsed.awardedStickers;
        }
        if (Array.isArray(parsed.mediaItems) && parsed.mediaItems.length > (db.mediaItems?.length || 0)) {
          db.mediaItems = parsed.mediaItems;
        }
      } else if (Array.isArray(parsed)) {
        for (const s of parsed) {
          if (s && s.name && s.name.trim() && s.grade) {
            const key = `${s.name.trim()}-${s.grade}-${s.section}`;
            if (!studentMap.has(key)) {
              studentMap.set(key, s);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Scan ALL remaining keys in localStorage
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || LEGACY_STORAGE_KEYS.includes(k) || SCHEDULE_STORAGE_KEYS.includes(k)) continue;
      try {
        const val = localStorage.getItem(k);
        if (!val || val.length < 10) continue;

        // Check for schedule in arbitrary keys
        if (val.includes('slots') || val.includes('schedule') || val.includes('الجدول') || val.includes('الحصة')) {
          try {
            const p = JSON.parse(val);
            if (p && typeof p === 'object') {
              if (p.schedule && Array.isArray(p.schedule.slots) && p.schedule.slots.length > (db.schedule?.slots?.length || 0)) {
                db.schedule = p.schedule;
              } else if (Array.isArray(p.slots) && p.slots.length > (db.schedule?.slots?.length || 0)) {
                db.schedule = {
                  slots: p.slots,
                  scheduleImageDataUrl: p.scheduleImageDataUrl || db.schedule?.scheduleImageDataUrl || null,
                  generalNotes: p.generalNotes || db.schedule?.generalNotes || '',
                };
              }
            }
          } catch {
            // ignore
          }
        }

        if (val.includes('name') || val.includes('student') || val.includes('طالبة') || val.includes('الصف')) {
          const parsed = JSON.parse(val);
          if (parsed && Array.isArray(parsed.students)) {
            for (const s of parsed.students) {
              if (s && s.name && s.name.trim()) {
                const key = `${s.name.trim()}-${s.grade}-${s.section}`;
                if (!studentMap.has(key)) {
                  studentMap.set(key, s);
                }
              }
            }
          } else if (Array.isArray(parsed)) {
            for (const s of parsed) {
              if (s && s.name && s.name.trim() && s.grade) {
                const key = `${s.name.trim()}-${s.grade}-${s.section}`;
                if (!studentMap.has(key)) {
                  studentMap.set(key, s);
                }
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  // 3. Scan sessionStorage as well
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!k) continue;
      try {
        const val = sessionStorage.getItem(k);
        if (!val || val.length < 10) continue;
        const parsed = JSON.parse(val);
        if (parsed && typeof parsed === 'object') {
          if (
            parsed.schedule &&
            Array.isArray(parsed.schedule.slots) &&
            parsed.schedule.slots.length > (db.schedule?.slots?.length || 0)
          ) {
            db.schedule = parsed.schedule;
          }
          if (Array.isArray(parsed.students)) {
            for (const s of parsed.students) {
              if (s && s.name && s.name.trim()) {
                const key = `${s.name.trim()}-${s.grade}-${s.section}`;
                if (!studentMap.has(key)) {
                  studentMap.set(key, s);
                }
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }

  // 4. Extract from awardedStickers (which stores studentName, grade, section)
  if (Array.isArray(db.awardedStickers)) {
    for (const awd of db.awardedStickers) {
      if (awd && awd.studentName && awd.studentName.trim() && awd.studentName !== 'طالبة متميزة') {
        const key = `${awd.studentName.trim()}-${awd.grade}-${awd.section}`;
        if (!studentMap.has(key)) {
          studentMap.set(key, {
            id: awd.studentId || `st-awd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: awd.studentName.trim(),
            grade: awd.grade || 5,
            section: awd.section || '1',
            createdAt: awd.date || new Date().toISOString(),
          });
        }
      }
    }
  }

  const finalStudents = Array.from(studentMap.values());
  db.students = finalStudents;

  return {
    recoveredDb: db,
    recoveredCount: Math.max(0, finalStudents.length - baseCount),
  };
}

const INITIAL_FALLBACK_DB: AppDatabase = {
  schoolInfo: {
    name: 'مدرسة عائشة بنت عثمان للتعليم الأساسي (1–12)',
    gradesRange: 'الصفوف 1–12',
    teacherName: 'الأستاذة سالمة الحكماني',
    principalName: 'الأستاذة فايزه الغنبوصي',
    supervisorName: 'الأستاذة منيره الجابري',
    logoDataUrl: null,
    academicYear: '2026 / 2027 م',
    motivationalBanner: 'الرياضة المدرسية طاقة، انضباط، وروح فريق تصنع التميز كل يوم!',
  },
  students: [],
  uniformLogs: [],
  participationLogs: [],
  activities: [],
  schedule: {
    slots: [],
    scheduleImageDataUrl: null,
    generalNotes:
      'ملاحظة: أوقات الحصص متروكة فارغة ليتم إدخال التوقيت الرسمي المعتمد للمدرسة من قبل المعلمة.',
  },
  stickers: [
    {
      id: 'stk-1',
      title: 'نجمة الالتزام',
      phrase: 'تألقكِ بالزي الرياضي الكامل يعكس انضباطكِ واستعدادكِ الرائع للحصة!',
      iconType: 'star',
      colorTheme: 'turquoise',
    },
    {
      id: 'stk-2',
      title: 'بطلة المشاركة',
      phrase: 'حضوركِ الفاعل وحماسكِ في الحصة يصنعان فارقًا جميلًا في الملعب!',
      iconType: 'trophy',
      colorTheme: 'orange',
    },
    {
      id: 'stk-3',
      title: 'روح الفريق',
      phrase: 'تعاونكِ وتشجيعكِ لزميلاتكِ يجسدان أسمى معاني الأخلاق الرياضية!',
      iconType: 'team',
      colorTheme: 'blue',
    },
    {
      id: 'stk-4',
      title: 'قائدة الملعب',
      phrase: 'مبادرتكِ المتميزة وقدرتكِ على التنظيم والقيادة مصدر فخر لنا!',
      iconType: 'leader',
      colorTheme: 'purple',
    },
    {
      id: 'stk-5',
      title: 'نجمة التعاون',
      phrase: 'العمل الجماعي يزداد جمالًا ونجاحًا بوجود طالبة متعاونة مثلكِ!',
      iconType: 'coop',
      colorTheme: 'turquoise',
    },
    {
      id: 'stk-6',
      title: 'مبدعة الرياضة',
      phrase: 'إتقانكِ للمهارات الحركية والرياضية يبرهن على موهبتكِ العالية!',
      iconType: 'creative',
      colorTheme: 'purple',
    },
    {
      id: 'stk-7',
      title: 'طاقة إيجابية',
      phrase: 'ابتسامتكِ ونشاطكِ المستمر يملآن حصة الرياضة حيوية وتفاؤلًا!',
      iconType: 'energy',
      colorTheme: 'orange',
    },
    {
      id: 'stk-8',
      title: 'إنجاز يستحق الفخر',
      phrase: 'تقدمكِ المستمر وإصراركِ على التطور يستحقان كل التقدير والاعتزاز!',
      iconType: 'pride',
      colorTheme: 'blue',
    },
  ],
  awardedStickers: [],
  mediaItems: [
    {
      id: 'media-seed-1',
      title: 'عرض تقديمي: مهارات كرة السلة والتمرير الصدري',
      category: 'presentation',
      gradeRange: 'الصفوف 5–9',
      url: 'https://docs.google.com/presentation/d/e/2PACX-1vT1c6Qh/embed',
      description: 'عرض تفاعلي شامل يوضح الخطوات الفنية للتمرير الصدري في كرة السلة والأخطاء الشائعة أثناء الأداء.',
      fileType: 'powerpoint',
      fileName: 'عرض_مهارات_كرة_السلة_والتمرير_الصدري.pptx',
      fileSizeFormatted: '4.8 ميجابايت',
      createdAt: '2026-10-10',
      addedBy: 'الأستاذة سالمة الحكماني',
      sourceType: 'device',
      isCloudStored: true,
    },
    {
      id: 'media-seed-2',
      title: 'فيديو تعليمي: مهارات التوافق الحركي والرشاقة في الجمباز المدرسي',
      category: 'video',
      gradeRange: 'الصفوف 1–4',
      url: 'https://www.youtube.com/watch?v=n4pGqYQZqK4',
      description: 'فيديو تطبيقي وتمارين إحمائية لتطوير التوازن والرشاقة والتوافق العضلي العصبي لدى طالبات الحلقة الأولى.',
      fileType: 'youtube',
      createdAt: '2026-10-11',
      addedBy: 'الأستاذة سالمة الحكماني',
      sourceType: 'url',
      isCloudStored: true,
    },
    {
      id: 'media-seed-3',
      title: 'فيديو وقوانين: تحكيم الكرة الطائرة المدرسية وتخطيط الملعب',
      category: 'rules',
      gradeRange: 'الصفوف 10–12',
      url: 'https://www.youtube.com/watch?v=3RGLc9UvI4U',
      description: 'دليل مرئي مبسط لقوانين الكرة الطائرة وتوزيع اللاعبات في الملعب وإشارات الحكم الرسمية.',
      fileType: 'video',
      fileName: 'فيديو_شرح_قوانين_الكرة_الطائرة.mp4',
      fileSizeFormatted: '8.2 ميجابايت',
      createdAt: '2026-10-11',
      addedBy: 'الأستاذة سالمة الحكماني',
      sourceType: 'device',
      isCloudStored: true,
    },
    {
      id: 'media-seed-4',
      title: 'دليل المعلمة: خطة درس نموذجي في اللياقة البدنية والسرعة',
      category: 'lesson_plan',
      gradeRange: 'الصفوف 5–9',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      description: 'نموذج تحضير حصة رياضية نموذجية يشتمل على التهيئة البدنية، النشاط التعليمي، والختام.',
      fileType: 'pdf',
      fileName: 'خطة_درس_اللياقة_البدنية_والسرعة.pdf',
      fileSizeFormatted: '1.4 ميجابايت',
      createdAt: '2026-10-12',
      addedBy: 'الأستاذة سالمة الحكماني',
      sourceType: 'device',
      isCloudStored: true,
    },
  ],
};

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [cloudSynced, setCloudSynced] = useState<boolean>(true);
  const [db, setDb] = useState<AppDatabase>(() => {
    try {
      const res = recoverStudentsFromAllStorages();
      return {
        ...INITIAL_FALLBACK_DB,
        ...res.recoveredDb,
        mediaItems: res.recoveredDb.mediaItems?.length ? res.recoveredDb.mediaItems : INITIAL_FALLBACK_DB.mediaItems,
      };
    } catch {
      return INITIAL_FALLBACK_DB;
    }
  });

  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [showFontModal, setShowFontModal] = useState<boolean>(false);

  const [headerFont, setHeaderFont] = useState<HeaderFontFamily>(() => {
    return (localStorage.getItem('platform_header_font') as HeaderFontFamily) || 'changa';
  });

  const [sportsBackdropIntensity, setSportsBackdropIntensity] = useState<SportsBackdropIntensity>(() => {
    return (localStorage.getItem('platform_sports_intensity') as SportsBackdropIntensity) || 'prominent';
  });

  const handleUpdateHeaderFont = useCallback((font: HeaderFontFamily) => {
    setHeaderFont(font);
    localStorage.setItem('platform_header_font', font);
  }, []);

  const handleUpdateSportsIntensity = useCallback((intensity: SportsBackdropIntensity) => {
    setSportsBackdropIntensity(intensity);
    localStorage.setItem('platform_sports_intensity', intensity);
  }, []);

  const headerFontClass = useMemo(() => {
    switch (headerFont) {
      case 'changa':
        return 'font-changa';
      case 'alexandria':
        return 'font-alexandria';
      case 'kufi':
        return 'font-kufi';
      case 'marhey':
        return 'font-marhey';
      case 'cairo':
        return 'font-cairo';
      default:
        return 'font-changa';
    }
  }, [headerFont]);

  const currentFontOption = useMemo(() => {
    return HEADER_FONT_OPTIONS.find((f) => f.id === headerFont) || HEADER_FONT_OPTIONS[0];
  }, [headerFont]);

  const [currentUser, setCurrentUser] = useState<AuthUser>(() => {
    const role = getInitialRoleFromEnvironment();
    if (role === 'principal') {
      return {
        id: 'u-principal',
        name: 'الأستاذة فايزه الغنبوصي',
        roleTitle: 'مديرة المدرسة (عرض واطلاع فقط)',
        role: 'principal',
        permissions: ['view', 'export'],
      };
    }
    if (role === 'supervisor') {
      return {
        id: 'u-supervisor',
        name: 'الأستاذة منيره الجابري',
        roleTitle: 'مشرفة المادة (عرض واطلاع فقط)',
        role: 'supervisor',
        permissions: ['view', 'export'],
      };
    }
    if (role === 'viewer') {
      return {
        id: 'u-viewer',
        name: 'زائر / إدارة عامة',
        roleTitle: 'وضع العرض والاطلاع',
        role: 'viewer',
        permissions: ['view', 'export'],
      };
    }
    return {
      id: 'u-teacher',
      name: 'الأستاذة سالمة الحكماني',
      roleTitle: 'معلمة الرياضة المدرسية',
      role: 'teacher',
      permissions: ['view', 'add', 'edit', 'delete', 'export', 'manage_settings'],
    };
  });

  const switchToTeacher = useCallback(() => {
    const teacherUser: AuthUser = {
      id: 'u-teacher',
      name: 'الأستاذة سالمة الحكماني',
      roleTitle: 'معلمة الرياضة المدرسية',
      role: 'teacher',
      permissions: ['view', 'add', 'edit', 'delete', 'export', 'manage_settings'],
    };
    setCurrentUser(teacherUser);
    saveActiveRoleToSession('teacher');
    setShowPinModal(false);
  }, []);

  const switchToRolePreview = useCallback((role: UserRole) => {
    if (role === 'principal') {
      const user: AuthUser = {
        id: 'u-principal',
        name: 'الأستاذة فايزه الغنبوصي',
        roleTitle: 'مديرة المدرسة (عرض واطلاع فقط)',
        role: 'principal',
        permissions: ['view', 'export'],
      };
      setCurrentUser(user);
      saveActiveRoleToSession('principal');
    } else if (role === 'supervisor') {
      const user: AuthUser = {
        id: 'u-supervisor',
        name: 'الأستاذة منيره الجابري',
        roleTitle: 'مشرفة المادة (عرض واطلاع فقط)',
        role: 'supervisor',
        permissions: ['view', 'export'],
      };
      setCurrentUser(user);
      saveActiveRoleToSession('supervisor');
    } else if (role === 'viewer') {
      const user: AuthUser = {
        id: 'u-viewer',
        name: 'زائر / إدارة عامة',
        roleTitle: 'وضع العرض والاطلاع',
        role: 'viewer',
        permissions: ['view', 'export'],
      };
      setCurrentUser(user);
      saveActiveRoleToSession('viewer');
    }
  }, []);

  const persistDatabase = useCallback((nextDb: AppDatabase) => {
    setDb(nextDb);
    try {
      const json = JSON.stringify(nextDb);
      // 1. Primary key
      localStorage.setItem(PRIMARY_STORAGE_KEY, json);
      // 2. Legacy key sync
      localStorage.setItem('aisha_school_sports_platform_v1', json);
      // 3. Dedicated permanent student roster keys
      localStorage.setItem('aisha_sports_permanent_students_v1', JSON.stringify(nextDb.students));
      localStorage.setItem('aisha_students_roster_master', JSON.stringify(nextDb.students));
      // 4. Dedicated permanent school schedule keys
      if (nextDb.schedule) {
        const scheduleJson = JSON.stringify(nextDb.schedule);
        localStorage.setItem(PERMANENT_SCHEDULE_KEY, scheduleJson);
        localStorage.setItem(PERMANENT_SCHEDULE_BACKUP_KEY, scheduleJson);
        localStorage.setItem('aisha_school_schedule_master', scheduleJson);
      }
      // 5. Dedicated permanent school info & logo
      if (nextDb.schoolInfo) {
        localStorage.setItem(PERMANENT_SCHOOL_INFO_KEY, JSON.stringify(nextDb.schoolInfo));
        if (nextDb.schoolInfo.logoDataUrl) {
          localStorage.setItem(PERMANENT_SCHOOL_LOGO_KEY, nextDb.schoolInfo.logoDataUrl);
        }
      }
      // 6. Session backup
      sessionStorage.setItem(PRIMARY_STORAGE_KEY, json);
      if (nextDb.schedule) {
        sessionStorage.setItem(PERMANENT_SCHEDULE_KEY, JSON.stringify(nextDb.schedule));
      }
      if (nextDb.schoolInfo?.logoDataUrl) {
        sessionStorage.setItem(PERMANENT_SCHOOL_LOGO_KEY, nextDb.schoolInfo.logoDataUrl);
      }
    } catch (err) {
      console.warn('Persistence save warning:', err);
    }

    // 6. Permanent Cloud Save to Firestore (Synchronous and Permanent across all sessions and links)
    saveCloudDatabase(nextDb)
      .then((ok) => {
        setCloudSynced(ok);
      })
      .catch((err) => {
        console.warn('Cloud save error:', err);
        setCloudSynced(false);
      });
  }, []);

  // On initial mount: test connection, load cloud Firestore data, and listen in real-time
  useEffect(() => {
    // 1. Validate connection
    testConnection().catch(() => {});

    // 2. Fetch initial cloud database & dedicated schedule from Firestore
    Promise.all([fetchCloudDatabase(), fetchCloudSchedule()])
      .then(([cloudData, cloudSchedule]) => {
        setDb((prevDb) => {
          // Safe schedule resolution: never wipe local slots with empty cloud data!
          let resolvedSchedule = prevDb.schedule;
          const incomingSchedule = cloudSchedule || cloudData?.schedule;

          if (
            incomingSchedule &&
            Array.isArray(incomingSchedule.slots) &&
            incomingSchedule.slots.length > 0
          ) {
            if (!resolvedSchedule || !resolvedSchedule.slots || resolvedSchedule.slots.length === 0) {
              resolvedSchedule = incomingSchedule;
            } else {
              // Merge slots by day and period so nothing is lost
              const slotMap = new Map<string, ScheduleSlot>();
              for (const s of resolvedSchedule.slots) slotMap.set(`${s.day}-${s.period}`, s);
              for (const s of incomingSchedule.slots) slotMap.set(`${s.day}-${s.period}`, s);
              resolvedSchedule = {
                slots: Array.from(slotMap.values()),
                scheduleImageDataUrl:
                  incomingSchedule.scheduleImageDataUrl || resolvedSchedule.scheduleImageDataUrl,
                generalNotes: incomingSchedule.generalNotes || resolvedSchedule.generalNotes,
              };
            }
          } else if (resolvedSchedule && resolvedSchedule.slots && resolvedSchedule.slots.length > 0) {
            // Local has slots but cloud is empty: heal cloud by persisting local schedule!
            saveCloudSchedule(resolvedSchedule).catch(() => {});
          }

          const resolvedSchoolInfo = {
            ...prevDb.schoolInfo,
            ...(cloudData?.schoolInfo || {}),
            logoDataUrl:
              cloudData?.schoolInfo?.logoDataUrl ||
              prevDb.schoolInfo.logoDataUrl ||
              localStorage.getItem(PERMANENT_SCHOOL_LOGO_KEY) ||
              null,
            isLogoPinned: true,
          };

          const merged: AppDatabase = {
            ...prevDb,
            ...(cloudData || {}),
            schoolInfo: resolvedSchoolInfo,
            students:
              cloudData?.students && cloudData.students.length > 0
                ? cloudData.students
                : prevDb.students,
            schedule: resolvedSchedule,
            mediaItems:
              cloudData?.mediaItems && cloudData.mediaItems.length > 0
                ? cloudData.mediaItems
                : prevDb.mediaItems || INITIAL_FALLBACK_DB.mediaItems,
          };

          // Persist merged data to all storage keys immediately
          try {
            const json = JSON.stringify(merged);
            localStorage.setItem(PRIMARY_STORAGE_KEY, json);
            localStorage.setItem(PERMANENT_SCHEDULE_KEY, JSON.stringify(resolvedSchedule));
            localStorage.setItem(PERMANENT_SCHEDULE_BACKUP_KEY, JSON.stringify(resolvedSchedule));
            localStorage.setItem(PERMANENT_SCHOOL_INFO_KEY, JSON.stringify(resolvedSchoolInfo));
            if (resolvedSchoolInfo.logoDataUrl) {
              localStorage.setItem(PERMANENT_SCHOOL_LOGO_KEY, resolvedSchoolInfo.logoDataUrl);
            }
          } catch {
            // ignore
          }

          return merged;
        });
        setCloudSynced(true);
      })
      .catch((err) => {
        console.warn('Initial cloud fetch error:', err);
      });

    // 3. Subscribe to real-time cloud updates
    const unsubscribe = subscribeToCloudDatabase((cloudData) => {
      if (cloudData && Object.keys(cloudData).length > 0) {
        setDb((prevDb) => {
          let nextSchedule = prevDb.schedule;
          // NEVER overwrite local slots with empty slots from cloud!
          if (
            cloudData.schedule &&
            Array.isArray(cloudData.schedule.slots) &&
            cloudData.schedule.slots.length > 0
          ) {
            nextSchedule = cloudData.schedule;
          }

          const nextSchoolInfo = {
            ...prevDb.schoolInfo,
            ...(cloudData.schoolInfo || {}),
            logoDataUrl:
              cloudData.schoolInfo?.logoDataUrl ||
              prevDb.schoolInfo.logoDataUrl ||
              null,
            isLogoPinned: true,
          };

          return {
            ...prevDb,
            ...cloudData,
            schoolInfo: nextSchoolInfo,
            students:
              cloudData.students && cloudData.students.length > 0
                ? cloudData.students
                : prevDb.students,
            schedule: nextSchedule,
            mediaItems:
              cloudData.mediaItems && cloudData.mediaItems.length > 0
                ? cloudData.mediaItems
                : prevDb.mediaItems,
          };
        });
        setCloudSynced(true);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualScanRecovery = useCallback(() => {
    const res = recoverStudentsFromAllStorages(db);
    persistDatabase(res.recoveredDb);
    return {
      totalStudents: res.recoveredDb.students.length,
      recoveredCount: res.recoveredCount,
    };
  }, [db, persistDatabase]);

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    iconBg: string;
    activeClass: string;
  }> = [
    {
      id: 'dashboard',
      label: 'الرئيسية',
      sublabel: 'لوحة التحكم والمؤشرات',
      icon: <Home className="w-4 h-4 text-[#4A2E1B]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
    {
      id: 'uniform',
      label: 'استمارة متابعة الزي',
      sublabel: 'استبانة ملزم / غير ملتزم وحفظ',
      icon: <FileCheck className="w-4 h-4 text-[#7C4E2E]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
    {
      id: 'students',
      label: 'خانة الصفوف والطالبات',
      sublabel: 'إضافة وتعديل أسماء الصفوف',
      icon: <Users className="w-4 h-4 text-[#4A2E1B]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
    {
      id: 'participation',
      label: 'المشاركة الصفية',
      sublabel: 'تقييم المهارات والتفاعل',
      icon: <CheckCircle2 className="w-4 h-4 text-[#7C4E2E]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
    {
      id: 'classroom_tools',
      label: 'القرعة والمؤقت الرياضي',
      sublabel: 'عجلة الطالبات والمؤقت والساعة الرملية',
      icon: <Dices className="w-4 h-4 text-[#C58B50]" />,
      iconBg: 'bg-[#FAF5EC] border border-[#DFCDB6]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
    {
      id: 'activities',
      label: 'الأنشطة والمسابقات',
      sublabel: 'مهرجانات وبطولات الرياضة',
      icon: <Activity className="w-4 h-4 text-[#4A2E1B]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
    {
      id: 'schedule',
      label: 'الجدول المدرسي',
      sublabel: 'جدول الحصص الأسبوعي',
      icon: <Calendar className="w-4 h-4 text-[#8A5932]" />,
      iconBg: 'bg-[#FAF3E8] border border-[#E8DCC9]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
    {
      id: 'stickers',
      label: 'الملصقات التحفيزية',
      sublabel: 'أوسمة وشهادات التكريم',
      icon: <Award className="w-4 h-4 text-[#7C4E2E]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
    {
      id: 'reports',
      label: 'التقارير والإحصائيات',
      sublabel: 'تصدير CSV ورسوم بيانية',
      icon: <BarChart3 className="w-4 h-4 text-[#4A2E1B]" />,
      iconBg: 'bg-[#F7EFE4] border border-[#DFCDB6]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
    {
      id: 'guide',
      label: 'الأمان والصلاحيات',
      sublabel: 'النسخ الاحتياطي وتبديل الحساب',
      icon: <ShieldCheck className="w-4 h-4 text-[#8A5932]" />,
      iconBg: 'bg-[#FAF3E8] border border-[#E8DCC9]',
      activeClass: 'bg-[#4A2E1B] text-white shadow-xs',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#2C1A11]" dir="rtl">
      {/* Header with Warm Espresso Brown & Soft Beige Accents */}
      <header className="relative bg-white/95 backdrop-blur-md border-b border-[#E8DDD0] sticky top-0 z-40 no-print shadow-[0_1px_8px_rgba(74,46,27,0.04)] overflow-hidden">
        {/* Sports Equipment Watermark in Top Header */}
        <SportsEquipmentBackdrop variant="header-light" intensity={sportsBackdropIntensity} />
        <div className="relative z-10 max-w-[1600px] mx-auto flex items-center justify-between gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="text-base sm:text-lg font-black tracking-tight text-[#2C1A11] hover:text-[#4A2E1B] flex items-center gap-2.5 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-white p-0.5 border border-[#DFCDB6] shadow-2xs flex items-center justify-center shrink-0 overflow-hidden">
                <SchoolLogoView
                  logoDataUrl={db.schoolInfo.logoDataUrl}
                  className="w-full h-full"
                />
              </div>
              <div className="flex flex-col text-right">
                <span className={`leading-tight text-sm sm:text-base font-black tracking-tight ${headerFontClass}`}>
                  منصة الرياضة المدرسية التفاعلية (طاقة وانطلاقة)
                </span>
                <span className="text-[10px] text-[#7D6752] font-bold sm:hidden">
                  مدرسة عائشة بنت عثمان (1–12)
                </span>
              </div>
            </button>
            <span className="hidden sm:inline-block text-xs text-[#DECDB6]">|</span>
            <span className="hidden sm:inline-block text-xs font-bold text-[#7D6752]">
              سلطنة عُمان · وزارة التعليم · مدرسة عائشة بنت عثمان (1–12)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Header Font & Sports Backdrop Quick Customizer Trigger */}
            <button
              type="button"
              onClick={() => setShowFontModal(true)}
              className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF5EC] border border-[#DFCDB6] text-[#4A2E1B] hover:bg-[#F2E8DC] font-bold text-xs transition-colors shadow-2xs"
              title="تغيير نوع خط الترويسة وبروز الأدوات الرياضية في الخلفية"
            >
              <Palette className="w-3.5 h-3.5 text-[#8A5932]" />
              <span>خط الترويسة: <strong className="text-[#7C4E2E]">{currentFontOption.label.split(' ')[1]}</strong></span>
              <span className="text-xs">⚽</span>
            </button>
            {/* Official Instagram Account Button - Pinned & Clear */}
            <a
              href={PLATFORM_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white hover:opacity-95 font-black text-xs shadow-xs transition-all hover:scale-105"
              title="زيارة حساب الإنستغرام الرسمي @um_musk21 مباشرة"
            >
              <Instagram className="w-3.5 h-3.5 text-white shrink-0" />
              <span className="hidden sm:inline">إنستغرام المنصة:</span>
              <span className="font-extrabold dir-ltr">{PLATFORM_INSTAGRAM_HANDLE}</span>
              <ExternalLink className="w-3 h-3 text-white/80 shrink-0 hidden md:inline" />
            </a>

            {/* Share View-Only Link with Principal Button */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#4A2E1B] text-white hover:bg-[#382012] font-black text-xs shadow-xs transition-colors"
              title="مشاركة رابط العرض فقط لمديرة المدرسة أو المشرفة"
            >
              <Share2 className="w-3.5 h-3.5 text-[#D4A76A]" />
              <span className="hidden sm:inline">مشاركة الرابط للمديرة 🔗</span>
              <span className="sm:hidden">مشاركة 🔗</span>
            </button>

            <span
              className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border shadow-2xs ${
                cloudSynced
                  ? 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
                  : 'bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]'
              }`}
              title="قاعدة بيانات سحابية دائمة ومثبتة في Firebase Firestore"
            >
              <Cloud className="w-3.5 h-3.5 text-[#059669]" />
              <span>سحابي دائم (Firestore) ✓</span>
            </span>

            <button
              type="button"
              onClick={() => setActiveTab('students')}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FAF5EC] border border-[#DFCDB6] text-[#4A2E1B] font-bold text-xs hover:bg-[#F2E8DC] transition-colors shadow-2xs"
              title="عرض وتثبيت أسماء الطالبات"
            >
              <Users className="w-3.5 h-3.5 text-[#7C4E2E]" />
              <span>الطالبات:</span>
              <span className="font-black text-[#7C4E2E] tabular-nums">{db.students.length}</span>
              <span className="text-[10px] text-[#059669] font-black bg-[#ECFDF5] px-1.5 py-0.5 rounded-full border border-[#A7F3D0]">
                ✓ مثبت
              </span>
            </button>

            {/* User role & identity display */}
            {currentUser.role === 'teacher' ? (
              <span className="font-bold text-[#4A2E1B] bg-[#F7EFE4] px-3 py-1.5 rounded-xl border border-[#DFCDB6] hidden sm:inline-block">
                {currentUser.name} (معلمة المادة)
              </span>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[#065F46] bg-[#ECFDF5] px-2.5 py-1.5 rounded-xl border border-[#A7F3D0] flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-[#059669]" />
                  <span>{currentUser.name} (عرض فقط)</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowPinModal(true)}
                  className="px-2.5 py-1.5 bg-[#4A2E1B] hover:bg-[#382012] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 text-xs"
                  title="تسجيل دخول المعلمة للتحكم والتعديل"
                >
                  <KeyRound className="w-3 h-3 text-[#D4A76A]" />
                  <span className="hidden sm:inline">دخول المعلمة</span>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('uniform')}
              className="px-3.5 sm:px-4 py-1.5 bg-[#4A2E1B] hover:bg-[#382012] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full bg-[#D4A76A]"></span>
              <span>{currentUser.role === 'teacher' ? 'فتح استمارة اليوم' : 'استعراض الزي'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Reassuring View-Only Announcement Banner when in Principal / Supervisor mode */}
      {currentUser.role !== 'teacher' && (
        <div className="bg-[#FAF5EC] border-b border-[#DFCDB6] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs no-print">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-[#4A2E1B] text-[#D4A76A]">
              <Eye className="w-4 h-4" />
            </span>
            <span className="font-black text-[#4A2E1B]">
              وضع العرض والاطلاع الرسمي:
            </span>
            <span className="font-bold text-[#7C4E2E]">
              مرحباً بكِ الفاضلة {currentUser.name} ({currentUser.roleTitle})
            </span>
            <span className="text-[#8C7560] hidden md:inline">
              — المنصة مهيأة للاطلاع الشامل وطباعة التقارير؛ التحكم والتعديل محصور بمعلمة المادة (الأستاذة سالمة الحكماني).
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowPinModal(true)}
            className="px-3 py-1 bg-white hover:bg-[#FAF7F2] border border-[#DFCDB6] text-[#4A2E1B] font-black rounded-lg text-xs flex items-center gap-1.5 shadow-2xs transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-[#7C4E2E]" />
            <span>تسجيل دخول المعلمة للتحكم والتعديل</span>
          </button>
        </div>
      )}

      {/* Main Layout: Fixed Right Sidebar for Navigation + Content on Left */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto flex flex-col md:flex-row">
        {/* Right Sidebar (بتدرجات البيج الدافئ والبني الأصيل) */}
        <aside className="w-full md:w-64 lg:w-72 bg-[#F5EFE6] md:min-h-[calc(100vh-57px)] border-b md:border-b-0 md:border-l border-[#E8DDD0] p-3 sm:p-4 shrink-0 no-print shadow-[1px_0_6px_rgba(74,46,27,0.02)]">
          {/* Official School Emblem Header Card in Sidebar */}
          <div className="mb-3.5 px-2 hidden md:flex items-center gap-2.5 p-2 bg-white rounded-2xl border border-[#E8DDD0] shadow-2xs">
            <div className="w-10 h-10 rounded-xl bg-[#FAF5EC] p-0.5 border border-[#DFCDB6] flex items-center justify-center shrink-0 overflow-hidden shadow-xs">
              <SchoolLogoView
                logoDataUrl={db.schoolInfo.logoDataUrl}
                className="w-full h-full"
              />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-black text-[#4A2E1B] truncate">
                مدرسة عائشة بنت عثمان
              </h3>
              <p className="text-[10px] text-[#059669] font-bold flex items-center gap-1">
                <span>الشعار مثبت دائماً ✓</span>
              </p>
            </div>
          </div>

          <div className="mb-3 px-2 hidden md:block">
            <h2 className="text-[11px] font-black text-[#7D6752] tracking-wider uppercase">
              أقسام المنصة واستمارات المتابعة
            </h2>
          </div>

          {/* Navigation Links in Right Sidebar */}
          <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-right flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 md:shrink ${
                    isActive
                      ? item.activeClass
                      : 'text-[#2C1A11] hover:bg-white hover:text-[#4A2E1B] border border-transparent hover:border-[#DFCDB6]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : item.iconBg
                      }`}
                    >
                      {item.icon}
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold leading-tight text-sm">
                        {item.label}
                      </div>
                      <div
                        className={`text-[10px] hidden lg:block leading-tight mt-0.5 ${
                          isActive ? 'text-[#ECDABF]' : 'text-[#7D6752] font-normal'
                        }`}
                      >
                        {item.sublabel}
                      </div>
                    </div>
                  </div>

                  <ChevronLeft
                    className={`w-3.5 h-3.5 hidden md:block transition-transform ${
                      isActive ? 'text-[#ECDABF]' : 'text-[#B8A793]'
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          {/* Leadership & Credits Box in Warm Beige & Espresso */}
          <div className="hidden md:block mt-8 p-3.5 rounded-xl bg-white border border-[#E8DDD0] text-[11px] space-y-1.5 text-[#4A382B] shadow-2xs">
            <div className="font-black text-[#4A2E1B] border-b border-[#F7EFE4] pb-1 flex items-center justify-between">
              <span>إشراف وإعداد المنصة</span>
              <span className="text-[10px] text-[#A06938] font-bold">طاقة وانطلاقة</span>
            </div>
            <div>
              <span className="text-[#7D6752]">إعداد وتصميم:</span> الأستاذة سالمة الحكماني
            </div>
            <div>
              <span className="text-[#7D6752]">مديرة المدرسة:</span> الأستاذة فايزه الغنبوصي
            </div>
            <div>
              <span className="text-[#7D6752]">مشرفة المادة:</span> الأستاذة منيره الجابري
            </div>
          </div>

          {/* Official Instagram Account Card in Sidebar */}
          <div className="hidden md:block mt-3 p-3.5 rounded-xl bg-gradient-to-br from-[#FFF5F5] via-[#FFF8F0] to-[#FAF5EC] border border-[#F8D7DA] text-[11px] shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] flex items-center justify-center text-white shadow-2xs shrink-0">
                  <Instagram className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-black text-[#4A2E1B] text-xs leading-none">حساب الإنستغرام</div>
                  <div className="text-[10px] text-[#A06938] font-bold font-mono dir-ltr mt-0.5">
                    {PLATFORM_INSTAGRAM_HANDLE}
                  </div>
                </div>
              </div>
              <span className="text-[9px] font-black bg-[#FD1D1D]/10 text-[#FD1D1D] px-1.5 py-0.5 rounded-md border border-[#FD1D1D]/20">
                📌 مثبت
              </span>
            </div>
            <p className="text-[10px] text-[#7D6752] leading-relaxed mb-2">
              تابعوا التغطيات والفعاليات الرياضية لمبادرة (طاقة وانطلاقة).
            </p>
            <a
              href={PLATFORM_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white font-black text-[11px] shadow-2xs hover:opacity-95 transition-all hover:scale-[1.02]"
              title="فتح حساب الإنستغرام مباشرة في نافذة جديدة"
            >
              <Instagram className="w-3 h-3" />
              <span>فتح الحساب مباشرة ↗</span>
            </a>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardHome
              db={db}
              currentUser={currentUser}
              onNavigate={setActiveTab}
              onOpenShareModal={() => setShowShareModal(true)}
              onOpenPinModal={() => setShowPinModal(true)}
              headerFont={headerFont}
              onUpdateHeaderFont={handleUpdateHeaderFont}
              sportsBackdropIntensity={sportsBackdropIntensity}
              onUpdateSportsBackdropIntensity={handleUpdateSportsIntensity}
              onUpdateLogo={(logoDataUrl) =>
                persistDatabase({
                  ...db,
                  schoolInfo: {
                    ...db.schoolInfo,
                    logoDataUrl,
                    isLogoPinned: true,
                  },
                })
              }
            />
          )}

          {activeTab === 'uniform' && (
            <UniformTracker
              students={db.students}
              uniformLogs={db.uniformLogs}
              currentUser={currentUser}
              onSaveUniformLog={(log) => {
                const idx = db.uniformLogs.findIndex((l) => l.id === log.id);
                const nextLogs = [...db.uniformLogs];
                if (idx >= 0) nextLogs[idx] = log;
                else nextLogs.unshift(log);
                persistDatabase({ ...db, uniformLogs: nextLogs });
              }}
              onDeleteUniformLog={(logId) => {
                persistDatabase({
                  ...db,
                  uniformLogs: db.uniformLogs.filter((l) => l.id !== logId),
                });
              }}
              onNavigateToStudents={() => setActiveTab('students')}
            />
          )}

          {activeTab === 'students' && (
            <StudentsManager
              students={db.students}
              currentUser={currentUser}
              onSaveStudents={(nextStudents) =>
                persistDatabase({ ...db, students: nextStudents })
              }
              onManualScanRecovery={handleManualScanRecovery}
            />
          )}

          {activeTab === 'participation' && (
            <ParticipationTracker
              students={db.students}
              participationLogs={db.participationLogs}
              currentUser={currentUser}
              onSaveParticipationLog={(log) => {
                const idx = db.participationLogs.findIndex((l) => l.id === log.id);
                const nextLogs = [...db.participationLogs];
                if (idx >= 0) nextLogs[idx] = log;
                else nextLogs.unshift(log);
                persistDatabase({ ...db, participationLogs: nextLogs });
              }}
              onDeleteParticipationLog={(logId) => {
                persistDatabase({
                  ...db,
                  participationLogs: db.participationLogs.filter((l) => l.id !== logId),
                });
              }}
              onNavigateToStudents={() => setActiveTab('students')}
              onNavigateToTools={() => setActiveTab('classroom_tools')}
            />
          )}

          {activeTab === 'classroom_tools' && (
            <ClassroomTools
              db={db}
              currentUser={currentUser}
            />
          )}

          {activeTab === 'activities' && (
            <ActivitiesTracker
              activities={db.activities}
              currentUser={currentUser}
              onAddActivity={(activity) =>
                persistDatabase({ ...db, activities: [activity, ...db.activities] })
              }
              onUpdateActivityStatus={(id, status) =>
                persistDatabase({
                  ...db,
                  activities: db.activities.map((a) =>
                    a.id === id ? { ...a, status } : a
                  ),
                })
              }
              onDeleteActivity={(id) =>
                persistDatabase({
                  ...db,
                  activities: db.activities.filter((a) => a.id !== id),
                })
              }
            />
          )}

          {activeTab === 'schedule' && (
            <SchoolScheduleView
              schedule={db.schedule}
              currentUser={currentUser}
              onUpdateSchedule={(nextSchedule) =>
                persistDatabase({ ...db, schedule: nextSchedule })
              }
            />
          )}

          {activeTab === 'stickers' && (
            <StickersLibrary
              stickers={db.stickers}
              awardedStickers={db.awardedStickers}
              students={db.students}
              currentUser={currentUser}
              schoolName={db.schoolInfo.name}
              teacherName={db.schoolInfo.teacherName}
              onSaveStickers={(nextStickers) =>
                persistDatabase({ ...db, stickers: nextStickers })
              }
              onAwardSticker={(award) =>
                persistDatabase({
                  ...db,
                  awardedStickers: [award, ...db.awardedStickers],
                })
              }
              onDeleteAward={(awardId) =>
                persistDatabase({
                  ...db,
                  awardedStickers: db.awardedStickers.filter((a) => a.id !== awardId),
                })
              }
            />
          )}

          {activeTab === 'reports' && <ReportsDashboard db={db} />}

          {activeTab === 'guide' && (
            <SecurityAndDeploymentGuide
              db={db}
              currentUser={currentUser}
              onSwitchRole={async (role: UserRole, accessCode: string) => {
                if (role === 'teacher') {
                  if (verifyTeacherPin(accessCode)) {
                    switchToTeacher();
                    return true;
                  }
                  return false;
                }
                switchToRolePreview(role);
                return true;
              }}
              onRestoreBackup={persistDatabase}
            />
          )}

          {/* Global Platform Footer with Official Instagram Link */}
          <footer className="mt-12 pt-6 pb-3 border-t border-[#E8DDD0] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7D6752] no-print">
            <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-right">
              <span className="font-black text-[#4A2E1B]">منصة «طاقة وانطلاقة» التفاعلية</span>
              <span className="hidden sm:inline">·</span>
              <span>إعداد وتصميم: الأستاذة سالمة الحكماني</span>
              <span className="hidden sm:inline">·</span>
              <span>مدرسة عائشة بنت عثمان (1–12)</span>
            </div>

            <a
              href={PLATFORM_INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white font-black text-xs hover:opacity-95 shadow-2xs transition-all hover:scale-105"
              title="زيارة حساب الإنستغرام @um_musk21 مباشرة"
            >
              <Instagram className="w-3.5 h-3.5" />
              <span>حساب الإنستغرام: {PLATFORM_INSTAGRAM_HANDLE} ↗</span>
            </a>
          </footer>
        </main>
      </div>

      {/* Sharing and Security Modals */}
      <SharePlatformModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onSwitchToRolePreview={switchToRolePreview}
        schoolName={db.schoolInfo.name}
      />

      <TeacherPinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={switchToTeacher}
      />

      {/* Permanently Pinned Floating Instagram Badge */}
      <PinnedInstagramBadge />

      {/* Font & Sports Backdrop Customizer Modal */}
      {showFontModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="bg-[#FAF7F2] text-[#2C1A11] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl border border-[#DFCDB6] relative space-y-6 max-h-[90vh] overflow-y-auto"
            dir="rtl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#DFCDB6] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#4A2E1B] text-[#D4A76A] flex items-center justify-center shadow-xs shrink-0">
                  <Palette className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#2C1A11]">
                    تخصيص خط الترويسة وخلفية الأدوات الرياضية
                  </h3>
                  <p className="text-xs text-[#7D6752]">
                    اختيار نوع خط عنوان المنصة، وضبط ظهور الأدوات الرياضية بخلفية الكتابة
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFontModal(false)}
                className="text-[#7D6752] hover:text-[#2C1A11] p-1.5 rounded-xl hover:bg-[#EFE6D8] transition-colors"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-[#4A2E1B] flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-[#8A5932]" />
                  <span>نوع الخط في الترويسة وعناوين المنصة:</span>
                </label>
                <span className="text-[11px] text-[#7C4E2E] font-bold bg-[#F5EFE6] px-2 py-0.5 rounded-lg border border-[#DFCDB6]">
                  الحالي: {currentFontOption.label.split(' ')[1]}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {HEADER_FONT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleUpdateHeaderFont(opt.id)}
                    className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between gap-3 ${
                      headerFont === opt.id
                        ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-md ring-2 ring-[#D4A76A]/40'
                        : 'bg-white hover:bg-[#F7EFE4] text-[#2C1A11] border-[#DFCDB6]'
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-black ${opt.cssClass}`}>
                        {opt.label}
                      </p>
                      <p className={`text-[11px] mt-0.5 ${headerFont === opt.id ? 'text-[#F5E8D3]' : 'text-[#7D6752]'}`}>
                        {opt.sublabel}
                      </p>
                    </div>
                    <span className={`text-sm sm:text-base font-black px-2.5 py-1 rounded-xl shrink-0 ${opt.cssClass} ${
                      headerFont === opt.id ? 'bg-white/20 text-white' : 'bg-[#FAF7F2] text-[#7C4E2E] border border-[#DFCDB6]'
                    }`}>
                      طاقة وانطلاقة ⚡
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t border-[#DFCDB6]">
              <label className="text-xs font-black text-[#4A2E1B] flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#8A5932]" />
                <span>بروز الأدوات الرياضية في خلفية كتابة المنصة:</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'prominent',
                    label: 'بارزة وواضحة جداً',
                    icon: '⚽🏀',
                    desc: 'كرات وصافرات وأقماع واضحة وقوية',
                  },
                  {
                    id: 'balanced',
                    label: 'متوازنة وأنيقة',
                    icon: '🌟',
                    desc: 'المظهر الافتراضي المتزن',
                  },
                  {
                    id: 'subtle',
                    label: 'هادئة وخافتة',
                    icon: '🍃',
                    desc: 'خلفية خفيفة وناعمة',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleUpdateSportsIntensity(item.id as SportsBackdropIntensity)}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                      sportsBackdropIntensity === item.id
                        ? 'bg-[#4A2E1B] text-white border-[#4A2E1B] shadow-sm'
                        : 'bg-white hover:bg-[#F7EFE4] text-[#2C1A11] border-[#DFCDB6]'
                    }`}
                  >
                    <div className="text-2xl">{item.icon}</div>
                    <p className="text-xs font-black">{item.label}</p>
                    <p
                      className={`text-[10px] ${
                        sportsBackdropIntensity === item.id ? 'text-[#F5E8D3]' : 'text-[#7D6752]'
                      }`}
                    >
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#DFCDB6]">
              <p className="text-[11px] text-[#7D6752]">
                يتم الحفظ تلقائياً في المتصفح والقاعدة السحابية ✓
              </p>
              <button
                type="button"
                onClick={() => setShowFontModal(false)}
                className="px-5 py-2.5 rounded-xl bg-[#4A2E1B] hover:bg-[#382012] text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-[#D4A76A]" />
                <span>تم، حفظ الإعدادات</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
