import React from 'react';

/**
 * شعار المدرسة الرسمي (سلطنة عُمان - وزارة التعليم - مدرسة عائشة بنت عثمان للتعليم الأساسي 1–12)
 * تصميم متقن يرمز للتعليم والنشاط الرياضي المدرسي بروح الأصالة والتميز
 */
export const OfficialSchoolEmblemIllustration: React.FC<{
  className?: string;
}> = ({ className = 'w-32 h-32' }) => {
  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="شعار مدرسة عائشة بنت عثمان للتعليم الأساسي - وزارة التعليم"
    >
      <defs>
        {/* خلفية متوهجة بألوان العاج والبيج والكراميل الدافئ */}
        <radialGradient id="emblemGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="65%" stopColor="#FAF5EC" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#EFE5D5" stopOpacity="0.6" />
        </radialGradient>

        <linearGradient id="goldBorder" x1="20" y1="20" x2="220" y2="220" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D4A76A" />
          <stop offset="0.3" stopColor="#B87B41" />
          <stop offset="0.7" stopColor="#5C3821" />
          <stop offset="1" stopColor="#381E10" />
        </linearGradient>

        <linearGradient id="ribbonGrad" x1="40" y1="180" x2="200" y2="210" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4A2E1B" />
          <stop offset="0.5" stopColor="#633F26" />
          <stop offset="1" stopColor="#361D0F" />
        </linearGradient>

        <linearGradient id="innerShieldGrad" x1="60" y1="50" x2="180" y2="190" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.6" stopColor="#FCF9F3" />
          <stop offset="1" stopColor="#F5ECE0" />
        </linearGradient>
      </defs>

      {/* خلفية الهالة الذهبية الرملية والبيج */}
      <circle cx="120" cy="120" r="112" fill="url(#emblemGlow)" />
      
      {/* إطار دائري خارجي بني وبيج وذهبي مزدوج */}
      <circle cx="120" cy="120" r="106" stroke="url(#goldBorder)" strokeWidth="3" />
      <circle cx="120" cy="120" r="100" stroke="#DFCDB6" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="120" cy="120" r="95" stroke="#E2DACD" strokeWidth="1" />

      {/* نص القوس العلوي: وزارة التعليم */}
      <path id="topCurve" d="M 50 115 A 72 72 0 0 1 190 115" fill="none" />
      <text fill="#4A2E1B" fontSize="9.5" fontWeight="bold" fontFamily="Cairo, sans-serif" letterSpacing="0.5">
        <textPath href="#topCurve" startOffset="50%" textAnchor="middle">
          سلطنة عُمان · وزارة التعليم
        </textPath>
      </text>

      {/* إكليل الغار الشرفي الرياضي بلون الكراميل والبرونز البني المذهب */}
      <g stroke="#B87B41" strokeWidth="2.2" strokeLinecap="round" fill="none">
        {/* الجانب الأيمن */}
        <path d="M120 196C162 196 192 164 192 118C192 84 172 58 146 44" />
        <path d="M152 190C160 182 167 171 171 160" />
        <path d="M168 174C178 163 184 150 186 137" />
        <path d="M180 150C188 137 190 124 190 111" />
        <path d="M184 122C188 107 186 94 182 83" />
        <path d="M176 96C176 83 170 72 162 63" />

        {/* الجانب الأيسر */}
        <path d="M120 196C78 196 48 164 48 118C48 84 68 58 94 44" />
        <path d="M88 190C80 182 73 171 69 160" />
        <path d="M72 174C62 163 56 150 54 137" />
        <path d="M60 150C52 137 50 124 50 111" />
        <path d="M56 122C52 107 54 94 58 83" />
        <path d="M64 96C64 83 70 72 78 63" />
      </g>

      {/* درع الأمانة والتربية والرياضة الأوسط */}
      <path
        d="M74 74C74 74 94 70 120 58C146 70 166 74 166 74C166 126 154 165 120 184C86 165 74 126 74 74Z"
        fill="url(#innerShieldGrad)"
        stroke="#4A2E1B"
        strokeWidth="2.5"
      />

      {/* الشعلة الأولمبية للنشاط الرياضي والطاقة */}
      <g transform="translate(120, 80)">
        <path
          d="M0 -19C-6 -10 -10 -3 -6 7C-3 12 3 12 6 7C10 -3 6 -10 0 -19Z"
          fill="#B87B41"
        />
        <path
          d="M0 -13C-3 -7 -5 -2 -3 4C-1 7 1 7 3 4C5 -2 3 -7 0 -13Z"
          fill="#DFCDB6"
        />
        <path d="M-10 9H10L7 16H-7L-10 9Z" fill="#4A2E1B" stroke="#2B180E" strokeWidth="1" />
      </g>

      {/* رمز الكتاب المفتوح (العلم والمعرفة المدرسية) */}
      <g transform="translate(120, 118)">
        <path
          d="M-38 6C-22 0 -5 4 0 8C5 4 22 0 38 6V24C22 18 5 22 0 26C-5 22 -22 18 -38 24V6Z"
          fill="#FAF8F2"
          stroke="#4A2E1B"
          strokeWidth="2"
        />
        <line x1="0" y1="8" x2="0" y2="26" stroke="#4A2E1B" strokeWidth="2" />
        <path d="M-32 12C-20 8 -9 10 -4 12" stroke="#C89D35" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M-32 17C-20 13 -9 15 -4 17" stroke="#C89D35" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M32 12C20 8 9 10 4 12" stroke="#C89D35" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M32 17C20 13 9 15 4 17" stroke="#C89D35" strokeWidth="1.5" strokeLinecap="round" />

        {/* الحلقات الرياضية المتداخلة والنجمة الخماسية للتميز */}
        <circle cx="0" cy="-6" r="12" fill="#FAF7F0" stroke="#7C4E2E" strokeWidth="2" />
        <path
          d="M0 -15L2.8 -9.5L8.8 -8.6L4.4 -4.2L5.5 -0.5L0 -3.5L-5.5 -0.5L-4.4 -4.2L-8.8 -8.6L-2.8 -9.5L0 -15Z"
          fill="#D4AF37"
        />
      </g>

      {/* الوشاح الحريري السفلي المحفور باسم المدرسة */}
      <g transform="translate(120, 172)">
        {/* أطراف الوشاح الملتوية */}
        <path d="M-68 4L-80 14L-66 20L-64 8Z" fill="#3D2517" />
        <path d="M68 4L80 14L66 20L64 8Z" fill="#3D2517" />
        
        {/* جسم الوشاح الرئيسي */}
        <path
          d="M-66 0C-33 6 33 6 66 0L70 16C35 22 -35 22 -70 16L-66 0Z"
          fill="url(#ribbonGrad)"
          stroke="#C89D35"
          strokeWidth="1.5"
        />
        <text
          x="0"
          y="13"
          textAnchor="middle"
          fill="#FAF7F0"
          fontSize="9.5"
          fontWeight="bold"
          fontFamily="Cairo, sans-serif"
          letterSpacing="0.2"
        >
          عائشة بنت عثمان (1–12)
        </text>
      </g>

      {/* نجوم الشرف الثلاثية العلوية */}
      <circle cx="98" cy="48" r="3.2" fill="#D4AF37" stroke="#8F7450" strokeWidth="0.8" />
      <circle cx="120" cy="42" r="4.5" fill="#E5C158" stroke="#8F7450" strokeWidth="1" />
      <circle cx="142" cy="48" r="3.2" fill="#D4AF37" stroke="#8F7450" strokeWidth="0.8" />
    </svg>
  );
};

export const SchoolLogoView: React.FC<{
  logoDataUrl?: string | null;
  className?: string;
  imgClassName?: string;
  altText?: string;
}> = ({
  logoDataUrl,
  className = 'w-12 h-12',
  imgClassName = 'w-full h-full object-contain',
  altText = 'شعار مدرسة عائشة بنت عثمان',
}) => {
  if (logoDataUrl) {
    return (
      <div className={`overflow-hidden flex items-center justify-center ${className}`}>
        <img src={logoDataUrl} alt={altText} className={imgClassName} />
      </div>
    );
  }
  return <OfficialSchoolEmblemIllustration className={className} />;
};

