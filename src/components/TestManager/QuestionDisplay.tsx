import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Send } from 'lucide-react';
import type { Question } from '../../utils/supabaseClient';

interface QuestionDisplayProps {
  questions: Question[];
  answers: Record<string, string>;
  currentQuestionIndex: number;
  onAnswerChange: (questionId: string, answer: string) => void;
  onNavigate: (newIndex: number) => void;
  onSubmit: () => void;
  isTimeExpired: boolean;
  submitting: boolean;
  timeLeft: number;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  questions,
  answers,
  currentQuestionIndex,
  onAnswerChange,
  onNavigate,
  onSubmit,
  isTimeExpired,
  submitting,
  
}) => {
  const [showJumpMenu, setShowJumpMenu] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;

  // Navigate to previous question
  const handlePrevious = () => {
    if (!isFirstQuestion) {
      onNavigate(currentQuestionIndex - 1);
    }
  };

  // Navigate to next question
  const handleNext = () => {
    if (!isLastQuestion) {
      onNavigate(currentQuestionIndex + 1);
    }
  };

  // Jump to specific question
  const handleJumpToQuestion = (questionNumber: number) => {
    if (questionNumber >= 1 && questionNumber <= totalQuestions) {
      onNavigate(questionNumber - 1);
      setShowJumpMenu(false);
    }
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / totalQuestions) * 100;
  };

  // Determine if current question is answered
  const isCurrentAnswered = !!answers[currentQuestion.id];

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* ✅ HEADER WITH PROGRESS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </h3>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                {answeredCount} of {totalQuestions} answered
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {isCurrentAnswered ? (
                  <span className="text-green-600 font-medium">✓ Answered</span>
                ) : (
                  <span className="text-yellow-600 font-medium">○ Not answered</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ QUESTION CARD */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex-1">
              {currentQuestion.question_text}
            </h2>
            <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium whitespace-nowrap">
              {currentQuestion.type}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-6">
            <span className="font-medium">{currentQuestion.marks}</span>{' '}
            {currentQuestion.marks === 1 ? 'mark' : 'marks'}
          </p>

          {/* ✅ MCQ OPTIONS */}
          {currentQuestion.type === 'MCQ' && currentQuestion.options ? (
            <div className="space-y-3">
              {currentQuestion.options.map((option, oIndex) => (
                <label
                  key={oIndex}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                  style={{
                    borderColor:
                      answers[currentQuestion.id] === option
                        ? '#3b82f6'
                        : undefined,
                    backgroundColor:
                      answers[currentQuestion.id] === option
                        ? '#eff6ff'
                        : undefined,
                  }}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={option}
                    checked={answers[currentQuestion.id] === option}
                    onChange={(e) =>
                      onAnswerChange(currentQuestion.id, e.target.value)
                    }
                    className="w-5 h-5 text-blue-600 cursor-pointer"
                    disabled={isTimeExpired}
                  />
                  <span className="ml-4 text-gray-700 font-medium">
                    {String.fromCharCode(65 + oIndex)}.
                  </span>
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))}
            </div>
          ) : (
            // ✅ TEXTAREA FOR THEORY QUESTIONS
            <textarea
              value={answers[currentQuestion.id] || ''}
              onChange={(e) =>
                onAnswerChange(currentQuestion.id, e.target.value)
              }
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
              rows={8}
              placeholder="Type your answer here..."
              disabled={isTimeExpired}
            />
          )}
        </div>

        {/* ✅ NAVIGATION AND SUBMIT SECTION */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-4">
            {/* LEFT: PREVIOUS BUTTON */}
            <button
              onClick={handlePrevious}
              disabled={isFirstQuestion || submitting || isTimeExpired}
              className="px-4 py-3 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {/* CENTER: JUMP TO QUESTION */}
            <div className="relative">
              <button
                onClick={() => setShowJumpMenu(!showJumpMenu)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-semibold text-sm"
              >
                Jump to Q... ({currentQuestionIndex + 1}/{totalQuestions})
              </button>

              {showJumpMenu && (
                <div className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto min-w-48">
                  <div className="p-3 grid grid-cols-4 gap-2">
                    {Array.from({ length: totalQuestions }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleJumpToQuestion(idx + 1)}
                        className={`p-2 rounded text-sm font-medium transition-colors ${
                          idx === currentQuestionIndex
                            ? 'bg-blue-600 text-white'
                            : answers[questions[idx].id]
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT: NEXT OR SUBMIT BUTTON */}
            {!isLastQuestion ? (
              <button
                onClick={handleNext}
                disabled={submitting || isTimeExpired}
                className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={onSubmit}
                disabled={submitting || isTimeExpired}
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                <Send className="w-5 h-5" />
                {submitting ? 'Submitting...' : 'Submit Test'}
              </button>
            )}
          </div>

          {/* INFO MESSAGE */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            💡 You can navigate freely between questions. Your answers are auto-saved every 5 seconds.
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;