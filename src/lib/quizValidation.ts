import { IQuizQuestion, IQuizOption } from "@/models/Lesson";

interface QuizOptionInput {
  text?: unknown;
  isCorrect?: unknown;
}

interface QuizQuestionInput {
  questionText?: unknown;
  questionType?: unknown;
  options?: unknown;
  explanation?: unknown;
  points?: unknown;
}

export function validateQuizQuestions(questions: unknown): {
  valid: boolean;
  error?: string;
  data?: IQuizQuestion[];
} {
  if (!Array.isArray(questions)) {
    return { valid: false, error: "quizQuestions must be an array" };
  }

  const validated: IQuizQuestion[] = [];

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as QuizQuestionInput;
    if (!q || typeof q !== "object") {
      return { valid: false, error: `Question ${i + 1} is invalid` };
    }

    const questionText = typeof q.questionText === "string" ? q.questionText.trim() : "";
    if (!questionText) {
      return { valid: false, error: `Question ${i + 1}: questionText is required` };
    }

    const questionType = q.questionType;
    if (questionType !== "single" && questionType !== "multiple" && questionType !== "true_false") {
      return {
        valid: false,
        error: `Question ${i + 1}: questionType must be "single", "multiple", or "true_false"`,
      };
    }

    if (!Array.isArray(q.options) || q.options.length < 2) {
      return { valid: false, error: `Question ${i + 1}: must have at least 2 options` };
    }

    const validOptions: IQuizOption[] = [];
    let correctCount = 0;

    for (let j = 0; j < q.options.length; j++) {
      const opt = q.options[j] as QuizOptionInput;
      if (!opt || typeof opt !== "object") {
        return { valid: false, error: `Question ${i + 1}, option ${j + 1} is invalid` };
      }
      const text = typeof opt.text === "string" ? opt.text.trim() : "";
      if (!text) {
        return { valid: false, error: `Question ${i + 1}, option ${j + 1}: text is required` };
      }
      const isCorrect = Boolean(opt.isCorrect);
      if (isCorrect) {
        correctCount++;
      }
      validOptions.push({ text, isCorrect });
    }

    if ((questionType === "single" || questionType === "true_false") && correctCount !== 1) {
      return {
        valid: false,
        error: `Question ${i + 1} (${questionType}): must have exactly 1 correct option (found ${correctCount})`,
      };
    }

    if (questionType === "multiple" && correctCount < 1) {
      return {
        valid: false,
        error: `Question ${i + 1} (multiple): must have at least 1 correct option`,
      };
    }

    validated.push({
      questionText,
      questionType,
      options: validOptions,
      explanation: typeof q.explanation === "string" ? q.explanation : undefined,
      points: typeof q.points === "number" && q.points >= 0 ? q.points : 1,
    });
  }

  return { valid: true, data: validated };
}
