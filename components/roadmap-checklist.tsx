"use client";

import { useEffect, useMemo, useState } from "react";

type RoadmapChecklistProps = {
  slug: string;
  items: string[];
};

type ChecklistState = Record<string, boolean>;

const buildKey = (slug: string) => `tayyari:roadmap:${slug}`;

export function RoadmapChecklist({ slug, items }: RoadmapChecklistProps) {
  const storageKey = useMemo(() => buildKey(slug), [slug]);
  const [state, setState] = useState<ChecklistState>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }
      const parsed = JSON.parse(raw) as ChecklistState;
      if (parsed && typeof parsed === "object") {
        setState(parsed);
      }
    } catch {
      // Ignore storage errors.
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore storage errors.
    }
  }, [state, storageKey]);

  const toggle = (item: string) => {
    setState((prev) => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  return (
    <ul className="roadmap-checklist">
      {items.map((item) => {
        const checked = Boolean(state[item]);
        return (
          <li key={item} className={`roadmap-item ${checked ? "done" : ""}`}>
            <label className="roadmap-label">
              <input type="checkbox" checked={checked} onChange={() => toggle(item)} />
              <span>{item}</span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
