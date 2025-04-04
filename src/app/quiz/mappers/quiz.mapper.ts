import { IQuiz, IQuestion, IAnswer } from '../interfaces/quiz.interface';
import {
  CreateQuizDto,
  UpdateQuestionDto,
  CreateQuestionDto,
  AnswerDto,
} from '../dto/quiz.dto';
import { v4 as uuidv4 } from 'uuid';

/**
 * Classe utilitaire pour mapper les Quiz entre différentes représentations
 */
export class QuizMapper {
  /**
   * Convertit un document Firestore en objet de domaine IQuiz
   */
  static toEntity(data: any, id?: string): IQuiz {
    return {
      id: id || data.id,
      title: data.title || '',
      description: data.description || '',
      userId: data.userId,
      questions: Array.isArray(data.questions)
        ? data.questions.map((q) => QuestionMapper.toEntity(q))
        : [],
    };
  }

  /**
   * Convertit un DTO de création en objet de domaine IQuiz
   */
  static fromCreateDto(dto: CreateQuizDto, userId: string): IQuiz {
    return {
      id: null, // Sera généré par Firestore
      title: dto.title,
      description: dto.description || '',
      userId,
      questions: [],
    };
  }

  /**
   * Convertit un objet de domaine IQuiz en objet persistable dans Firestore
   */
  static toPersistence(quiz: IQuiz): any {
    return {
      title: quiz.title,
      description: quiz.description,
      userId: quiz.userId,
      questions: quiz.questions
        ? quiz.questions.map((q) => QuestionMapper.toPersistence(q))
        : [],
      updatedAt: new Date(),
    };
  }
}

/**
 * Classe utilitaire pour mapper les Questions entre différentes représentations
 */
export class QuestionMapper {
  /**
   * Convertit un objet brut en objet de domaine IQuestion
   */
  static toEntity(data: any): IQuestion {
    return {
      id: data.id || '',
      title: data.title || '',
      answers: Array.isArray(data.answers)
        ? data.answers.map((a) => AnswerMapper.toEntity(a))
        : [],
    };
  }

  /**
   * Convertit un DTO de création en objet de domaine IQuestion
   */
  static fromCreateDto(dto: CreateQuestionDto): IQuestion {
    return {
      id: uuidv4(),
      title: dto.title,
      answers: dto.answers
        ? dto.answers.map((a) => AnswerMapper.fromDto(a))
        : [],
    };
  }

  /**
   * Convertit un DTO de mise à jour en objet de domaine IQuestion
   */
  static fromUpdateDto(dto: UpdateQuestionDto, questionId: string): IQuestion {
    return {
      id: questionId,
      title: dto.title,
      answers: dto.answers
        ? dto.answers.map((a) => AnswerMapper.fromDto(a))
        : [],
    };
  }

  /**
   * Convertit un objet de domaine IQuestion en objet persistable
   */
  static toPersistence(question: IQuestion): any {
    return {
      id: question.id,
      title: question.title,
      answers: question.answers
        ? question.answers.map((a) => AnswerMapper.toPersistence(a))
        : [],
    };
  }
}

/**
 * Classe utilitaire pour mapper les Réponses entre différentes représentations
 */
export class AnswerMapper {
  /**
   * Convertit un objet brut en objet de domaine IAnswer
   */
  static toEntity(data: any): IAnswer {
    return {
      title: data.title || '',
      isCorrect: Boolean(data.isCorrect),
    };
  }

  /**
   * Convertit un DTO de réponse en objet de domaine IAnswer
   */
  static fromDto(dto: AnswerDto): IAnswer {
    return {
      title: dto.title,
      isCorrect: dto.isCorrect,
    };
  }

  /**
   * Convertit un objet de domaine IAnswer en objet persistable
   */
  static toPersistence(answer: IAnswer): any {
    return {
      title: answer.title,
      isCorrect: answer.isCorrect,
    };
  }
}
