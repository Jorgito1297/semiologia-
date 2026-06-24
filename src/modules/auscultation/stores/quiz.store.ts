import { create } from 'zustand';

interface QuizState {
  quizScore: number;
  quizAttemptedCount: number;
  quizSubmitted: boolean;
  selectedQuizOpt: number | null;
  submitAnswer: (correctIndex: number, selectedIndex: number) => void;
  setSelectedQuizOpt: (opt: number | null) => void;
  setQuizSubmitted: (submitted: boolean) => void;
  resetQuizState: () => void;
  resetAllStats: () => void;
}

export const useQuizStore = create<QuizState>((set) => ({
  quizScore: 0,
  quizAttemptedCount: 0,
  quizSubmitted: false,
  selectedQuizOpt: null,
  submitAnswer: (correctIndex, selectedIndex) => set((state) => {
    if (state.quizSubmitted) return state;
    const isCorrect = correctIndex === selectedIndex;
    return {
      selectedQuizOpt: selectedIndex,
      quizSubmitted: true,
      quizAttemptedCount: state.quizAttemptedCount + 1,
      quizScore: isCorrect ? state.quizScore + 1 : state.quizScore,
    };
  }),
  setSelectedQuizOpt: (selectedQuizOpt) => set({ selectedQuizOpt }),
  setQuizSubmitted: (quizSubmitted) => set({ quizSubmitted }),
  resetQuizState: () => set({ quizSubmitted: false, selectedQuizOpt: null }),
  resetAllStats: () => set({ quizScore: 0, quizAttemptedCount: 0, quizSubmitted: false, selectedQuizOpt: null }),
}));
