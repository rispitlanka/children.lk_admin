"use client";

import React from "react";
import Input from "@/components/form/input/InputField";
import TextArea from "@/components/form/input/TextArea";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import Checkbox from "@/components/form/input/Checkbox";
import Radio from "@/components/form/input/Radio";
import Button from "@/components/ui/button/Button";
import { PlusIcon, TrashBinIcon } from "@/icons";
import { IQuizQuestion, QuizQuestionType } from "@/models/Lesson";

const QUESTION_TYPE_OPTIONS = [
  { value: "single", label: "Single Choice" },
  { value: "multiple", label: "Multiple Choice" },
  { value: "true_false", label: "True / False" },
];

export interface QuizQuestionEditorProps {
  question: IQuizQuestion;
  index: number;
  totalQuestions: number;
  onChange: (updatedQuestion: IQuizQuestion) => void;
  onRemove: () => void;
}

export default function QuizQuestionEditor({
  question,
  index,
  totalQuestions,
  onChange,
  onRemove,
}: QuizQuestionEditorProps) {
  const handleQuestionTextChange = (text: string) => {
    onChange({ ...question, questionText: text });
  };

  const handleQuestionTypeChange = (typeVal: string) => {
    const newType = typeVal as QuizQuestionType;
    if (newType === question.questionType) return;

    let newOptions = [...question.options];

    if (newType === "true_false") {
      const wasFalseCorrect =
        newOptions.find((o) => o.text.toLowerCase() === "false")?.isCorrect ?? false;
      newOptions = [
        { text: "True", isCorrect: !wasFalseCorrect },
        { text: "False", isCorrect: wasFalseCorrect },
      ];
    } else if (newType === "single") {
      if (newOptions.length < 2) {
        newOptions = [
          { text: newOptions[0]?.text || "", isCorrect: true },
          { text: newOptions[1]?.text || "", isCorrect: false },
        ];
      } else {
        let foundCorrect = false;
        newOptions = newOptions.map((opt) => {
          if (opt.isCorrect && !foundCorrect) {
            foundCorrect = true;
            return opt;
          }
          return { ...opt, isCorrect: false };
        });
        if (!foundCorrect) {
          newOptions[0] = { ...newOptions[0], isCorrect: true };
        }
      }
    } else if (newType === "multiple") {
      if (newOptions.length < 2) {
        newOptions = [
          { text: newOptions[0]?.text || "", isCorrect: true },
          { text: newOptions[1]?.text || "", isCorrect: false },
        ];
      }
    }

    onChange({
      ...question,
      questionType: newType,
      options: newOptions,
    });
  };

  const handlePointsChange = (val: string) => {
    const parsed = parseInt(val, 10);
    const points = isNaN(parsed) ? 0 : Math.max(0, parsed);
    onChange({ ...question, points });
  };

  const handleExplanationChange = (text: string) => {
    onChange({ ...question, explanation: text });
  };

  const handleOptionTextChange = (optIndex: number, text: string) => {
    const updatedOptions = question.options.map((opt, i) =>
      i === optIndex ? { ...opt, text } : opt
    );
    onChange({ ...question, options: updatedOptions });
  };

  const handleSelectCorrectOption = (optIndex: number) => {
    const updatedOptions = question.options.map((opt, i) => ({
      ...opt,
      isCorrect: i === optIndex,
    }));
    onChange({ ...question, options: updatedOptions });
  };

  const handleToggleCorrectOption = (optIndex: number, checked: boolean) => {
    const updatedOptions = question.options.map((opt, i) =>
      i === optIndex ? { ...opt, isCorrect: checked } : opt
    );
    onChange({ ...question, options: updatedOptions });
  };

  const handleAddOption = () => {
    const updatedOptions = [
      ...question.options,
      { text: "", isCorrect: false },
    ];
    onChange({ ...question, options: updatedOptions });
  };

  const handleRemoveOption = (optIndex: number) => {
    if (question.options.length <= 2) return;
    let updatedOptions = question.options.filter((_, i) => i !== optIndex);
    if (
      question.questionType === "single" &&
      !updatedOptions.some((o) => o.isCorrect)
    ) {
      if (updatedOptions.length > 0) {
        updatedOptions[0] = { ...updatedOptions[0], isCorrect: true };
      }
    }
    onChange({ ...question, options: updatedOptions });
  };

  return (
    <div className="rounded-[10px] border border-gray-200 bg-white p-5 space-y-5 dark:border-gray-800 dark:bg-gray-dark shadow-sm">
      {/* Header: Question Number & Delete Button */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
            Question {index + 1}
          </span>
          <span className="text-xs text-gray-400">of {totalQuestions}</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 transition-colors"
          title="Remove Question"
        >
          <TrashBinIcon className="h-4 w-4" />
          <span>Remove Question</span>
        </button>
      </div>

      {/* Question Text */}
      <div>
        <Label>Question Text *</Label>
        <TextArea
          value={question.questionText}
          onChange={handleQuestionTextChange}
          placeholder="e.g. What is the primary purpose of child protection policies?"
          rows={2}
          required
        />
      </div>

      {/* Question Type & Points */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Label>Question Type *</Label>
          <Select
            key={question.questionType}
            defaultValue={question.questionType}
            options={QUESTION_TYPE_OPTIONS}
            onChange={handleQuestionTypeChange}
          />
        </div>

        <div>
          <Label>Points *</Label>
          <Input
            type="number"
            value={question.points}
            onChange={(e) => handlePointsChange(e.target.value)}
            placeholder="1"
            min="0"
          />
        </div>
      </div>

      {/* Options Section */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label className="mb-0">
            Options *{" "}
            <span className="text-xs font-normal text-gray-500">
              {question.questionType === "single"
                ? "(Select 1 correct option)"
                : question.questionType === "multiple"
                ? "(Select all correct options)"
                : "(Select the correct answer)"}
            </span>
          </Label>
        </div>

        {question.questionType === "true_false" ? (
          <div className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-gray-50/50 p-3.5 dark:border-gray-800 dark:bg-gray-800/30">
            {question.options.map((opt, optIdx) => (
              <div
                key={opt.text}
                className={`flex items-center rounded-lg border p-3 cursor-pointer transition-colors ${
                  opt.isCorrect
                    ? "border-brand-500 bg-brand-50/40 dark:border-brand-500/60 dark:bg-brand-950/20"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                }`}
                onClick={() => handleSelectCorrectOption(optIdx)}
              >
                <Radio
                  id={`q-${index}-opt-${optIdx}`}
                  name={`q-${index}-tf`}
                  value={opt.text}
                  checked={opt.isCorrect}
                  label={opt.text}
                  onChange={() => handleSelectCorrectOption(optIdx)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {question.options.map((opt, optIdx) => (
              <div key={optIdx} className="flex items-center gap-2.5">
                {/* Correct selection (Radio for single, Checkbox for multiple) */}
                <div className="pt-0.5 shrink-0">
                  {question.questionType === "single" ? (
                    <Radio
                      id={`q-${index}-opt-${optIdx}`}
                      name={`q-${index}-correct`}
                      value={String(optIdx)}
                      checked={opt.isCorrect}
                      label=""
                      onChange={() => handleSelectCorrectOption(optIdx)}
                    />
                  ) : (
                    <Checkbox
                      id={`q-${index}-opt-${optIdx}`}
                      checked={opt.isCorrect}
                      onChange={(checked) =>
                        handleToggleCorrectOption(optIdx, checked)
                      }
                    />
                  )}
                </div>

                {/* Option text input */}
                <div className="flex-1">
                  <Input
                    value={opt.text}
                    onChange={(e) =>
                      handleOptionTextChange(optIdx, e.target.value)
                    }
                    placeholder={`Option ${optIdx + 1}`}
                    required
                  />
                </div>

                {/* Remove option button */}
                <button
                  type="button"
                  onClick={() => handleRemoveOption(optIdx)}
                  disabled={question.options.length <= 2}
                  className={`p-2 rounded-lg text-gray-400 transition-colors ${
                    question.options.length <= 2
                      ? "opacity-30 cursor-not-allowed"
                      : "hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  }`}
                  title={
                    question.options.length <= 2
                      ? "Minimum 2 options required"
                      : "Remove option"
                  }
                >
                  <TrashBinIcon className="h-4 w-4" />
                </button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOption}
              className="mt-2 text-xs"
              startIcon={<PlusIcon className="h-4 w-4" />}
            >
              Add Option
            </Button>
          </div>
        )}
      </div>

      {/* Explanation (Optional) */}
      <div className="pt-2">
        <Label>Explanation (Optional)</Label>
        <TextArea
          value={question.explanation ?? ""}
          onChange={handleExplanationChange}
          placeholder="Explain why the answer is correct or add relevant context..."
          rows={2}
        />
      </div>
    </div>
  );
}
