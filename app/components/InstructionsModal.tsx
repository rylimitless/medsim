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
      <circle cx="40" cy="35" r="20" fill="#B5D4F4" stroke="#378ADD" strokeWidth="0.5" />
      <path d="M25 35 L55 35" stroke="#378ADD" strokeWidth="0.5" />
      <path d="M40 20 L40 50" stroke="#378ADD" strokeWidth="0.5" />
      <rect x="20" y="55" width="40" height="25" rx="8" fill="#B5D4F4" stroke="#378ADD" strokeWidth="0.5" />
      <path d="M30 67 L35 67 L35 70 L30 70 Z" fill="#378ADD" />
      <path d="M45 67 L50 67 L50 70 L45 70 Z" fill="#378ADD" />
      <path d="M32 60 L48 60" stroke="#378ADD" strokeWidth="1" strokeLinecap="round" />
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
        <rect x="28" y="8" width="10" height="32" rx="5" fill="#B5D4F4" stroke="#378ADD" strokeWidth="0.5" />
        <rect x="40" y="4" width="10" height="36" rx="5" fill="#B5D4F4" stroke="#378ADD" strokeWidth="0.5" />
        <rect x="52" y="8" width="10" height="32" rx="5" fill="#B5D4F4" stroke="#378ADD" strokeWidth="0.5" />
        <rect x="63" y="14" width="9" height="26" rx="4" fill="#B5D4F4" stroke="#378ADD" strokeWidth="0.5" />
        <rect x="18" y="30" width="54" height="36" rx="10" fill="#B5D4F4" stroke="#378ADD" strokeWidth="0.5" />
        <rect x="10" y="42" width="14" height="20" rx="7" fill="#B5D4F4" stroke="#378ADD" strokeWidth="0.5" />
        <path d="M32 68 Q40 78 48 68" fill="none" stroke="#378ADD" strokeWidth="1" strokeLinecap="round" />
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
          <marker id="arr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="#7F77DD" strokeWidth="1.5" />
          </marker>
        </defs>
        <rect x="28" y="8" width="10" height="32" rx="5" fill="#CECBF6" stroke="#7F77DD" strokeWidth="0.5" />
        <rect x="40" y="4" width="10" height="36" rx="5" fill="#CECBF6" stroke="#7F77DD" strokeWidth="0.5" />
        <rect x="52" y="8" width="10" height="32" rx="5" fill="#CECBF6" stroke="#7F77DD" strokeWidth="0.5" />
        <rect x="63" y="14" width="9" height="26" rx="4" fill="#CECBF6" stroke="#7F77DD" strokeWidth="0.5" />
        <rect x="18" y="30" width="54" height="36" rx="10" fill="#CECBF6" stroke="#7F77DD" strokeWidth="0.5" />
        <rect x="10" y="42" width="14" height="20" rx="7" fill="#CECBF6" stroke="#7F77DD" strokeWidth="0.5" />
        <path d="M26 50 L20 50" stroke="#7F77DD" strokeWidth="1.5" strokeLinecap="round" markerEnd="url(#arr2)" />
        <path d="M54 50 L60 50" stroke="#7F77DD" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M40 36 L40 30" stroke="#7F77DD" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M40 64 L40 70" stroke="#7F77DD" strokeWidth="1.5" strokeLinecap="round" />
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
        <rect x="20" y="30" width="54" height="36" rx="10" fill="#9FE1CB" stroke="#1D9E75" strokeWidth="0.5" />
        <rect x="12" y="42" width="14" height="20" rx="7" fill="#9FE1CB" stroke="#1D9E75" strokeWidth="0.5" />
        <rect x="20" y="18" width="10" height="20" rx="5" fill="#9FE1CB" stroke="#1D9E75" strokeWidth="0.5" />
        <rect x="32" y="14" width="10" height="24" rx="5" fill="#9FE1CB" stroke="#1D9E75" strokeWidth="0.5" />
        <rect x="44" y="18" width="10" height="20" rx="5" fill="#9FE1CB" stroke="#1D9E75" strokeWidth="0.5" />
        <rect x="56" y="22" width="9" height="16" rx="4" fill="#9FE1CB" stroke="#1D9E75" strokeWidth="0.5" />
        <line x1="26" y1="55" x2="56" y2="55" stroke="#1D9E75" strokeWidth="1" strokeDasharray="3 2" />
        <circle cx="41" cy="55" r="4" fill="#1D9E75" opacity="0.3" />
        <circle cx="41" cy="55" r="2" fill="#1D9E75" />
      </svg>
    ),
  },
];

