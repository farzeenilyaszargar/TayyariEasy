"use client";

import { useEffect, useMemo, useState } from "react";
import { StarIcon } from "@/components/ui-icons";

type Review = {
  name: string;
  line: string;
  rating: number;
};

export function ReviewSlider({ reviews }: { reviews: Review[] }) {
  const [index, setIndex] = useState(0);

  const visible = useMemo(
    () =>
      Array.from({ length: 3 }).map((_, offset) => {
        const nextIndex = (index + offset) % reviews.length;
        return reviews[nextIndex];
      }),
    [index, reviews]
  );

  

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => window.clearInterval(timer);
  }, [reviews.length]);

  return (
    <section className="review-slider-block">

      <div className="review-slider-track" key={index}>
        {visible.map((review) => (
          <article key={`${review.name}-${review.line.slice(0, 20)}`} className="card review-slider-card">
            <div className="rating" aria-label={`${review.rating} out of 5`}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <span key={idx} className={`rating-star ${idx < review.rating ? "filled" : ""}`}>
                  <StarIcon size={14} />
                </span>
              ))}
            </div>
            <p className="review-line">"{review.line}"</p>
            <strong>{review.name}</strong>
          </article>
        ))}
      </div>

      <div className="slider-dots" aria-hidden="true">
        {reviews.map((review, dotIndex) => (
          <button
            key={review.name}
            className={`dot ${dotIndex === index ? "active" : ""}`}
            onClick={() => setIndex(dotIndex)}
            aria-label={`Go to review set starting ${dotIndex + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
