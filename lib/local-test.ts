import dataset from "@/data/jee-question-seed-90.json";
import { sortQuestionsBySubject } from "@/lib/test-order";

export const LOCAL_TEST_ID = "local-jee-main-seed-90";

export const LOCAL_TEST_BLUEPRINT = {
  id: LOCAL_TEST_ID,
  name: "JEE Main 2022 Seed Test · 90 Questions",
  scope: "full_mock" as const,
  subject: null,
  topic: null,
  question_count: dataset.questions.length,
  distribution: { easy: 0, medium: 100, hard: 0 },
  duration_minutes: 180,
  negative_marking: true,
  is_active: true,
  availableQuestions: dataset.questions.length
};

const orderedQuestions = sortQuestionsBySubject(dataset.questions);

export function getLocalTestInstance() {
  return {
    testInstanceId: LOCAL_TEST_ID,
    blueprint: {
      id: LOCAL_TEST_BLUEPRINT.id,
      name: LOCAL_TEST_BLUEPRINT.name,
      scope: LOCAL_TEST_BLUEPRINT.scope,
      subject: LOCAL_TEST_BLUEPRINT.subject,
      topic: LOCAL_TEST_BLUEPRINT.topic,
      durationMinutes: LOCAL_TEST_BLUEPRINT.duration_minutes,
      negativeMarking: LOCAL_TEST_BLUEPRINT.negative_marking
    },
    questions: orderedQuestions.map((question, index) => ({
      id: question.id,
      position: index + 1,
      questionType: question.section === "B" ? ("integer" as const) : ("mcq_single" as const),
      stemMarkdown: question.stem_and_options_ocr,
      stemLatex: null,
      diagramImageUrl: null,
      diagramCaption: null,
      subject: question.subject,
      topic: "Unclassified",
      difficulty: "medium" as const,
      marks: 4,
      negativeMarks: question.section === "B" ? 0 : 1,
      options: []
    }))
  };
}
