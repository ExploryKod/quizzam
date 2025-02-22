import { CreateQuiz, IQuizRepository,  Quiz } from './create-quiz';

describe('create quiz', () => {

  it('tests is working', () => {
    expect(true).toBe(true);
  })

  it('should create a new quiz', async () => {
    class quizFakeRepository implements IQuizRepository {
      public database: Quiz[] = []
      async create(quiz: Quiz): Promise<void> {
        this.database.push(quiz)
      }
    }
    const repository = new quizFakeRepository()
    const useCase = new CreateQuiz(repository);
    const quizData = {
      title: 'Quiz Test',
      description: 'Description du quiz test',
    };
    const result = await useCase.execute(quizData)
    expect(repository.database.length).toBe(1)

    const createQuiz = repository.database[0];
    expect(createQuiz.title).toBe('Quiz Test');
  })
})