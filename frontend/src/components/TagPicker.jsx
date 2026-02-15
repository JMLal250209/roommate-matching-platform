import React, { useMemo, useState } from "react";

export default function TagPicker({ value = [], onChange, suggested = [] }) {
  const [custom, setCustom] = useState("");
  const selected = useMemo(() => new Set(value), [value]);

  function toggle(tag) {
    const next = new Set(selected);
    if (next.has(tag)) next.delete(tag);
    else next.add(tag);
    onChange(Array.from(next));
  }

  function addCustom() {
    const t = custom.trim();
    if (!t) return;
    if (t.length > 24) return;
    toggle(t);
    setCustom("");
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div className="row">
        {suggested.map((tag) => {
          const active = selected.has(tag);
          return (
            <button
              key={tag}
              type="button"
              className="tagBtn"
              onClick={() => toggle(tag)}
              aria-pressed={active}
              style={{
                borderColor: active ? "rgba(15,69,112,0.35)" : undefined,
                background: active ? "rgba(15,69,112,0.08)" : undefined,
              }}
            >
              {tag}
            </button>
          );
        })}
      </div>

      <div className="row">
        <input
          className="input"
          style={{ maxWidth: 280 }}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Add a custom tag (e.g. hiking)"
        />
        <button type="button" className="btn btnSecondary" onClick={addCustom}>
          Add
        </button>
      </div>
    </div>
  );
}
