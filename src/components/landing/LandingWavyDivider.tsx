import React from "react";
import type { ThemeConfig } from "@/types/mobilityLanding";

interface LandingWavyDividerProps {
  theme: ThemeConfig;
}

export const LandingWavyDivider: React.FC<LandingWavyDividerProps> = ({ theme }) => {
  return (
    <div className="relative w-full overflow-hidden leading-none z-10 -mb-[1px]">
      <svg
        className="relative block w-full h-[52px] sm:h-[64px]"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,0 C150,90 400,115 650,85 C900,55 1050,95 1200,110 L1200,120 L0,120 Z"
          fill={theme?.bgLight || "#F1F5F9"}
        />
      </svg>
    </div>
  );
};
