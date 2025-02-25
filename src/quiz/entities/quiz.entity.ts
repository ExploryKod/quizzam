import { Entity } from '../../shared/entity';
import { User } from '../../users/entities/user.entity';

type Question = {
  id: string;
  title: string;
}

type QuizProps = {
  id: string;
  title: string;
  description: string;
  questions: Array<Question>;
  userId: string;
};

export class Quiz extends Entity<QuizProps> {

  hasNoTitle(): boolean {
    return this.props.title.length < 1;
  }

  hasNoDescription(): boolean {
    return this.props.description.length < 1;
  }

  hasNoQuestion(): boolean {
    return this.props.questions.length < 1;
  }

  isUserOwnQuiz(user: User): boolean {
    return this.props.userId === user.props.uid;
  }
}
