import { v4 as uuidv4 } from 'uuid';
import { Quiz, Question, Answer } from '../domain/quiz.entity';
import { CreateQuizDto, UpdateQuestionDto, CreateQuestionDto, AnswerDto, PatchOperationDto } from '../dto/quiz.dto';
import { FirestoreQuiz, FirestoreQuestion, FirestoreAnswer } from '../persistence/quiz.model';

/**
 * Classe utilitaire pour mapper les Quiz entre différentes représentations
 */
export class QuizMapper {
  /**
   * Convertit un document Firestore en objet de domaine Quiz
   */
  static toEntity(data: FirestoreQuiz, id?: string): Quiz {
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
  static fromCreateDto(dto: CreateQuizDto, userId: string): FirestoreQuiz {
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
  static applyPatchOperations(quiz: Quiz, operations: PatchOperationDto[]): FirestoreQuiz {
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
      questions: updatedQuiz.questions || [],
      updatedAt: new Date(),
    };
  }
}

/**
 * Classe utilitaire pour mapper les Questions entre différentes représentations
 */
export class QuestionMapper {
  /**
   * Convertit un objet brut en objet de domaine Question
   */
  static toEntity(data: any): Question {
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
  static fromCreateDto(dto: CreateQuestionDto): FirestoreQuestion {
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
  static fromUpdateDto(dto: UpdateQuestionDto, questionId: string): FirestoreQuestion {
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
   * Convertit un objet brut en objet de domaine Answer
   */
  static toEntity(data: any): Answer {
    return {
      title: data.title || '',
      isCorrect: Boolean(data.isCorrect),
    };
  }

  /**
   * Convertit un DTO de réponse en objet persistable
   */
  static fromDto(dto: AnswerDto): FirestoreAnswer {
    return {
      title: dto.title,
      isCorrect: dto.isCorrect,
    };
  }
} 