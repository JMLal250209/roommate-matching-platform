import React from "react";

export default function PillSelect({ options, value, onChange, ariaLabel }) {
  return (
    <div className="row" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          type="button"
          key={opt.value}
          className="pill"
          data-active={value === opt.value}
          onClick={() => onChange(opt.value)}
          role="radio"
          aria-checked={value === opt.value}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
