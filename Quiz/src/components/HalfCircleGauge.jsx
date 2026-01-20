import React, { useEffect, useState } from "react";

const HalfCircleGauge = ({ percentage }) => {
  const radius = 90;
  const circumference = Math.PI * radius;

  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const progressOffset =
      circumference - (percentage / 100) * circumference;
    setTimeout(() => setOffset(progressOffset), 200);
  }, [percentage, circumference]);

  return (
    <div className="relative w-[220px] h-[120px] mx-auto">
      <svg width="220" height="120" viewBox="0 0 220 120">
        {/* background */}
        <path
          d="M20 100 A90 90 0 0 1 200 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />

        {/* progress */}
        <path
          d="M20 100 A90 90 0 0 1 200 100"
          fill="none"
          stroke="#22c55e"
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-4">
        <p className="text-3xl font-bold text-green-600">
          {percentage}%
        </p>
        <p className="text-sm text-gray-500">Overall Score</p>
      </div>
    </div>
  );
};

export default HalfCircleGauge;
