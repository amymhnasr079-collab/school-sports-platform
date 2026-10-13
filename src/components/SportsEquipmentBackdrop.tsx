import React from 'react';

export type SportsBackdropIntensity = 'subtle' | 'balanced' | 'prominent';
export type HeaderFontFamily = 'changa' | 'alexandria' | 'kufi' | 'marhey' | 'cairo';

export const HEADER_FONT_OPTIONS: Array<{
  id: HeaderFontFamily;
  label: string;
  sublabel: string;
  cssClass: string;
  previewText: string;
}> = [
  {
    id: 'changa',
    label: 'خط شانجا الرياضي (Changa)',
    sublabel: 'طابع رياضي حماسي قوي، مميز للافتات الرياضية والمنافسات',
    cssClass: 'font-changa',
    previewText: 'طاقة وانطلاقة - التربية البدنية',
  },
  {
    id: 'alexandria',
    label: 'خط الإسكندرية العصري (Alexandria)',
    sublabel: 'خط عربي حديث وهندسي راقٍ، وضوح فائق وفخامة عصرية',
    cssClass: 'font-alexandria',
    previewText: 'طاقة وانطلاقة - التربية البدنية',
  },
  {
    id: 'kufi',
    label: 'خط كوفي مطور (Noto Kufi)',
    sublabel: 'أصالة كوفية بهندسة معاصرة متزنة',
    cssClass: 'font-kufi',
    previewText: 'طاقة وانطلاقة - التربية البدنية',
  },
  {
    id: 'marhey',
    label: 'خط مرحي الحركي (Marhey)',
    sublabel: 'حيوية ومرح وطاقة تفاعلية مبهجة للطالبات',
    cssClass: 'font-marhey',
    previewText: 'طاقة وانطلاقة - التربية البدنية',
  },
  {
    id: 'cairo',
    label: 'خط القاهرة الكلاسيكي (Cairo)',
    sublabel: 'الخط الكلاسيكي المعتمد والمتزن',
    cssClass: 'font-cairo',
    previewText: 'طاقة وانطلاقة - التربية البدنية',
  },
];

/* =========================================================================
   Sports Equipment Vector Components (كرة سلة، كرة قدم، صافرة، ساعة إيقاف...)
   ========================================================================= */

/** كرة سلة احترافية بتفاصيل واقعية */
export const BasketballVector: React.FC<{
  className?: string;
  color?: string;
  lineColor?: string;
}> = ({
  className = 'w-16 h-16',
  color = '#E08338',
  lineColor = '#2C1A11',
}) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bballGrad" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#F5A358" />
        <stop offset="60%" stopColor={color} />
        <stop offset="100%" stopColor="#8C4112" />
      </radialGradient>
    </defs>
    {/* Body */}
    <circle cx="50" cy="50" r="46" fill="url(#bballGrad)" stroke={lineColor} strokeWidth="2.5" />
    {/* Basketball Seams */}
    {/* Horizontal line */}
    <path d="M4 50H96" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
    {/* Vertical line */}
    <path d="M50 4V96" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
    {/* Left arc */}
    <path d="M22 6C36 20 40 40 40 50C40 60 36 80 22 94" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
    {/* Right arc */}
    <path d="M78 6C64 20 60 40 60 50C60 60 64 80 78 94" stroke={lineColor} strokeWidth="2.5" strokeLinecap="round" />
    {/* Highlights */}
    <circle cx="36" cy="28" r="8" fill="#FFF" fillOpacity="0.25" />
  </svg>
);

