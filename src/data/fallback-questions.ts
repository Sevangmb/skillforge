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
    },
    {
      question: "Quel est le plus grand mammifère du monde ?",
      options: ["Éléphant d'Afrique", "Baleine bleue", "Girafe", "Hippopotame"],
      correctAnswer: 1,
      explanation: "La baleine bleue est le plus grand mammifère et même le plus grand animal ayant jamais existé sur Terre."
    },
    {
      question: "Quelle est la montagne la plus haute du monde ?",
      options: ["K2", "Mont Everest", "Kangchenjunga", "Lhotse"],
      correctAnswer: 1,
      explanation: "Le mont Everest, situé dans l'Himalaya, est la montagne la plus haute du monde avec 8 849 mètres."
    },
    {
      question: "Qui a peint la Joconde ?",
      options: ["Vincent van Gogh", "Pablo Picasso", "Léonard de Vinci", "Michel-Ange"],
      correctAnswer: 2,
      explanation: "La Joconde (Mona Lisa) a été peinte par Léonard de Vinci entre 1503 et 1519."
    },
    {
      question: "Quel est le pays le plus peuplé du monde ?",
      options: ["Inde", "Chine", "États-Unis", "Indonésie"],
      correctAnswer: 1,
      explanation: "La Chine est le pays le plus peuplé du monde avec plus de 1,4 milliard d'habitants."
    },
    {
      question: "En quelle année a eu lieu la Révolution française ?",
      options: ["1789", "1792", "1799", "1804"],
      correctAnswer: 0,
      explanation: "La Révolution française a commencé en 1789 avec la prise de la Bastille le 14 juillet."
    },
    {
      question: "Quel est le plus petit pays du monde ?",
      options: ["Monaco", "Saint-Marin", "Vatican", "Liechtenstein"],
      correctAnswer: 2,
      explanation: "Le Vatican est le plus petit pays du monde avec une superficie de seulement 0,17 km²."
    },
    {
      question: "Quelle planète est la plus proche du Soleil ?",
      options: ["Vénus", "Mercure", "Mars", "Terre"],
      correctAnswer: 1,
      explanation: "Mercure est la planète la plus proche du Soleil dans notre système solaire."
    },
    {
      question: "Qui a écrit 'Les Misérables' ?",
      options: ["Victor Hugo", "Émile Zola", "Gustave Flaubert", "Alexandre Dumas"],
      correctAnswer: 0,
      explanation: "Les Misérables est un roman de Victor Hugo publié en 1862."
    },
    {
      question: "Quelle est la vitesse de la lumière dans le vide ?",
      options: ["200 000 km/s", "300 000 km/s", "400 000 km/s", "500 000 km/s"],
      correctAnswer: 1,
      explanation: "La vitesse de la lumière dans le vide est d'environ 299 792 458 mètres par seconde, soit environ 300 000 km/s."
    },
    {
      question: "Quel océan se trouve entre l'Europe et l'Amérique ?",
      options: ["Océan Pacifique", "Océan Indien", "Océan Atlantique", "Océan Arctique"],
      correctAnswer: 2,
      explanation: "L'océan Atlantique sépare l'Europe et l'Afrique de l'Amérique du Nord et du Sud."
    },
    {
      question: "Combien d'os compte le corps humain adulte ?",
      options: ["156", "186", "206", "256"],
      correctAnswer: 2,
      explanation: "Le corps humain adulte compte 206 os. Les bébés naissent avec environ 270 os, mais certains fusionnent en grandissant."
    },
    {
      question: "Quelle est la langue la plus parlée au monde ?",
      options: ["Anglais", "Espagnol", "Chinois mandarin", "Hindi"],
      correctAnswer: 2,
      explanation: "Le chinois mandarin est la langue la plus parlée au monde avec plus de 900 millions de locuteurs natifs."
    },
    {
      question: "En quelle année a été inventé Internet ?",
      options: ["1969", "1975", "1983", "1991"],
      correctAnswer: 0,
      explanation: "ARPANET, le précurseur d'Internet, a été créé en 1969. Le World Wide Web a été inventé en 1989-1991."
    },
    {
      question: "Quel est le plus grand désert du monde ?",
      options: ["Sahara", "Gobi", "Antarctique", "Arabie"],
      correctAnswer: 2,
      explanation: "L'Antarctique est techniquement le plus grand désert du monde (désert polaire), suivi du Sahara (désert chaud)."
    },
    {
      question: "Qui a découvert la pénicilline ?",
      options: ["Louis Pasteur", "Alexander Fleming", "Marie Curie", "Charles Darwin"],
      correctAnswer: 1,
      explanation: "Alexander Fleming a découvert la pénicilline en 1928, révolutionnant le traitement des infections bactériennes."
    }
  ]
};

