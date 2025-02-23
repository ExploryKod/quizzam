import { DomainException } from '../../shared/exception';

export class QuizHasNoQuestionException extends DomainException {
  constructor() {
    super('The quiz must must have at least one question');
  }
}

export class QuizHasNoTitleException extends DomainException {
  constructor() {
    super('The quiz must must have at least one question');
  }
}

export class QuizHasNoDescriptionException extends DomainException {
  constructor() {
    super('The quiz must must have at least one question');
  }
}