/** كرة قدم كلاسيكية بمضلعات ثلاثية الأبعاد */
export const SoccerBallVector: React.FC<{
  className?: string;
  patchColor?: string;
  bodyColor?: string;
}> = ({
  className = 'w-16 h-16',
  patchColor = '#2C1A11',
  bodyColor = '#FAF7F2',
}) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="soccerGrad" cx="40%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="85%" stopColor={bodyColor} />
        <stop offset="100%" stopColor="#D5C5B0" />
      </radialGradient>
    </defs>
    {/* Sphere */}
    <circle cx="50" cy="50" r="46" fill="url(#soccerGrad)" stroke="#4A2E1B" strokeWidth="2.5" />
    {/* Center pentagon */}
    <polygon points="50,34 65,45 59,62 41,62 35,45" fill={patchColor} />
    {/* Seam lines to outer patches */}
    <line x1="50" y1="34" x2="50" y2="18" stroke="#4A2E1B" strokeWidth="2" strokeLinecap="round" />
    <line x1="65" y1="45" x2="80" y2="40" stroke="#4A2E1B" strokeWidth="2" strokeLinecap="round" />
    <line x1="59" y1="62" x2="72" y2="76" stroke="#4A2E1B" strokeWidth="2" strokeLinecap="round" />
    <line x1="41" y1="62" x2="28" y2="76" stroke="#4A2E1B" strokeWidth="2" strokeLinecap="round" />
    <line x1="35" y1="45" x2="20" y2="40" stroke="#4A2E1B" strokeWidth="2" strokeLinecap="round" />
    {/* Top patch */}
    <polygon points="50,18 40,8 60,8" fill={patchColor} />
    {/* Right top patch */}
    <polygon points="80,40 93,34 94,48" fill={patchColor} />
    {/* Right bottom patch */}
    <polygon points="72,76 86,84 75,93" fill={patchColor} />
    {/* Left bottom patch */}
    <polygon points="28,76 14,84 25,93" fill={patchColor} />
    {/* Left top patch */}
    <polygon points="20,40 7,34 6,48" fill={patchColor} />
  </svg>
);

/** صافرة المعلمة والحكم الرياضي مع رباط العنق */
export const WhistleVector: React.FC<{
  className?: string;
  metalColor?: string;
}> = ({ className = 'w-16 h-16', metalColor = '#D4AF37' }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="whistleMetal" x1="10" y1="20" x2="90" y2="80" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF2B2" />
        <stop offset="45%" stopColor={metalColor} />
        <stop offset="100%" stopColor="#8A6615" />
      </linearGradient>
    </defs>
    {/* Hanging lanyard ring */}
    <circle cx="20" cy="50" r="10" stroke="#FAF7F2" strokeWidth="3" strokeDasharray="4 2" />
    <circle cx="20" cy="50" r="5" stroke={metalColor} strokeWidth="2.5" />
    {/* Whistle Barrel & Body */}
    <path
      d="M26 50C26 38 36 30 48 30C58 30 66 36 68 45H88C91 45 93 48 93 51V58C93 61 91 63 88 63H68C66 70 58 76 48 76C36 76 26 64 26 50Z"
      fill="url(#whistleMetal)"
      stroke="#5C420D"
      strokeWidth="2.5"
    />
    {/* Whistle sound slot */}
    <rect x="66" y="44" width="6" height="18" rx="2" fill="#2C1A11" />
    {/* Inner pea ball inside sound chamber */}
    <circle cx="46" cy="53" r="8" fill="#5C420D" fillOpacity="0.8" />
    <circle cx="44" cy="51" r="2.5" fill="#FFF2B2" />
    {/* Sound breeze motion wave */}
    <path d="M96 46C100 48 100 56 96 60" stroke="#FFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
  </svg>
);

