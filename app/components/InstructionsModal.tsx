"use client";

import React, { useState } from "react";

const permissionsStep = {
  label: "Permissions Required",
  labelClass: "blue",
  role: "Before we begin",
  title: "Camera & Audio Access",
  desc: "This application requires camera and audio permissions to track your hand gestures and process voice commands. Please allow access when prompted.",
  svg: (
    <svg width="80" height="90" viewBox="0 0 80 90">
      <circle
        cx="40"
        cy="35"
        r="20"
        fill="#B5D4F4"
        stroke="#378ADD"
        strokeWidth="0.5"
      />
      <path d="M25 35 L55 35" stroke="#378ADD" strokeWidth="0.5" />
      <path d="M40 20 L40 50" stroke="#378ADD" strokeWidth="0.5" />
      <rect
        x="20"
        y="55"
        width="40"
        height="25"
        rx="8"
        fill="#B5D4F4"
        stroke="#378ADD"
        strokeWidth="0.5"
      />
      <path d="M30 67 L35 67 L35 70 L30 70 Z" fill="#378ADD" />
      <path d="M45 67 L50 67 L50 70 L45 70 Z" fill="#378ADD" />
      <path
        d="M32 60 L48 60"
        stroke="#378ADD"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const hands = [
  {
    label: "Left hand",
    labelClass: "blue",
    role: "Surgery control",
    title: "Perform surgery",
    desc: "Use left hand to draw incisions and interact with anatomy structures",
    svg: (
      <svg width="80" height="90" viewBox="0 0 80 90">
        <rect
          x="28"
          y="8"
          width="10"
          height="32"
          rx="5"
          fill="#B5D4F4"
          stroke="#378ADD"
          strokeWidth="0.5"
        />
        <rect
          x="40"
          y="4"
          width="10"
          height="36"
          rx="5"
          fill="#B5D4F4"
          stroke="#378ADD"
          strokeWidth="0.5"
        />
        <rect
          x="52"
          y="8"
          width="10"
          height="32"
          rx="5"
          fill="#B5D4F4"
          stroke="#378ADD"
          strokeWidth="0.5"
        />
        <rect
          x="63"
          y="14"
          width="9"
          height="26"
          rx="4"
          fill="#B5D4F4"
          stroke="#378ADD"
          strokeWidth="0.5"
        />
        <rect
          x="18"
          y="30"
          width="54"
          height="36"
          rx="10"
          fill="#B5D4F4"
          stroke="#378ADD"
          strokeWidth="0.5"
        />
        <rect
          x="10"
          y="42"
          width="14"
          height="20"
          rx="7"
          fill="#B5D4F4"
          stroke="#378ADD"
          strokeWidth="0.5"
        />
        <path
          d="M32 68 Q40 78 48 68"
          fill="none"
          stroke="#378ADD"
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Right hand",
    labelClass: "purple",
    role: "Camera control",
    title: "Rotate view",
    desc: "Move right hand to orbit and rotate the 3D anatomy model in any direction",
    svg: (
      <svg width="80" height="90" viewBox="0 0 80 90">
        <defs>
          <marker
            id="arr2"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path
              d="M2 1L8 5L2 9"
              fill="none"
              stroke="#7F77DD"
              strokeWidth="1.5"
            />
          </marker>
        </defs>
        <rect
          x="28"
          y="8"
          width="10"
          height="32"
          rx="5"
          fill="#CECBF6"
          stroke="#7F77DD"
          strokeWidth="0.5"
        />
        <rect
          x="40"
          y="4"
          width="10"
          height="36"
          rx="5"
          fill="#CECBF6"
          stroke="#7F77DD"
          strokeWidth="0.5"
        />
        <rect
          x="52"
          y="8"
          width="10"
          height="32"
          rx="5"
          fill="#CECBF6"
          stroke="#7F77DD"
          strokeWidth="0.5"
        />
        <rect
          x="63"
          y="14"
          width="9"
          height="26"
          rx="4"
          fill="#CECBF6"
          stroke="#7F77DD"
          strokeWidth="0.5"
        />
        <rect
          x="18"
          y="30"
          width="54"
          height="36"
          rx="10"
          fill="#CECBF6"
          stroke="#7F77DD"
          strokeWidth="0.5"
        />
        <rect
          x="10"
          y="42"
          width="14"
          height="20"
          rx="7"
          fill="#CECBF6"
          stroke="#7F77DD"
          strokeWidth="0.5"
        />
        <path
          d="M26 50 L20 50"
          stroke="#7F77DD"
          strokeWidth="1.5"
          strokeLinecap="round"
          markerEnd="url(#arr2)"
        />
        <path
          d="M54 50 L60 50"
          stroke="#7F77DD"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M40 36 L40 30"
          stroke="#7F77DD"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M40 64 L40 70"
          stroke="#7F77DD"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    label: "Voice AI",
    labelClass: "teal",
    role: "Either hand",
    title: "Start / stop recording",
    desc: "Thumbs up to start recording. Switch to a different hand gesture to stop",
    svg: (
      <svg width="80" height="90" viewBox="0 0 80 90">
        <rect
          x="20"
          y="30"
          width="54"
          height="36"
          rx="10"
          fill="#9FE1CB"
          stroke="#1D9E75"
          strokeWidth="0.5"
        />
        <rect
          x="12"
          y="42"
          width="14"
          height="20"
          rx="7"
          fill="#9FE1CB"
          stroke="#1D9E75"
          strokeWidth="0.5"
        />
        <rect
          x="20"
          y="18"
          width="10"
          height="20"
          rx="5"
          fill="#9FE1CB"
          stroke="#1D9E75"
          strokeWidth="0.5"
        />
        <rect
          x="32"
          y="14"
          width="10"
          height="24"
          rx="5"
          fill="#9FE1CB"
          stroke="#1D9E75"
          strokeWidth="0.5"
        />
        <rect
          x="44"
          y="18"
          width="10"
          height="20"
          rx="5"
          fill="#9FE1CB"
          stroke="#1D9E75"
          strokeWidth="0.5"
        />
        <rect
          x="56"
          y="22"
          width="9"
          height="16"
          rx="4"
          fill="#9FE1CB"
          stroke="#1D9E75"
          strokeWidth="0.5"
        />
        <line
          x1="26"
          y1="55"
          x2="56"
          y2="55"
          stroke="#1D9E75"
          strokeWidth="1"
          strokeDasharray="3 2"
        />
        <circle cx="41" cy="55" r="4" fill="#1D9E75" opacity="0.3" />
        <circle cx="41" cy="55" r="2" fill="#1D9E75" />
      </svg>
    ),
  },
];

const labelStyles: Record<string, React.CSSProperties> = {
  blue: { background: "#1e3a5f", color: "#B5D4F4" },
  purple: { background: "#3c3489", color: "#CECBF6" },
  teal: { background: "#1D9E75", color: "#9FE1CB" },
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    fontFamily: "sans-serif",
    padding: "4px 0 16px",
  },
  card: {
    background: "#1e293b",
    border: "0.5px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "16px",
    textAlign: "center" as const,
    maxWidth: "280px",
    margin: "0 auto",
  },
  pill: {
    fontSize: "11px",
    fontWeight: 500,
    padding: "2px 9px",
    borderRadius: "20px",
    display: "inline-block",
    marginBottom: "12px",
  },
  role: {
    fontSize: "10px",
    color: "#94a3b8",
    marginBottom: "8px",
  },
  handWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "12px",
  },
  cardTitle: {
    fontSize: "13px",
    fontWeight: 500,
    color: "#f1f5f9",
    marginBottom: "4px",
  },
  cardDesc: {
    fontSize: "11px",
    color: "#94a3b8",
    lineHeight: 1.6,
  },
  stepIndicator: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
    marginBottom: "24px",
  },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    background: "#334155",
    transition: "all 0.3s ease",
  },
  dotActive: {
    background: "#378ADD",
  },
};

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

