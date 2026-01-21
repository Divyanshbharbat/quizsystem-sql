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
    <div style={{ 
      position: "relative",
      width: "220px",
      height: "120px",
      margin: "0 auto",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <svg width="220" height="120" viewBox="0 0 220 120" style={{ position: "absolute" }}>
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

      <div style={{
        position: "absolute",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        height: "100%",
        paddingBottom: "16px",
        width: "100%"
      }}>
        <p style={{
          fontSize: "32px",
          fontWeight: "bold",
          color: "#22c55e",
          margin: "0"
        }}>
          {percentage}%
        </p>
        <p style={{
          fontSize: "14px",
          color: "#999",
          margin: "4px 0 0 0"
        }}>
          Overall Score
        </p>
      </div>
    </div>
  );
};

export default HalfCircleGauge;
