import React from "react";

export default function ProgressHeader({ step, total, title }) {
  return (
    <div className="progress" aria-label="Progress">
      <div className="row" style={{ gap: 8 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className="dot" data-active={i + 1 === step} />
        ))}
      </div>
      <div className="progressText">
        Step {step}/{total} • {title}
      </div>
    </div>
  );
}
