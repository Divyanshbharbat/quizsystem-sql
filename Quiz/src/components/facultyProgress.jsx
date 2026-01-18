import React, { useEffect, useState } from "react";

const  facultyProgress = ({ percentage, color = "#4db8ff", size = 80, strokeWidth = 6 }) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(percentage / 50); // speed of increment
    const interval = setInterval(() => {
      start += step;
      if (start >= percentage) {
        start = percentage;
        clearInterval(interval);
      }
      setAnimatedPercentage(start);
    }, 20); // smooth updates
    return () => clearInterval(interval);
  }, [percentage]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedPercentage / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle (white) */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke="#e6e6e6"
        strokeWidth={strokeWidth}
        fill="transparent"
      />
      {/* Animated progress circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="transparent"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{
          transition: "stroke-dashoffset 0.3s ease-in-out",
        }}
      />
      {/* Percentage text */}
      <text
        x="50%"
        y="50%"
        dy="0.3em"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill={color}
      >
        {animatedPercentage}%
      </text>
    </svg>
  );
};

export default facultyProgress;
