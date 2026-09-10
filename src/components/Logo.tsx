import React from "react";

interface LogoProps {
  className?: string;
  variant?: "wordmark" | "compact" | "icon";
  textColor?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({
  className = "",
  variant = "wordmark",
  textColor = "text-slate-900",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "text-xs tracking-[0.14em]",
    md: "text-sm tracking-[0.16em]",
    lg: "text-lg tracking-[0.18em]",
  };

  if (variant === "icon") {
    return (
      <div
        id="checkin-checkout-icon"
        className={`w-8 h-8 rounded-lg bg-slate-950 text-white flex items-center justify-center font-black shadow-2xs shrink-0 select-none ${className}`}
      >
        <span className="text-[11px] font-extrabold tracking-tighter">C⇄C</span>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div id="checkin-checkout-logo-compact" className={`flex items-center gap-2 ${className}`}>
        <div className="w-6 h-6 rounded-md bg-slate-950 text-white flex items-center justify-center font-black shadow-2xs shrink-0 select-none">
          <span className="text-[9px] font-extrabold tracking-tighter">C⇄C</span>
        </div>
        <span className={`font-black uppercase ${sizeClasses[size]} ${textColor} whitespace-nowrap`}>
          Checkin Checkout
        </span>
      </div>
    );
  }

  return (
    <div id="checkin-checkout-logo" className={`flex items-center gap-2 select-none ${className}`}>
      <span
        className={`font-black uppercase ${sizeClasses[size]} ${textColor} transition-colors whitespace-nowrap leading-none`}
        style={{
          letterSpacing: "0.16em",
          fontStretch: "115%",
        }}
      >
        CHECKIN CHECKOUT
      </span>
    </div>
  );
};
