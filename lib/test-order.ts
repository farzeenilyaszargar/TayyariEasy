export const SUBJECT_ORDER = ["Physics", "Chemistry", "Mathematics"] as const;

export function sortQuestionsBySubject<T extends { subject: string }>(questions: T[]) {
  return [...questions].sort((a, b) => {
    const aIndex = SUBJECT_ORDER.indexOf(a.subject as (typeof SUBJECT_ORDER)[number]);
    const bIndex = SUBJECT_ORDER.indexOf(b.subject as (typeof SUBJECT_ORDER)[number]);
    return aIndex - bIndex;
  });
}