/** ساعة إيقاف ومؤقت رياضي دقيق (Stopwatch) */
export const StopwatchVector: React.FC<{
  className?: string;
  accentColor?: string;
}> = ({ className = 'w-16 h-16', accentColor = '#D4AF37' }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stopwatchRim" x1="20" y1="20" x2="80" y2="80">
        <stop offset="0%" stopColor="#F5EFE6" />
        <stop offset="100%" stopColor="#C9B498" />
      </linearGradient>
    </defs>
    {/* Top button & crown */}
    <rect x="46" y="6" width="8" height="12" rx="2" fill={accentColor} stroke="#4A2E1B" strokeWidth="2" />
    <rect x="42" y="4" width="16" height="5" rx="2.5" fill="#FAF7F2" stroke="#4A2E1B" strokeWidth="2" />
    {/* Left & Right lap buttons */}
    <rect x="23" y="14" width="6" height="8" rx="2" transform="rotate(-35 23 14)" fill="#C9B498" stroke="#4A2E1B" strokeWidth="1.5" />
    <rect x="74" y="10" width="6" height="8" rx="2" transform="rotate(35 74 10)" fill="#C9B498" stroke="#4A2E1B" strokeWidth="1.5" />
    {/* Main Outer Casing */}
    <circle cx="50" cy="54" r="40" fill="url(#stopwatchRim)" stroke="#4A2E1B" strokeWidth="3" />
    {/* Inner Dial Face */}
    <circle cx="50" cy="54" r="32" fill="#FFFFFF" stroke="#DECDB6" strokeWidth="1.5" />
    {/* Tick marks */}
    <line x1="50" y1="25" x2="50" y2="28" stroke="#2C1A11" strokeWidth="2" />
    <line x1="50" y1="78" x2="50" y2="81" stroke="#2C1A11" strokeWidth="2" />
    <line x1="21" y1="54" x2="24" y2="54" stroke="#2C1A11" strokeWidth="2" />
    <line x1="76" y1="54" x2="79" y2="54" stroke="#2C1A11" strokeWidth="2" />
    {/* Hands / Digital readout */}
    <circle cx="50" cy="54" r="3.5" fill={accentColor} />
    <line x1="50" y1="54" x2="68" y2="40" stroke="#B4401E" strokeWidth="2" strokeLinecap="round" />
    <line x1="50" y1="54" x2="38" y2="54" stroke="#2C1A11" strokeWidth="2.5" strokeLinecap="round" />
    {/* Mini digital badge */}
    <rect x="40" y="62" width="20" height="9" rx="2" fill="#2C1A11" />
    <text x="50" y="68.5" fill="#4ADE80" fontSize="5.5" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
      02:30
    </text>
  </svg>
);

/** مضرب رياضي مع ريشة طائرة / كرة مضرب */
export const RacketVector: React.FC<{
  className?: string;
}> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Handle Grip */}
    <line x1="15" y1="85" x2="40" y2="60" stroke="#7C4E2E" strokeWidth="7" strokeLinecap="round" />
    <line x1="15" y1="85" x2="38" y2="62" stroke="#EFE6D8" strokeWidth="1.5" strokeDasharray="3 3" strokeLinecap="round" />
    {/* Racket Head Oval */}
    <ellipse cx="65" cy="35" rx="26" ry="20" transform="rotate(-45 65 35)" stroke="#D4AF37" strokeWidth="3" fill="#FFF" fillOpacity="0.08" />
    {/* String Grid */}
    <line x1="50" y1="20" x2="80" y2="50" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
    <line x1="43" y1="27" x2="73" y2="57" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
    <line x1="57" y1="13" x2="87" y2="43" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
    <line x1="80" y1="20" x2="50" y2="50" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
    <line x1="73" y1="13" x2="43" y2="43" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
    <line x1="87" y1="27" x2="57" y2="57" stroke="#D4AF37" strokeWidth="1" opacity="0.6" />
    {/* Tennis / Shuttlecock ball near racket */}
    <circle cx="82" cy="72" r="10" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" />
    <path d="M75 66C79 72 85 73 89 78" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/** أقماع التدريب الرياضي والرشاقة الحركية (Agility Cones) */