export default function InstructionsModal({
  isOpen,
  onClose,
  onFinish,
}: InstructionsModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < hands.length) {
      setCurrentStep(currentStep + 1);
    } else {
      onFinish();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const allSteps = [permissionsStep, ...hands];
  const currentHand = allSteps[currentStep];
  const isLastStep = currentStep === allSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-100">Controls Guide</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Step indicator */}
          <div style={styles.stepIndicator}>
            {allSteps.map((_, index) => (
              <div
                key={index}
                style={{
                  ...styles.dot,
                  ...(index === currentStep ? styles.dotActive : {}),
                }}
              />
            ))}
          </div>

          {/* Step label */}
          <div className="text-center mb-6">
            <span className="text-sm font-medium text-slate-400">
              Step {currentStep + 1} of {allSteps.length}
            </span>
          </div>

          {/* Current step card */}
          <div style={styles.wrapper}>
            <div style={styles.card}>
              <span
                style={{
                  ...styles.pill,
                  ...labelStyles[currentHand.labelClass],
                }}
              >
                {currentHand.label}
              </span>
              <div style={styles.role}>{currentHand.role}</div>
              <div style={styles.handWrap}>{currentHand.svg}</div>
              <div style={styles.cardTitle}>{currentHand.title}</div>
              <div style={styles.cardDesc}>{currentHand.desc}</div>
            </div>
          </div>
        </div>

        {/* Footer with navigation buttons */}
        <div className="sticky bottom-0 bg-slate-900 border-t border-slate-700 px-6 py-4 flex justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-6 py-2 rounded-full transition-all text-sm font-bold ${
              currentStep === 0
                ? "text-slate-500 cursor-not-allowed"
                : "bg-slate-700 text-slate-200 hover:bg-slate-600"
            }`}
          >
            Back
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 rounded-full bg-primary text-white hover:brightness-110 transition-all text-sm font-bold"
          >
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
