import React from 'react';

interface BkbLogoProps {
  size?: number;
  color?: string;
  showText?: boolean;
  textColor?: string;
  horizontal?: boolean;
  className?: string;
}

export const BkbLogo: React.FC<BkbLogoProps> = ({
  size = 64,
  color = 'currentColor',
  showText = true,
  textColor = 'var(--text-primary)',
  horizontal = false,
  className = '',
}) => {
  const burgerIcon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="bkb-logo-icon"
      style={{ transition: 'all 0.3s ease' }}
    >
      {/* Top Bun with Sesame Seeds */}
      <path
        d="M 12 35 C 12 18, 88 18, 88 35 C 88 40, 78 45, 68 45 C 58 45, 12 45, 12 35 Z"
        fill={color}
      />
      {/* Sesame Seeds */}
      <circle cx="35" cy="23" r="1.5" fill="var(--background)" opacity="0.85" />
      <circle cx="50" cy="20" r="1.5" fill="var(--background)" opacity="0.85" />
      <circle cx="65" cy="23" r="1.5" fill="var(--background)" opacity="0.85" />
      <circle cx="42" cy="28" r="1.5" fill="var(--background)" opacity="0.85" />
      <circle cx="58" cy="28" r="1.5" fill="var(--background)" opacity="0.85" />

      {/* Middle Patty Layer (Upper B Curve) */}
      <path
        d="M 12 50 C 12 48, 88 48, 88 50 C 88 56, 76 60, 68 60 L 12 60 Z"
        fill={color}
      />

      {/* Middle Wavy Ingredient (Cheese/Lettuce) */}
      <path
        d="M 12 65 C 20 62, 28 68, 36 65 C 44 62, 52 68, 60 65 C 68 62, 76 68, 88 65"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />

      {/* Bottom Bun Layer (Lower B Curve) */}
      <path
        d="M 12 70 H 68 C 76 70, 88 74, 88 80 C 88 86, 76 88, 68 88 H 12 C 12 80, 12 70, 12 70 Z"
        fill={color}
      />
      {/* Inner Rounded B outlines */}
      <path
        d="M 12 35 L 12 80 C 12 84, 16 88, 20 88 H 68 C 84 88, 92 82, 92 74 C 92 68, 86 63, 80 62 C 86 61, 92 56, 92 48 C 92 40, 84 35, 68 35 H 12 Z"
        stroke={color}
        strokeWidth="4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );

  if (!showText) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {burgerIcon}
      </div>
    );
  }

  if (horizontal) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        {burgerIcon}
        <div className="flex flex-col text-left">
          <span
            style={{
              fontFamily: 'Outfit',
              fontWeight: 900,
              fontSize: '1.4rem',
              color: textColor,
              letterSpacing: '0.5px',
              lineHeight: 1,
            }}
          >
            BKB
          </span>
          <span
            style={{
              fontFamily: 'Outfit',
              fontWeight: 600,
              fontSize: '0.62rem',
              color: 'var(--primary)',
              letterSpacing: '1.5px',
              lineHeight: 1.2,
              marginTop: '2px',
            }}
          >
            BUKAN KEDAI BURGER
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {burgerIcon}
      <div className="mt-2">
        <h1
          style={{
            fontFamily: 'Outfit',
            fontWeight: 900,
            fontSize: '1.75rem',
            color: textColor,
            letterSpacing: '2px',
            lineHeight: 1,
            margin: 0,
          }}
        >
          BKB
        </h1>
        <p
          style={{
            fontFamily: 'Outfit',
            fontWeight: 600,
            fontSize: '0.72rem',
            color: 'var(--primary)',
            letterSpacing: '2.5px',
            margin: '4px 0 0 0',
            textTransform: 'uppercase',
          }}
        >
          Bukan Kedai Burger
        </p>
      </div>
    </div>
  );
};
