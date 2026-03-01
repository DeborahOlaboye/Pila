"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Circle, Loader2 } from "lucide-react";

const STEPS = [
  { id: 1, label: "Generating dedicated wallet..." },
  { id: 2, label: "Writing skill handler code..." },
  { id: 3, label: "Starting skill server process..." },
  { id: 4, label: "Testing endpoint connectivity..." },
  { id: 5, label: "Registering in marketplace..." },
];

type StepStatus = "pending" | "running" | "done";

interface Props {
  isDeploying: boolean;
  onComplete?: () => void;
}

export function DeploymentStatus({ isDeploying, onComplete }: Props) {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(
    STEPS.map(() => "pending")
  );
  const [currentStep, setCurrentStep] = useState(-1);

  useEffect(() => {
    if (!isDeploying) {
      setStepStatuses(STEPS.map(() => "pending"));
      setCurrentStep(-1);
      return;
    }

    setCurrentStep(0);
    setStepStatuses(["running", ...STEPS.slice(1).map(() => "pending" as StepStatus)]);

    const timers: ReturnType<typeof setTimeout>[] = [];
    STEPS.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setStepStatuses((prev) => {
            const next = [...prev];
            if (i > 0) next[i - 1] = "done";
            next[i] = "running";
            return next;
          });
          setCurrentStep(i);
        }, i * 700)
      );
    });

    timers.push(
      setTimeout(() => {
        setStepStatuses(STEPS.map(() => "done"));
        setCurrentStep(STEPS.length);
        onComplete?.();
      }, STEPS.length * 700 + 400)
    );

    return () => timers.forEach(clearTimeout);
  }, [isDeploying, onComplete]);

  return (
    <div style={{
      background: "#111827", borderRadius: 12, padding: 24,
      border: "1px solid #1F2937",
    }}>
      <div style={{ marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
        Deployment Progress
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {STEPS.map((step, i) => {
          const status = stepStatuses[i];
          return (
            <div key={step.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {status === "done" ? (
                <CheckCircle size={18} style={{ color: "#10B981", flexShrink: 0 }} />
              ) : status === "running" ? (
                <Loader2 size={18} style={{ color: "#8B5CF6", flexShrink: 0, animation: "spin 1s linear infinite" }} />
              ) : (
                <Circle size={18} style={{ color: "#374151", flexShrink: 0 }} />
              )}
              <span style={{
                fontSize: 14,
                color: status === "done" ? "#10B981" : status === "running" ? "#F9FAFB" : "#4B5563",
                fontFamily: "monospace",
                transition: "color 0.3s",
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