// Système de rotation des questions par utilisateur et session
class QuestionRotationManager {
  private userQuestionHistory: Map<string, Set<number>> = new Map();
  private sessionQuestionCount: Map<string, number> = new Map();
  
  getNextQuestion(skillId: string, userId: string, sessionId: string): QuizQuestion | null {
    const questions = fallbackQuestions[skillId] || fallbackQuestions['general-knowledge'];
    const userKey = `${userId}-${skillId}`;
    
    // Initialiser l'historique pour cet utilisateur
    if (!this.userQuestionHistory.has(userKey)) {
      this.userQuestionHistory.set(userKey, new Set());
    }
    
    const usedQuestions = this.userQuestionHistory.get(userKey)!;
    const sessionCount = this.sessionQuestionCount.get(sessionId) || 0;
    
    // Limite de questions par session pour éviter les quiz infinis
    const MAX_QUESTIONS_PER_SESSION = 10;
    if (sessionCount >= MAX_QUESTIONS_PER_SESSION) {
      return null; // Fin du quiz
    }
    
    // Trouver les questions non utilisées
    const availableIndices = questions
      .map((_, index) => index)
      .filter(index => !usedQuestions.has(index));
    
    // Si toutes les questions ont été utilisées, reset l'historique
    if (availableIndices.length === 0) {
      usedQuestions.clear();
      availableIndices.push(...questions.map((_, index) => index));
    }
    
    // Sélectionner une question aléatoire parmi les disponibles
    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    usedQuestions.add(randomIndex);
    
    // Incrémenter le compteur de session
    this.sessionQuestionCount.set(sessionId, sessionCount + 1);
    
    return questions[randomIndex];
  }
  
  // Nettoyer les anciennes sessions (appelé périodiquement)
  cleanup(): void {
    // Garder seulement les 100 dernières sessions
    if (this.sessionQuestionCount.size > 100) {
      const entries = Array.from(this.sessionQuestionCount.entries());
      entries.slice(0, entries.length - 100).forEach(([sessionId]) => {
        this.sessionQuestionCount.delete(sessionId);
      });
    }
    
    // Limiter l'historique utilisateur à 50 utilisateurs
    if (this.userQuestionHistory.size > 50) {
      const entries = Array.from(this.userQuestionHistory.keys());
      entries.slice(0, entries.length - 50).forEach(userKey => {
        this.userQuestionHistory.delete(userKey);
      });
    }
  }
  
  resetUserHistory(userId: string, skillId: string): void {
    const userKey = `${userId}-${skillId}`;
    this.userQuestionHistory.delete(userKey);
  }
  
  getSessionProgress(sessionId: string): { current: number; max: number } {
    return {
      current: this.sessionQuestionCount.get(sessionId) || 0,
      max: 10
    };
  }
}

// Instance globale du gestionnaire de rotation
const rotationManager = new QuestionRotationManager();

// Nettoyer périodiquement (toutes les 10 minutes)
if (typeof window === 'undefined') { // Côté serveur seulement
  setInterval(() => rotationManager.cleanup(), 10 * 60 * 1000);
}

export function getRandomFallbackQuestion(skillId: string): QuizQuestion {
  const questions = fallbackQuestions[skillId] || fallbackQuestions['general-knowledge'];
  const randomIndex = Math.floor(Math.random() * questions.length);
  return questions[randomIndex];
}

export function getNextRotatedQuestion(
  skillId: string, 
  userId: string, 
  sessionId: string
): QuizQuestion | null {
  return rotationManager.getNextQuestion(skillId, userId, sessionId);
}

export function resetQuestionHistory(userId: string, skillId: string): void {
  rotationManager.resetUserHistory(userId, skillId);
}

export function getQuizProgress(sessionId: string): { current: number; max: number } {
  return rotationManager.getSessionProgress(sessionId);
}