import { Quiz } from '../../entities/quiz.entity';
import { IQuizRepository } from '../../ports/quiz-repository.interface';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';
import { QuestionDTO, basicQuizDTO, CreateQuizDTO } from '../../dto/quiz.dto';
import { firestore } from 'firebase-admin';
import DocumentData = firestore.DocumentData;

export class FirebaseQuizRepository implements IQuizRepository {

  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  async findAllFromUser(userId: string): Promise<basicQuizDTO[] | []> {
    const quizzesData = await this.firebase.firestore
      .collection('quizzes')
      .where('userId', '==', userId)
      .get();

    if (quizzesData.empty) {
      return []
    }

    return quizzesData.docs.map((doc) => ({
      id: doc.id,
      title: doc.data().title,
    }))
  }

  async findById(id:string): Promise<Quiz | null> {

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
      questions: quizData.questions?.map((question: QuestionDTO) => ({
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

    const result:string = quizRef.id.toString();
    return result;
  }
}