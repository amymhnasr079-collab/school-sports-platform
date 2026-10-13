export type UserRole = 'teacher' | 'principal' | 'supervisor' | 'viewer';

export interface AuthUser {
  id: string;
  name: string;
  roleTitle: string;
  role: UserRole;
  permissions: string[];
  email?: string;
}

export interface SchoolInfo {
  name: string;
  gradesRange: string;
  teacherName: string;
  principalName: string;
  supervisorName: string;
  logoDataUrl: string | null;
  academicYear: string;
  motivationalBanner: string;
  isLogoPinned?: boolean;
  pinnedLogoType?: 'official_emblem' | 'custom_image';
}

export interface Student {
  id: string;
  name: string;
  grade: number; // 1 to 12
  section: string; // '1', '2', '3', '4', 'أ', 'ب'...
  studentNumber?: string;
  healthNotes?: string;
  isSample?: boolean;
  createdAt: string;
}

export type UniformStatus = 'full' | 'partial' | 'none' | 'absent' | 'excused';

export interface UniformStudentRecord {
  status: UniformStatus;
  note: string;
}

export interface UniformLog {
  id: string;
  date: string; // YYYY-MM-DD
  grade: number;
  section: string;
  period: number; // 1 to 8
  records: Record<string, UniformStudentRecord>; // key = studentId
  updatedAt: string;
  updatedBy: string;
}

export type ParticipationLevel = 'excellent' | 'very_good' | 'good' | 'needs_encouragement';

export interface ParticipationStudentRecord {
  positiveParticipation: ParticipationLevel;
  answeringQuestions: ParticipationLevel;
  sportsSkills: ParticipationLevel;
  teamwork: ParticipationLevel;
  safetyCompliance: ParticipationLevel;
  gamesInteraction: ParticipationLevel;
  initiativeLeadership: ParticipationLevel;
  note: string;
}

export interface ParticipationLog {
  id: string;
  date: string;
  grade: number;
  section: string;
  period: number;
  records: Record<string, ParticipationStudentRecord>; // key = studentId
  updatedAt: string;
  updatedBy: string;
}

export interface ActivityRecord {
  id: string;
  title: string;
  category: string;
  date: string;
  grade: number;
  section: string;
  description: string;
  participantsCount: number;
  featuredStudentIds: string[];
  status: 'completed' | 'upcoming' | 'ongoing';
}

export type SchoolDay = 'الأحد' | 'الإثنين' | 'الثلاثاء' | 'الأربعاء' | 'الخميس';

export interface ScheduleSlot {
  id: string;
  day: SchoolDay;
  period: number; // 1 to 8
  startTime: string;
  endTime: string;
  grade: number | null;
  section: string;
  activityNote: string;
}

export interface SchoolSchedule {
  slots: ScheduleSlot[];
  scheduleImageDataUrl: string | null;
  generalNotes: string;
}

export type StickerIconType =
  | 'star'
  | 'trophy'
  | 'team'
  | 'leader'
  | 'coop'
  | 'creative'
  | 'energy'
  | 'pride';

export type SportThemeColor = 'turquoise' | 'blue' | 'purple' | 'orange';

export interface MotivationalSticker {
  id: string;
  title: string;
  phrase: string;
  iconType: StickerIconType;
  colorTheme: SportThemeColor;
  isCustom?: boolean;
}

export interface AwardedSticker {
  id: string;
  stickerId: string;
  studentId: string;
  studentName: string;
  grade: number;
  section: string;
  customPhrase: string;
  date: string;
  awardedBy: string;
}

export type MediaCategory = 'presentation' | 'video' | 'lesson_plan' | 'rules';

export interface MediaItem {
  id: string;
  title: string;
  category: MediaCategory;
  gradeRange: string;
  url: string;
  description?: string;
  fileType?:
    | 'youtube'
    | 'drive'
    | 'canva'
    | 'slides'
    | 'pdf'
    | 'video'
    | 'powerpoint'
    | 'document'
    | 'audio'
    | 'link';
  createdAt: string;
  addedBy: string;
  // Device upload & local storage fields
  sourceType?: 'device' | 'url';
  fileName?: string;
  fileSize?: number;
  fileSizeFormatted?: string;
  mimeType?: string;
  deviceStorageKey?: string;
  localDataUrl?: string;
  // Cloud persistent storage fields
  cloudFileId?: string;
  cloudDownloadUrl?: string;
  storageProvider?: 'supabase' | 'firebase_storage' | 'firestore_cloud' | 'url' | 'device';
  isCloudStored?: boolean;
  storagePath?: string;
  uploadedByRole?: string;
  uploadedByEmail?: string;
}

export interface AppDatabase {
  schoolInfo: SchoolInfo;
  students: Student[];
  uniformLogs: UniformLog[];
  participationLogs: ParticipationLog[];
  activities: ActivityRecord[];
  schedule: SchoolSchedule;
  stickers: MotivationalSticker[];
  awardedStickers: AwardedSticker[];
  mediaItems: MediaItem[];
}

export type ActiveTab =
  | 'dashboard'
  | 'uniform'
  | 'participation'
  | 'classroom_tools'
  | 'activities'
  | 'schedule'
  | 'stickers'
  | 'reports'
  | 'students'
  | 'guide';
