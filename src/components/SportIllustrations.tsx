import React from 'react';
import { StickerIconType } from '../types';

/**
 * ملصق ورسمة المعلمة الرياضية (الأستاذة سالمة الحكماني)
 * معلمة رياضة عمانية بزي رياضي محتشم وأنيق بألوان البيج والكراميل الدافئة
 * ترتدي حجابًا رياضيًا أنيقًا، بدلة تدريب رياضية محتشمة مع صافرة رياضية وساعة توقيت ولوح متابعة الحصص
 */
export const ModestSportTeacherIllustration: React.FC<{
  className?: string;
}> = ({ className = 'w-32 h-32' }) => {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="ملصق كرتوني لمعلمة الرياضة المدرسية بزي محتشم وأنيق"
    >
      <defs>
        {/* خلفية بتدرجات البيج الدافئة وضوء ذهبي رقيق */}
        <linearGradient id="teacherBgGrad" x1="20" y1="20" x2="200" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAF7F0" stopOpacity="0.3" />
          <stop offset="0.5" stopColor="#EADFCB" stopOpacity="0.25" />
          <stop offset="1" stopColor="#8F7450" stopOpacity="0.15" />
        </linearGradient>

        {/* تدرج هادئ للسترة الرياضية */}
        <linearGradient id="jacketGrad" x1="74" y1="84" x2="146" y2="152" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8F7450" />
          <stop offset="1" stopColor="#735B3B" />
        </linearGradient>

        {/* تدرج أنيق للحجاب الدافئ */}
        <linearGradient id="hijabGrad" x1="80" y1="26" x2="140" y2="92" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FAF7F0" />
          <stop offset="1" stopColor="#EFE8D8" />
        </linearGradient>
      </defs>

      {/* هالة خلفية رياضية ناعمة */}
      <circle cx="110" cy="110" r="95" fill="url(#teacherBgGrad)" />
      <circle cx="110" cy="110" r="82" stroke="#EADFCB" strokeWidth="2" strokeDasharray="5 5" opacity="0.6" />

      {/* نجوم تحفيزية خفيفة */}
      <path d="M42 48L44.5 53.5L50.5 54.2L46.2 58.4L47.2 64.5L42 61.5L36.8 64.5L37.8 58.4L33.5 54.2L39.5 53.5L42 48Z" fill="#EADFCB" />
      <path d="M178 44L180 48.5L185 49.2L181.5 52.8L182.2 57.8L178 55.2L173.8 57.8L174.5 52.8L171 49.2L176 48.5L178 44Z" fill="#D8CEBE" />
      <circle cx="178" cy="150" r="4.5" fill="#C2B49F" opacity="0.5" />
      <circle cx="44" cy="140" r="5" fill="#D8CEBE" opacity="0.5" />

      {/* ظل الأرضية */}
      <ellipse cx="110" cy="198" rx="48" ry="8" fill="#42382F" opacity="0.15" />

      {/* البنطال الرياضي المحتشم (كحلي رملي دافئ) */}
      <path
        d="M89 144L83 186H103L108 154L113 186H133L127 144H89Z"
        fill="#4A3E31"
      />
      {/* خطوط رياضية جانبية أنيقة على البنطال بلون بيج فاتح */}
      <path d="M86 146L82 184" stroke="#D8CEBE" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M130 146L134 184" stroke="#D8CEBE" strokeWidth="2.5" strokeLinecap="round" />

      {/* الحذاء الرياضي للمعلمة */}
      <rect x="76" y="184" width="28" height="11" rx="5.5" fill="#FAF7F0" stroke="#8F7450" strokeWidth="1.5" />
      <rect x="76" y="191" width="28" height="4" rx="2" fill="#8F7450" />
      <rect x="112" y="184" width="28" height="11" rx="5.5" fill="#FAF7F0" stroke="#8F7450" strokeWidth="1.5" />
      <rect x="112" y="191" width="28" height="4" rx="2" fill="#8F7450" />

      {/* السترة الرياضية المحتشمة (Sport Tracksuit Jacket - لون كراميل وبيج دافئ) */}
      <path
        d="M74 86C74 78 84 74 110 74C136 74 146 78 146 86L149 148C149 152 145 154 141 154H79C75 154 71 152 71 148L74 86Z"
        fill="url(#jacketGrad)"
      />

      {/* سحاب السترة وتفاصيل الياقة الرياضية */}
      <path d="M110 74V154" stroke="#FAF7F0" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M96 74L110 90L124 74" stroke="#FAF7F0" strokeWidth="2.5" strokeLinejoin="round" />

      {/* خطوط تجميلية رياضية بلون الكريمة والبيج الدافئ */}
      <path d="M78 108C94 116 126 116 142 108" stroke="#FAF7F0" strokeWidth="3" strokeLinecap="round" />
      <path d="M80 116C94 123 126 123 140 116" stroke="#D8CEBE" strokeWidth="2" strokeLinecap="round" />

      {/* لوح متابعة الحصص الرياضية في اليد اليمنى (Coaching Clipboard) */}
      <g transform="translate(42, 94)">
        <rect x="0" y="0" width="26" height="36" rx="4" fill="#EFE8D8" stroke="#735B3B" strokeWidth="2" />
        <rect x="8" y="-3" width="10" height="5" rx="2" fill="#42382F" />
        {/* ورقة المتابعة بداخل اللوح */}
        <rect x="3" y="5" width="20" height="27" rx="2" fill="#FFFFFF" />
        <line x1="6" y1="10" x2="20" y2="10" stroke="#5B7D64" strokeWidth="2" strokeLinecap="round" />
        <line x1="6" y1="15" x2="17" y2="15" stroke="#8F7450" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="19" x2="19" y2="19" stroke="#8F7450" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="6" y1="23" x2="15" y2="23" stroke="#8F7450" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="18" cy="27" r="2.5" fill="#5B7D64" />
      </g>

      {/* اليد اليمنى تمسك اللوح */}
      <path
        d="M74 88L54 104L60 120"
        stroke="#8F7450"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="58" cy="118" r="6" fill="#FDE68A" />

      {/* اليد اليسرى مرفوعة بتشجيع وإشارة إيجابية */}
      <path
        d="M144 88L162 104L156 120"
        stroke="#8F7450"
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="156" cy="119" r="6" fill="#FDE68A" />

      {/* صافرة المعلمة الرياضية معلقة برباط حول العنق (Whistle) */}
      <path d="M102 78L106 100M118 78L114 100" stroke="#42382F" strokeWidth="1.5" strokeDasharray="3 2" />
      <g transform="translate(104, 98)">
        <rect x="0" y="0" width="12" height="7" rx="3" fill="#D4AF37" stroke="#8F7450" strokeWidth="1" />
        <rect x="9" y="1.5" width="4" height="4" rx="1" fill="#D4AF37" />
        <circle cx="4" cy="3.5" r="1.5" fill="#42382F" />
      </g>

      {/* الحجاب الرياضي الأنيق والمحتشم (Sport Hijab في درجات البيج والأوف وايت) */}
      <path
        d="M80 52C80 34 92 24 110 24C128 24 140 34 140 52C140 70 137 88 110 90C83 88 80 70 80 52Z"
        fill="url(#hijabGrad)"
        stroke="#8F7450"
        strokeWidth="2.5"
      />
      {/* شريط رياضي أنيق على الحجاب بألوان البيج الداكن */}
      <path
        d="M86 42C94 36 126 36 134 42"
        stroke="#8F7450"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* وجه المعلمة البشوش والواثق */}
      <circle cx="110" cy="57" r="18.5" fill="#FDE68A" />

      {/* العينان بابتسامة وهدوء */}
      <ellipse cx="103" cy="55" rx="2.5" ry="3" fill="#42382F" />
      <ellipse cx="117" cy="55" rx="2.5" ry="3" fill="#42382F" />
      <circle cx="104" cy="54" r="0.9" fill="#FFFFFF" />
      <circle cx="118" cy="54" r="0.9" fill="#FFFFFF" />

      {/* الحواجب الأنيقة */}
      <path d="M100 50C102 48.5 106 49 106 50" stroke="#735B3B" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M114 50C114 49 118 48.5 120 50" stroke="#735B3B" strokeWidth="1.5" strokeLinecap="round" />

      {/* حمرة الخدين الناعمة */}
      <circle cx="97" cy="61" r="3" fill="#E89B84" opacity="0.45" />
      <circle cx="123" cy="61" r="3" fill="#E89B84" opacity="0.45" />

      {/* ابتسامة المعلمة المطمئنة والمشجعة */}
      <path
        d="M104 64C106 67.5 114 67.5 116 64"
        stroke="#42382F"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* شارة معلمة متميزة على الصدر */}
      <circle cx="126" cy="94" r="5" fill="#5B7D64" stroke="#FAF7F0" strokeWidth="1.2" />
      <path d="M124.5 94L125.5 95.2L127.8 92.8" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const ModestSportStudentIllustration: React.FC<{
  variant?: 'running' | 'trophy' | 'stretching' | 'team';
  className?: string;
}> = ({ variant = 'trophy', className = 'w-32 h-32' }) => {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="رسم كرتوني لطالبة بزي رياضي مدرسي محتشم"
    >
      <circle cx="110" cy="110" r="96" fill="#FAF7F0" opacity="0.4" />
      <circle cx="110" cy="110" r="78" stroke="#8F7450" strokeWidth="2" strokeDasharray="6 6" opacity="0.35" />

      <path
        d="M42 52L45 60L53 63L45 66L42 74L39 66L31 63L39 60L42 52Z"
        fill="#B46746"
      />
      <path
        d="M178 45L180 51L186 53L180 55L178 61L176 55L170 53L176 51L178 45Z"
        fill="#736382"
      />
      <circle cx="175" cy="155" r="5" fill="#8F7450" opacity="0.7" />
      <circle cx="40" cy="145" r="6" fill="#5B7D64" opacity="0.7" />

      <ellipse cx="110" cy="194" rx="46" ry="8" fill="#42382F" opacity="0.12" />

      <path
        d="M90 138L84 182H103L108 150L113 182H132L126 138H90Z"
        fill="#4A3E31"
      />
      <path d="M87 142L83 180" stroke="#D8CEBE" strokeWidth="3" strokeLinecap="round" />
      <path d="M129 142L133 180" stroke="#D8CEBE" strokeWidth="3" strokeLinecap="round" />

      <rect x="78" y="180" width="26" height="11" rx="5.5" fill="#B46746" />
      <rect x="78" y="187" width="26" height="4" rx="2" fill="#FFFFFF" />
      <rect x="112" y="180" width="26" height="11" rx="5.5" fill="#B46746" />
      <rect x="112" y="187" width="26" height="4" rx="2" fill="#FFFFFF" />

      <path
        d="M78 88C78 80 86 76 110 76C134 76 142 80 142 88L146 144C146 147 143 149 139 149H81C77 149 74 147 74 144L78 88Z"
        fill="#5B7D64"
      />
      <path
        d="M83 92L110 110L137 92"
        stroke="#FFFFFF"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M83 100L110 118L137 100"
        stroke="#D8CEBE"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {variant === 'trophy' || variant === 'team' ? (
        <>
          <path
            d="M80 86C68 84 56 72 52 56"
            stroke="#5B7D64"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="51" cy="53" r="7" fill="#FDE68A" />
          <path
            d="M140 86C152 84 162 74 166 60"
            stroke="#5B7D64"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="167" cy="57" r="7" fill="#FDE68A" />
        </>
      ) : (
        <>
          <path
            d="M78 88L60 112L70 124"
            stroke="#5B7D64"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="71" cy="125" r="6.5" fill="#FDE68A" />
          <path
            d="M142 88L160 108L150 122"
            stroke="#5B7D64"
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="149" cy="123" r="6.5" fill="#FDE68A" />
        </>
      )}

      <path
        d="M82 54C82 36 94 26 110 26C126 26 138 36 138 54C138 72 135 88 110 90C85 88 82 72 82 54Z"
        fill="#FFFFFF"
        stroke="#8F7450"
        strokeWidth="3"
      />
      <path
        d="M88 43C95 38 125 38 132 43"
        stroke="#736382"
        strokeWidth="5"
        strokeLinecap="round"
      />

      <circle cx="110" cy="57" r="19" fill="#FDE68A" />
      <circle cx="103" cy="55" r="2.6" fill="#42382F" />
      <circle cx="117" cy="55" r="2.6" fill="#42382F" />
      <circle cx="97" cy="60" r="3.2" fill="#E89B84" opacity="0.45" />
      <circle cx="123" cy="60" r="3.2" fill="#E89B84" opacity="0.45" />
      <path
        d="M104 63C106 66.5 114 66.5 116 63"
        stroke="#42382F"
        strokeWidth="2.4"
        strokeLinecap="round"
      />

      <path d="M102 84L110 102L118 84" stroke="#B46746" strokeWidth="3" />
      <circle cx="110" cy="105" r="7" fill="#FACC15" stroke="#CA8A04" strokeWidth="1.5" />

      {variant === 'trophy' && (
        <g transform="translate(34, 24)">
          <circle cx="16" cy="16" r="13" fill="#FACC15" stroke="#8F7450" strokeWidth="2.5" />
          <path
            d="M16 7L18.5 12.5L24.5 13.2L20 17.2L21.2 23L16 20L10.8 23L12 17.2L7.5 13.2L13.5 12.5L16 7Z"
            fill="#8F7450"
          />
        </g>
      )}
    </svg>
  );
};

