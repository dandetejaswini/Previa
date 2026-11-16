import React from "react";

export interface PreviaBrandProps {
  variant?: "dark" | "light" | "auto";
  size?: "sm" | "md" | "lg" | "xl";
  showSubtitle?: boolean;
  subtitleText?: string;
  showAiBadge?: boolean;
  className?: string;
  onClick?: () => void;
}

export const PreviaBrandIcon: React.FC<{
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}> = ({ size = "md", className = "" }) => {
  const sizeMap = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
    xl: "w-12 h-12",
  };

  const iconSizeMap = {
    sm: "w-3.5 h-3.5",
    md: "w-4.5 h-4.5",
    lg: "w-5.5 h-5.5",
    xl: "w-7 h-7",
  };

  return (
    <div
      className={`${sizeMap[size]} rounded-xl bg-[#246B68] text-white flex items-center justify-center shadow-xs border border-[#246B68]/30 shrink-0 transition-transform ${className}`}
    >
      <svg
        className={`${iconSizeMap[size]} text-[#F7F6F1]`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Core Previa Supply-Chain Vector: Topological Network Nodes & Forward Trajectory */}
        <polygon points="12 2 19 6.5 19 17.5 12 22 5 17.5 5 6.5 12 2" />
        <path d="M12 22V12" />
        <path d="M12 12L19 6.5" />
        <path d="M12 12L5 6.5" />
        <circle cx="12" cy="12" r="2.5" fill="#B96F4A" stroke="none" />
      </svg>
    </div>
  );
};

export const PreviaBrand: React.FC<PreviaBrandProps> = ({
  variant = "dark",
  size = "md",
  showSubtitle = true,
  subtitleText = "Supply Chain Intelligence",
  showAiBadge = true,
  className = "",
  onClick,
}) => {
  const isDark = variant === "dark";

  const textSizeMap = {
    sm: {
      title: "text-base",
      badge: "text-[9px] px-1 py-0.2",
      sub: "text-[8px]",
    },
    md: {
      title: "text-lg",
      badge: "text-[10px] px-1.5 py-0.2",
      sub: "text-[9px]",
    },
    lg: {
      title: "text-2xl",
      badge: "text-xs px-2 py-0.5",
      sub: "text-[11px]",
    },
    xl: {
      title: "text-3xl",
      badge: "text-sm px-2.5 py-0.5",
      sub: "text-xs",
    },
  };

  const content = (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <PreviaBrandIcon size={size} />
      <div className="flex flex-col text-left">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`${textSizeMap[size].title} font-editorial font-bold tracking-tight ${
              isDark ? "text-white" : "text-[#201A24]"
            }`}
          >
            Previa
          </span>
          {showAiBadge && (
            <span
              className={`${textSizeMap[size].badge} font-mono font-bold uppercase rounded-xs bg-[#B96F4A] text-white tracking-wider`}
            >
              AI
            </span>
          )}
        </div>
        {showSubtitle && (
          <span
            className={`${textSizeMap[size].sub} font-mono font-medium tracking-wider uppercase mt-1 ${
              isDark ? "text-[#D8D0C3]/80" : "text-[#5C8178]"
            }`}
          >
            {subtitleText}
          </span>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="focus:outline-hidden group cursor-pointer hover:opacity-95 transition-opacity text-left"
      >
        {content}
      </button>
    );
  }

  return content;
};
