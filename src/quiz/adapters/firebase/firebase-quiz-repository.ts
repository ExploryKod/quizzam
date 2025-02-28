import { Quiz } from '../../entities/quiz.entity';
import { IQuizRepository } from '../../ports/quiz-repository.interface';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import {
  basicQuizDTO,
  CreateQuestionDTO,
  CreateQuizDTO,
  DecodedToken,
  PatchOperation,
  QuestionDTO,
} from '../../dto/quiz.dto';
import { HttpException, HttpStatus, NotFoundException } from '@nestjs/common';

export class FirebaseQuizRepository implements IQuizRepository {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  async findAllFromUser(userId: string): Promise<basicQuizDTO[]> {
    const quizzesData = await this.firebase.firestore
      .collection('quizzes')
      .where('userId', '==', userId)
      .get();

    if (quizzesData.empty) {
      return [];
    }

    // const quizzes: basicQuizDTO[] = quizzesData.docs.map((doc) => {
    //   const data = doc.data();
    //
    //   const quizProps: any = {
    //     id: doc.id,
    //     title: data.title || '',
    //     description: data.description || '',
    //     questions: data.questions || [],
    //     userId: data.userId,
    //   };
    //
    //   return new basicQuizDTO(quizProps);
    // });
    console.log(quizzesData.docs.map(doc => console.log("doc data", doc.data().questions)));
    return quizzesData.docs.map(
      (doc) =>
        new basicQuizDTO(
          doc.id,
          doc.data().title || '',
          doc.data().description || '',
          doc.data().questions || [],
          doc.data().userId,
        )
    );
  }

  async findById(id: string): Promise<Quiz | null> {
    const quizDoc = await this.firebase.firestore
      .collection('quizzes')
      .doc(id)
      .get();

    if (!quizDoc.exists) {
      return null;
    }

    const quizData = quizDoc.data();

    return new Quiz({
      id: quizData._id,
      title: quizData.title,
      description: quizData.description,
      questions:
        quizData.questions?.map((question: QuestionDTO) => ({
          id: question.id,
          title: question.title,
          answers: question.answers || [],
        })) || [],
      userId: quizData.userId,
    });
  }

  async create(data: CreateQuizDTO): Promise<string> {
    const quizRef = await this.firebase.firestore
      .collection('quizzes')
      .add(data);

    const result: string = quizRef.id.toString();
    return result;
  }

  async update(
    operations: PatchOperation[],
    id: string,
    decodedToken: DecodedToken
  ): Promise<void> {
    const quizRef = this.firebase.firestore.collection('quizzes').doc(id);
    const quizDoc = await quizRef.get();
    const updateData = {};

    if (!quizDoc.exists) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const quizData = quizDoc.data();

    if (quizData.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    for (const operation of operations) {
      if (operation.op !== 'replace') {
        throw new HttpException(
          `Opération non supportée: ${operation.op}`,
          HttpStatus.BAD_REQUEST
        );
      }

      if (operation.path === '/title') {
        updateData['title'] = operation.value;
      } else {
        throw new HttpException(
          `Chemin non supporté: ${operation.path}`,
          HttpStatus.BAD_REQUEST
        );
      }
    }

    await quizRef.update(updateData);
  }

  async addQuestion(
    quizId: string,
    questionId: string,
    question: CreateQuestionDTO,
    decodedToken: DecodedToken
  ) {
    const quizRef = this.firebase.firestore.collection('quizzes').doc(quizId);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const quizData = quizDoc.data();

    if (quizData.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const questions = quizData.questions || [];

    const newQuestion = {
      id: questionId,
      title: question.title,
      answers: question.answers || [],
    };

    questions.push(newQuestion);

    await quizRef.update({ questions });
  }

  async updateQuestion(
    quizId: string,
    questionId: string,
    question: CreateQuestionDTO,
    decodedToken: DecodedToken
  ): Promise<void> {
    const quizRef = this.firebase.firestore.collection('quizzes').doc(quizId);
    const quizDoc = await quizRef.get();

    if (!quizDoc.exists) {
      throw new NotFoundException('Quiz non trouvé');
    }

    const quizData = quizDoc.data();

    if (quizData.userId !== decodedToken.user_id) {
      throw new NotFoundException('Quiz non trouvé');
    }

    if (!Array.isArray(quizData.questions)) {
      quizData.questions = [];
    }

    const questionIndex = quizData.questions.findIndex(
      (q: QuestionDTO) => q.id === questionId
    );

    if (questionIndex === -1) {
      throw new NotFoundException('Question non trouvée');
    }

    quizData.questions[questionIndex] = {
      id: questionId,
      title: question.title,
      answers: question.answers || [],
    };

    await quizRef.update({
      questions: quizData.questions,
    });
  }
}