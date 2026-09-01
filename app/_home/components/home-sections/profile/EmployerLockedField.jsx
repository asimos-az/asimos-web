"use client";

import { useEffect, useRef, useState } from "react";

export default function EmployerLockedField({
  fieldKey,
  label,
  value,
  required,
  placeholder,
  onValueChange,
  onRequest,
}) {
  const initialValueRef = useRef(String(value || "").trim());
  const [inputValue, setInputValue] = useState(value || "");
  const [unlocked, setUnlocked] = useState(!initialValueRef.current);
  const hasSavedValue = Boolean(initialValueRef.current);

  useEffect(() => {
    setInputValue(value || "");
    if (!String(value || "").trim()) {
      setUnlocked(true);
    }
  }, [value]);

  const locked = hasSavedValue && !unlocked;

  function handleInputChange(event) {
    const nextValue = event.target.value;
    setInputValue(nextValue);
    onValueChange?.(nextValue);
  }

  function handleRequestClick() {
    const nextValue = String(inputValue || "").trim();
    if (!nextValue) return;

    onRequest?.({
      fieldKey,
      fieldLabel: label,
      oldValue: initialValueRef.current,
      newValue: nextValue,
      hasSavedValue,
    });
  }

  return (
    <div className={`employer-field employer-field-locked ${locked ? "is-locked" : "is-open"}`}>
      <div className="employer-field-top">
        <label>{label} {required ? <span>*</span> : null}</label>
        <div className="employer-lock-actions">
          {hasSavedValue ? (
            <button
              type="button"
              className={`employer-lock-toggle ${locked ? "" : "open"}`}
              onClick={() => setUnlocked(true)}
              disabled={!locked}
            >
              {locked ? "🔒 Kilidi aç" : "🔓 Açıq"}
            </button>
          ) : (
            <span className="employer-lock-toggle open">🔓 Açıq</span>
          )}
          <button
            type="button"
            className="employer-request-button"
            onClick={handleRequestClick}
            disabled={locked || !String(inputValue || "").trim()}
          >
            Dəyişiklik sorğusu
          </button>
        </div>
      </div>
      <input
        value={inputValue}
        disabled={locked}
        readOnly={locked}
        onChange={handleInputChange}
        placeholder={placeholder}
      />
    </div>
  );
}