export const TrainingConeVector: React.FC<{
  className?: string;
  coneColor?: string;
}> = ({ className = 'w-16 h-16', coneColor = '#EA580C' }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Base square/ellipse */}
    <ellipse cx="50" cy="85" rx="42" ry="9" fill="#9A3412" stroke="#431407" strokeWidth="2" />
    <ellipse cx="50" cy="84" rx="38" ry="7" fill={coneColor} />
    {/* Cone body */}
    <path d="M22 84L45 16C46 13 54 13 55 16L78 84Z" fill={coneColor} stroke="#7C2D12" strokeWidth="2" />
    {/* Reflective white middle stripe */}
    <polygon points="34,60 66,60 61,44 39,44" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
    {/* Top hole */}
    <ellipse cx="50" cy="16" rx="5" ry="2" fill="#7C2D12" />
  </svg>
);

/** حبل القفز الرياضي (Speed Jump Rope) */
export const JumpRopeVector: React.FC<{
  className?: string;
  ropeColor?: string;
}> = ({ className = 'w-24 h-16', ropeColor = '#F59E0B' }) => (
  <svg viewBox="0 0 120 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Looped dynamic jump rope curve */}
    <path
      d="M18 25C18 65 102 65 102 25"
      stroke={ropeColor}
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeDasharray="1 0"
    />
    {/* Left Handle */}
    <rect x="12" y="10" width="8" height="22" rx="4" fill="#78350F" stroke="#FDE68A" strokeWidth="1.5" />
    {/* Right Handle */}
    <rect x="100" y="10" width="8" height="22" rx="4" fill="#78350F" stroke="#FDE68A" strokeWidth="1.5" />
    {/* Motion sparkles */}
    <circle cx="60" cy="55" r="2" fill="#FFF" />
    <circle cx="40" cy="50" r="1.5" fill="#FFF" />
    <circle cx="80" cy="50" r="1.5" fill="#FFF" />
  </svg>
);

/** دمبل أثقال اللياقة البدنية (Dumbbell) */
export const DumbbellVector: React.FC<{
  className?: string;
}> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Center Bar */}
    <rect x="25" y="46" width="50" height="8" rx="2" fill="#CBD5E1" stroke="#475569" strokeWidth="1.5" />
    <rect x="38" y="46" width="24" height="8" rx="1" fill="#94A3B8" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
    {/* Left Weights */}
    <rect x="18" y="32" width="9" height="36" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
    <rect x="10" y="36" width="8" height="28" rx="2.5" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
    {/* Right Weights */}
    <rect x="73" y="32" width="9" height="36" rx="3" fill="#D97706" stroke="#78350F" strokeWidth="1.5" />
    <rect x="82" y="36" width="8" height="28" rx="2.5" fill="#B45309" stroke="#78350F" strokeWidth="1.5" />
  </svg>
);

/** كأس التفوق والبطولة الرياضية الذهبية */
export const TrophyCupVector: React.FC<{
  className?: string;
}> = ({ className = 'w-16 h-16' }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="trophyGold" x1="20" y1="15" x2="80" y2="70">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="50%" stopColor="#EAB308" />
        <stop offset="100%" stopColor="#A16207" />
      </linearGradient>
    </defs>
    {/* Handles */}
    <path d="M26 22H18C13 22 10 27 10 33C10 42 18 47 28 47" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round" />
    <path d="M74 22H82C87 22 90 27 90 33C90 42 82 47 72 47" stroke="#CA8A04" strokeWidth="3" strokeLinecap="round" />
    {/* Cup Bowl */}
    <path
      d="M26 18H74V42C74 55 63 65 50 65C37 65 26 55 26 42V18Z"
      fill="url(#trophyGold)"
      stroke="#713F12"
      strokeWidth="2.5"
    />
    {/* Star on Cup */}
    <path
      d="M50 28L52.5 34L59 34.5L54 39L55.5 45.5L50 42L44.5 45.5L46 39L41 34.5L47.5 34L50 28Z"
      fill="#FFF"
      stroke="#854D0E"
      strokeWidth="0.8"
    />
    {/* Stem */}
    <rect x="46" y="65" width="8" height="12" fill="#CA8A04" stroke="#713F12" strokeWidth="1.5" />
    {/* Base Stand */}
    <path d="M34 77H66L70 88H30L34 77Z" fill="#78350F" stroke="#451A03" strokeWidth="2" />
    <rect x="36" y="80" width="28" height="5" rx="1" fill="#FEF08A" />
  </svg>
);