/* DESIGN.md label chip styles — ghost outline unless active */
const labelStyles: Record<string, React.CSSProperties> = {
  blue:   { border: "1px solid rgba(45,94,162,0.5)",  color: "var(--primary, #2d5ea2)",  background: "rgba(45,94,162,0.1)",  borderRadius: "9999px" },
  purple: { border: "1px solid rgba(127,119,221,0.5)", color: "#7f77dd",                 background: "rgba(127,119,221,0.1)", borderRadius: "9999px" },
  teal:   { border: "1px solid rgba(29,158,117,0.5)",  color: "#1d9e75",                 background: "rgba(29,158,117,0.1)",  borderRadius: "9999px" },
};

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: () => void;
}

export default function InstructionsModal({ isOpen, onClose, onFinish }: InstructionsModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < hands.length) setCurrentStep(currentStep + 1);
    else onFinish();
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const allSteps = [permissionsStep, ...hands];
  const currentHand = allSteps[currentStep];
  const isLastStep = currentStep === allSteps.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop — DESIGN.md: overlay with blur */}
      <div className="absolute inset-0 backdrop-blur-sm" style={{ background: "rgba(6,14,32,0.7)" }} onClick={onClose} />

      {/* Modal — DESIGN.md: Surface Layer + 8px radius */}
      <div
        className="relative max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
        style={{ background: "var(--surface-container, #1e293b)", border: "1px solid var(--outline-variant, #424750)", borderRadius: "8px" }}
      >
        {/* Header */}
        <div
          className="sticky top-0 px-6 py-4 flex items-center justify-between"
          style={{ background: "var(--surface-container, #1e293b)", borderBottom: "1px solid var(--outline-variant, #424750)", borderRadius: "8px 8px 0 0" }}
        >
          {/* DESIGN.md: headline-lg */}
          <h2 className="text-xl font-semibold tracking-tight" style={{ color: "var(--foreground, #dae2fd)" }}>
            Controls Guide
          </h2>
          <button
            onClick={onClose}
            className="p-2 transition-colors"
            style={{ borderRadius: "4px" }}
            aria-label="Close"
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(169,199,255,0.1)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <svg className="w-5 h-5" style={{ color: "var(--on-surface-muted, #8d919c)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Step indicator — DESIGN.md: fully circular status dots */}
          <div className="flex justify-center gap-2 mb-6">
            {allSteps.map((_, index) => (
              <div
                key={index}
                className="status-dot transition-all duration-300"
                style={index === currentStep
                  ? { background: "var(--primary, #a9c7ff)", boxShadow: "0 0 6px rgba(169,199,255,0.5)" }
                  : { background: "var(--outline-variant, #424750)" }
                }
              />
            ))}
          </div>

          {/* Step counter — DESIGN.md: label-sm metadata */}
          <div className="text-center mb-6">
            <span className="label-mono text-[10px] tracking-widest uppercase" style={{ color: "var(--on-surface-muted, #8d919c)" }}>
              Step {currentStep + 1} of {allSteps.length}
            </span>
          </div>

          {/* Card — DESIGN.md: Surface Layer */}
          <div
            className="text-center p-6"
            style={{ background: "var(--surface-container-high, #222a3d)", border: "1px solid var(--outline-variant, #424750)", borderRadius: "8px" }}
          >
            {/* Ghost chip label */}
            <span className="label-mono text-[11px] tracking-widest inline-block mb-3 px-3 py-1" style={labelStyles[currentHand.labelClass]}>
              {currentHand.label}
            </span>

            <div className="label-mono text-[10px] mb-4 tracking-widest uppercase" style={{ color: "var(--on-surface-muted, #8d919c)" }}>
              {currentHand.role}
            </div>

            <div className="flex justify-center mb-4">{currentHand.svg}</div>

            {/* DESIGN.md: body-md */}
            <div className="text-sm font-semibold mb-2" style={{ color: "var(--foreground, #dae2fd)" }}>
              {currentHand.title}
            </div>
            <div className="text-xs leading-relaxed" style={{ color: "var(--on-surface-muted, #8d919c)" }}>
              {currentHand.desc}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="sticky bottom-0 px-6 py-4 flex justify-between"
          style={{ background: "var(--surface-container, #1e293b)", borderTop: "1px solid var(--outline-variant, #424750)", borderRadius: "0 0 8px 8px" }}
        >
          {/* Ghost back button */}
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className="px-6 py-2 label-mono text-xs tracking-widest uppercase transition-all"
            style={currentStep === 0
              ? { color: "var(--outline-variant, #424750)", cursor: "not-allowed", borderRadius: "4px" }
              : { border: "1px solid var(--primary, #a9c7ff)", color: "var(--primary, #a9c7ff)", borderRadius: "4px", background: "transparent" }
            }
          >
            Back
          </button>

          {/* Primary action — DESIGN.md: surgical red CTA for terminal action */}
          <button
            onClick={handleNext}
            className="btn-surgical px-6 py-2 label-mono text-xs tracking-widest uppercase hover:brightness-110 transition-all red-accent-glow"
            style={{ borderRadius: "4px" }}
          >
            {isLastStep ? "Launch" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