export const StickerBadgeIllustration: React.FC<{
  iconType: StickerIconType;
  colorHex: string;
  className?: string;
}> = ({ iconType, colorHex, className = 'w-16 h-16' }) => {
  return (
    <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="45" fill={colorHex} fillOpacity="0.12" />
      <circle cx="50" cy="50" r="38" stroke={colorHex} strokeWidth="2.5" strokeDasharray="5 4" />
      <circle cx="50" cy="50" r="31" fill={colorHex} />

      {iconType === 'star' && (
        <path
          d="M50 28L55.8 40.2L69.2 42L59.4 51.3L61.8 64.6L50 58.2L38.2 64.6L40.6 51.3L30.8 42L44.2 40.2L50 28Z"
          fill="#FFFFFF"
        />
      )}
      {iconType === 'trophy' && (
        <g fill="#FFFFFF">
          <path d="M36 33H64V45C64 52.7 57.7 59 50 59C42.3 59 36 52.7 36 45V33Z" />
          <path d="M30 35H36V44C32.5 44 30 41.5 30 38V35Z" fillOpacity="0.8" />
          <path d="M64 35H70V38C70 41.5 67.5 44 64 44V35Z" fillOpacity="0.8" />
          <rect x="46" y="58" width="8" height="9" rx="1" />
          <rect x="38" y="66" width="24" height="5" rx="2.5" />
        </g>
      )}
      {iconType === 'team' && (
        <g fill="#FFFFFF">
          <circle cx="41" cy="41" r="6" />
          <circle cx="59" cy="41" r="6" />
          <path d="M31 61C31 54.5 35.5 50 41 50C46.5 50 51 54.5 51 61H31Z" />
          <path d="M49 61C49 54.5 53.5 50 59 50C64.5 50 69 54.5 69 61H49Z" fillOpacity="0.85" />
        </g>
      )}
      {iconType === 'leader' && (
        <g fill="#FFFFFF">
          <path d="M32 58L36 38L45 47L50 34L55 47L64 38L68 58H32Z" />
          <rect x="34" y="61" width="32" height="4" rx="2" />
        </g>
      )}
      {iconType === 'coop' && (
        <g stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M35 50C35 42 42 36 50 44C58 36 65 42 65 50C65 58 50 66 50 66C50 66 35 58 35 50Z" fill="#FFFFFF" />
        </g>
      )}
      {iconType === 'creative' && (
        <g fill="#FFFFFF">
          <circle cx="50" cy="50" r="16" stroke="#FFFFFF" strokeWidth="3" fill="none" />
          <path d="M36 44C44 46 56 46 64 44" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M36 56C44 54 56 54 64 56" stroke="#FFFFFF" strokeWidth="2.5" />
          <path d="M50 34V66" stroke="#FFFFFF" strokeWidth="2.5" />
        </g>
      )}
      {iconType === 'energy' && (
        <path d="M54 29L36 52H49L46 71L64 48H51L54 29Z" fill="#FFFFFF" />
      )}
      {iconType === 'pride' && (
        <g fill="#FFFFFF">
          <circle cx="50" cy="46" r="12" />
          <path d="M42 56L38 70L50 64L62 70L58 56" />
        </g>
      )}
    </svg>
  );
};