/** خطوط مضمار الجري الرياضي الدائرية والانسيابية (Athletic Track Lanes) */
export const TrackLanesVector: React.FC<{
  className?: string;
  strokeColor?: string;
}> = ({ className = 'w-full h-full', strokeColor = 'rgba(212,175,55,0.2)' }) => (
  <svg viewBox="0 0 800 300" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M-50 280C200 240 500 280 850 180" stroke={strokeColor} strokeWidth="2" strokeDasharray="12 8" />
    <path d="M-50 250C210 200 520 250 850 140" stroke={strokeColor} strokeWidth="2.5" />
    <path d="M-50 220C220 160 540 220 850 100" stroke={strokeColor} strokeWidth="3" />
    <path d="M-50 190C230 120 560 190 850 60" stroke={strokeColor} strokeWidth="3.5" strokeDasharray="16 10" />
    {/* Start Line Ticks */}
    <line x1="140" y1="180" x2="160" y2="260" stroke={strokeColor} strokeWidth="4" />
    <line x1="280" y1="140" x2="300" y2="230" stroke={strokeColor} strokeWidth="4" />
  </svg>
);

/* =========================================================================
   Sports Equipment Backdrop Component (خلفية أدوات رياضية لكتابة المنصة)
   ========================================================================= */

interface SportsEquipmentBackdropProps {
  /** نمط الخلفية: للبطل الرئيسي (داكن مذهب) أو للهيدر العلوي */
  variant?: 'hero-dark' | 'header-light';
  /** درجة بروز الأدوات الرياضية */
  intensity?: SportsBackdropIntensity;
  /** تفعيل أو تعطيل الأدوات */
  className?: string;
}

