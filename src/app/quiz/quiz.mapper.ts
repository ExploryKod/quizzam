import { IQuiz, IQuestion, IAnswer } from './quiz.interface';
import {
  CreateQuizDto,
  UpdateQuestionDto,
  CreateQuestionDto,
  AnswerDto,
  PatchOperationDto,
} from './quiz.dto';
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
   * Convertit un DTO de création en objet persistable pour Firestore
   */
  static fromCreateDto(dto: CreateQuizDto, userId: string): any {
    return {
      title: dto.title,
      description: dto.description || '',
      userId,
      questions: [],
      updatedAt: new Date(),
    };
  }

  /**
   * Applique des opérations de patch et retourne un objet persistable
   */
  static applyPatchOperations(quiz: IQuiz, operations: PatchOperationDto[]): any {
    const updatedQuiz = { ...quiz };
    
    for (const operation of operations) {
      if (operation.op === 'replace') {
        if (operation.path === '/title') {
          updatedQuiz.title = operation.value;
        } else if (operation.path === '/description') {
          updatedQuiz.description = operation.value;
        }
      }
    }
    
    return {
      title: updatedQuiz.title,
      description: updatedQuiz.description,
      userId: updatedQuiz.userId,
      questions: updatedQuiz.questions,
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
   * Convertit un DTO de création en objet persistable
   */
  static fromCreateDto(dto: CreateQuestionDto): any {
    const questionId = uuidv4();
    return {
      id: questionId,
      title: dto.title,
      answers: dto.answers
        ? dto.answers.map((a) => AnswerMapper.fromDto(a))
        : [],
    };
  }

  /**
   * Convertit un DTO de mise à jour en objet persistable
   */
  static fromUpdateDto(dto: UpdateQuestionDto, questionId: string): any {
    return {
      id: questionId,
      title: dto.title,
      answers: dto.answers
        ? dto.answers.map((a) => AnswerMapper.fromDto(a))
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
   * Convertit un DTO de réponse en objet persistable
   */
  static fromDto(dto: AnswerDto): any {
    return {
      title: dto.title,
      isCorrect: dto.isCorrect,
    };
  }
} 