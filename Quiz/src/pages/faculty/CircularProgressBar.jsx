// CircularProgressBar.jsx
import React, { useEffect, useState } from 'react';

const CircularProgressBar = ({ percentage }) => {
    const [animatedPercentage, setAnimatedPercentage] = useState(0);

    useEffect(() => {
        const animationDuration = 1000; // Animation duration in milliseconds
        const stepTime = Math.abs(Math.floor(animationDuration / percentage));
        let currentPercentage = 0;

        const intervalId = setInterval(() => {
            if (currentPercentage >= percentage) {
                clearInterval(intervalId);
            } else {
                currentPercentage++;
                setAnimatedPercentage(currentPercentage);
            }
        }, stepTime);

        return () => clearInterval(intervalId); // Cleanup interval on unmount
    }, [percentage]);

    const radius = 15; // Size of the circle
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (animatedPercentage / 100) * circumference;

    return (
        <svg className="circular-progress" viewBox="0 0 36 36">
            <circle
                className="circle-bg"
                cx="18"
                cy="18"
                r={radius}
                stroke="#e6e6e6"
                strokeWidth="4" // Increased stroke width for better visibility
                fill="transparent"
            />
            <circle
                className="circle"
                cx="18"
                cy="18"
                r={radius}
                stroke="#4db8ff"
                strokeWidth="4" // Increased stroke width for better visibility
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} // Animation for the stroke
            />
            <text x="50%" y="50%" alignmentBaseline="middle" textAnchor="middle" className="percentage">
                {animatedPercentage}%
            </text>
        </svg>
    );
};

export default CircularProgressBar;
