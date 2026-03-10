"use client";

import { useEffect, useMemo, useState } from "react";
import { StarIcon } from "@/components/ui-icons";

type RoadmapChecklistProps = {
  slug: string;
  sections: RoadmapSection[];
};

type ChecklistState = Record<string, boolean>;

const buildKey = (slug: string) => `tayyari:roadmap:${slug}`;

export type RoadmapSection = {
  title: string;
  subtopics: Array<{
    title: string;
    highWeight?: boolean;
  }>;
};

export function RoadmapChecklist({ slug, sections }: RoadmapChecklistProps) {
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
    <div className="roadmap-checklist">
      {sections.map((section) => (
        <section key={section.title} className="roadmap-section">
          <h3>{section.title}</h3>
          <ul className="roadmap-subtopics">
            {section.subtopics.map((subtopic) => {
              const key = `${section.title}::${subtopic.title}`;
              const checked = Boolean(state[key]);
              return (
                <li key={key} className={`roadmap-item ${checked ? "done" : ""}`}>
                  <label className="roadmap-label">
                    <input type="checkbox" checked={checked} onChange={() => toggle(key)} />
                    <span>{subtopic.title}</span>
                    {subtopic.highWeight ? (
                      <span className="roadmap-star" aria-label="High weightage topic">
                        <StarIcon size={14} />
                      </span>
                    ) : null}
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