export const SportsEquipmentBackdrop: React.FC<SportsEquipmentBackdropProps> = ({
  variant = 'hero-dark',
  intensity = 'balanced',
  className = '',
}) => {
  // Determine opacity multiplier based on intensity
  const opacityMultiplier = intensity === 'prominent' ? 1 : intensity === 'balanced' ? 0.75 : 0.45;

  if (variant === 'header-light') {
    // Subtle watermark for the top sticky bar
    return (
      <div
        className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 flex items-center justify-start gap-8 pr-4 transition-opacity duration-300"
          style={{ opacity: 0.12 * opacityMultiplier }}
        >
          <BasketballVector className="w-10 h-10 rotate-12 shrink-0" color="#B46746" lineColor="#7C4E2E" />
          <SoccerBallVector className="w-9 h-9 -rotate-6 shrink-0" patchColor="#7C4E2E" bodyColor="#F5EFE6" />
          <WhistleVector className="w-8 h-8 rotate-45 shrink-0" metalColor="#B48235" />
          <StopwatchVector className="w-8 h-8 -rotate-12 shrink-0" accentColor="#B48235" />
          <TrophyCupVector className="w-8 h-8 rotate-6 shrink-0" />
          <TrainingConeVector className="w-8 h-8 rotate-12 shrink-0" coneColor="#C4602C" />
          <RacketVector className="w-9 h-9 -rotate-45 shrink-0" />
        </div>
      </div>
    );
  }

  // variant === 'hero-dark' - Full rich sports backdrop for the Platform Hero Title
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none ${className}`}
      aria-hidden="true"
    >
      {/* 1. Athletic Running Track Lines in Background */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: 0.22 * opacityMultiplier }}
      >
        <TrackLanesVector strokeColor="rgba(245, 232, 211, 0.5)" />
      </div>

      {/* 2. Soft Golden Amber Radial Glows behind headline text area */}
      <div
        className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-tr from-[#D4AF37]/25 via-[#C58B50]/15 to-transparent blur-3xl"
        style={{ opacity: 0.6 * opacityMultiplier }}
      />
      <div
        className="absolute bottom-0 right-10 w-72 h-72 rounded-full bg-[#EA580C]/15 blur-3xl"
        style={{ opacity: 0.5 * opacityMultiplier }}
      />

      {/* 3. Floating Sports Tools directly behind and framing the Platform Title */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: 0.35 * opacityMultiplier }}
      >
        {/* كرة سلة كبيرة في الركن الأيمن العلوي خلف العنوان */}
        <div className="absolute -top-4 right-6 sm:right-16 transform rotate-12 scale-90 sm:scale-110 filter drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
          <BasketballVector className="w-24 h-24 sm:w-32 sm:h-32" />
        </div>

        {/* كرة قدم واضحة بجوار عنوان المنصة الأيمن */}
        <div className="absolute top-24 right-48 sm:right-72 transform -rotate-12 scale-75 sm:scale-95 filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.4)]">
          <SoccerBallVector className="w-20 h-20 sm:w-24 sm:h-24" patchColor="#1F130B" bodyColor="#EADCC9" />
        </div>

        {/* صافرة رياضية ذهبية تتدلى قرب عبارة (طاقة وانطلاقة) */}
        <div className="absolute top-12 left-1/3 sm:left-1/2 transform rotate-45 scale-90 sm:scale-100 filter drop-shadow-[0_4px_12px_rgba(212,175,55,0.4)]">
          <WhistleVector className="w-20 h-20 sm:w-24 sm:h-24" metalColor="#FACC15" />
        </div>

        {/* ساعة إيقاف ومؤقت رقمي خلف النص في المنتصف */}
        <div className="absolute bottom-8 right-1/3 transform -rotate-6 scale-90 sm:scale-105 filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
          <StopwatchVector className="w-20 h-20 sm:w-26 sm:h-26" accentColor="#FACC15" />
        </div>

        {/* كأس البطولة والتفوق الذهبي في خلفية اليسار */}
        <div className="absolute top-8 left-16 sm:left-28 transform rotate-6 scale-95 sm:scale-110 filter drop-shadow-[0_8px_24px_rgba(234,179,8,0.35)]">
          <TrophyCupVector className="w-24 h-24 sm:w-28 sm:h-28" />
        </div>

        {/* قمع تدريب رشاقة برتقالي في أسفل اليسار */}
        <div className="absolute -bottom-6 left-6 sm:left-14 transform rotate-12 scale-90 sm:scale-100 filter drop-shadow-[0_6px_16px_rgba(0,0,0,0.5)]">
          <TrainingConeVector className="w-22 h-22 sm:w-26 sm:h-26" coneColor="#F97316" />
        </div>

        {/* مضرب رياضي أنيق مائل في الخلفية */}
        <div className="absolute top-2 left-1/2 transform -rotate-30 scale-85 sm:scale-100 filter drop-shadow-[0_6px_14px_rgba(0,0,0,0.35)]">
          <RacketVector className="w-24 h-24 sm:w-28 sm:h-28" />
        </div>

        {/* حبل القفز الرياضي المنحني بانسيابية عبر الخلفية */}
        <div className="absolute bottom-2 right-12 sm:right-28 transform -rotate-6 scale-90 sm:scale-110 filter drop-shadow-[0_4px_12px_rgba(245,158,11,0.35)]">
          <JumpRopeVector className="w-32 h-20 sm:w-44 sm:h-24" ropeColor="#FBBF24" />
        </div>

        {/* أثقال دمبل في المنتصف السفلي */}
        <div className="absolute bottom-4 left-1/3 transform rotate-12 scale-75 sm:scale-90 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)]">
          <DumbbellVector className="w-20 h-20 sm:w-22 sm:h-22" />
        </div>
      </div>
    </div>
  );
};
