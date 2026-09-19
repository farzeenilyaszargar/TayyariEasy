"use client";

import { useEffect, useState } from "react";

const INITIAL_STUDENT_COUNT = 3642;

export function TrustBadge() {
  const [studentCount, setStudentCount] = useState(INITIAL_STUDENT_COUNT);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleIncrease = () => {
      const delay = (Math.floor(Math.random() * 7) + 4) * 1000;
      timeoutId = setTimeout(() => {
        setStudentCount((count) => count + Math.floor(Math.random() * 2) + 1);
        scheduleIncrease();
      }, delay);
    };

    scheduleIncrease();
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <div className="trust-badge">
      <span className="trust-badge-count" key={studentCount}>+{studentCount.toLocaleString("en-IN")}</span> Students Using Tayyari
    </div>
  );
}
