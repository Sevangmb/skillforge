import type { QuizQuestion } from "@/lib/types";

// Fallback questions when AI generation fails
export const fallbackQuestions: Record<string, QuizQuestion[]> = {
  'general-knowledge': [
    {
      question: "Quelle est la capitale de la France ?",
      options: ["Londres", "Berlin", "Paris", "Madrid"],
      correctAnswer: 2,
      explanation: "Paris est la capitale et la plus grande ville de France."
    },
    {
      question: "Combien de continents y a-t-il sur Terre ?",
      options: ["5", "6", "7", "8"],
      correctAnswer: 2,
      explanation: "Il y a 7 continents : Afrique, Antarctique, Asie, Europe, Amérique du Nord, Océanie et Amérique du Sud."
    },
    {
      question: "Quel est le plus grand océan du monde ?",
      options: ["Atlantique", "Indien", "Arctique", "Pacifique"],
      correctAnswer: 3,
      explanation: "L'océan Pacifique est le plus grand océan du monde, couvrant environ un tiers de la surface de la Terre."
    },
    {
      question: "En quelle année l'homme a-t-il marché sur la Lune pour la première fois ?",
      options: ["1967", "1969", "1971", "1973"],
      correctAnswer: 1,
      explanation: "Neil Armstrong et Buzz Aldrin ont marché sur la Lune le 20 juillet 1969 lors de la mission Apollo 11."
    },
    {
      question: "Quel est l'élément chimique le plus abondant dans l'univers ?",
      options: ["Oxygène", "Carbone", "Hydrogène", "Hélium"],
      correctAnswer: 2,
      explanation: "L'hydrogène est l'élément le plus abondant dans l'univers, représentant environ 75% de la matière normale."
    }
  ]
};

export function getRandomFallbackQuestion(skillId: string): QuizQuestion {
  const questions = fallbackQuestions[skillId] || fallbackQuestions['general-knowledge'];
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}