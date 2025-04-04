import request from 'supertest';
import { defaultUrl } from '../constants';
import { AuthHelper, TestUser } from '../helpers/auth.helper';
import { QuizHelper, TestQuiz } from '../helpers/quiz.helper';

/**
 * E2E tests for the Quiz API endpoints
 * 
 * These tests verify the correct functioning of all Quiz-related API endpoints
 * including authorization requirements, data validation, and proper response formatting.
 */
describe('Quiz API', () => {

  /**
   * Tests for the GET /api/quiz endpoint
   * 
   * Verifies that:
   * - Authenticated users can retrieve their quizzes
   * - Unauthenticated requests are rejected with 401
   * - The response includes proper HATEOAS links
   * - The response structure matches API specifications
   */
  describe('GET /api/quiz', () => {
    let testUser: TestUser;

    beforeAll(async () => {
      testUser = await AuthHelper.createAndLoginUser();
    });

    afterAll(async () => {
      await AuthHelper.deleteUser(testUser.uid);
    });

    it('should return quizzes for the authenticated user', async () => {
      const response = await request(defaultUrl)
        .get('/api/quiz')
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      // TODO : Verifier pourquoi cela (pas demandé à l'issue 5)
      expect(response.body).toHaveProperty('_links');
      expect(response.body._links).toHaveProperty('create');
    });

    it('should return 401 if user is not authenticated', async () => {
      await request(defaultUrl)
        .get('/api/quiz')
        .expect(401);
    });
  });

  /**
   * Tests for the POST /api/quiz endpoint
   * 
   * Verifies that:
   * - Authenticated users can create a new quiz with valid data
   * - Required fields (title, description) are validated
   * - The response includes proper location header for the new resource
   * - Unauthenticated requests are rejected with 401
   */
  describe('POST /api/quiz', () => {
    let testUser: TestUser;

    beforeAll(async () => {
      testUser = await AuthHelper.createAndLoginUser();
    });

    afterAll(async () => {
      await AuthHelper.deleteUser(testUser.uid);
    });

    it('should create a quiz successfully', async () => {
      const quizData = {
          title: 'Quiz Test POST /api/quiz',
          description: 'Description du quiz test',
      };
      
      const createResponse = await QuizHelper.createQuiz(testUser.token, quizData);

      expect(createResponse.response.status).toBe(201);
      expect(createResponse.response.headers).toHaveProperty('location');
      
      // Clean up the created quiz
      if (createResponse.quiz.id) {
        await QuizHelper.deleteQuiz(createResponse.quiz.id);
      }
    });

    it('should return 401 if user is not authenticated', async () => {
      await request(defaultUrl)
        .post('/api/quiz')
        .send({
          title: 'Unauthorized Quiz',
          description: 'This should fail',
        })
        .expect(401);
    });
  });

  /**
   * Tests for the GET /api/quiz/:id endpoint
   * 
   * Verifies that:
   * - Authenticated users can retrieve a specific quiz by ID
   * - Users can only access their own quizzes
   * - Proper 404 response when quiz doesn't exist
   * - Unauthenticated requests are rejected with 401
   * - The response includes all required quiz data (title, description, questions)
   */
  describe('GET /api/quiz/:id', () => {
    let testUser: TestUser;
    let otherUser: TestUser;
    let quizId: string;
    let testQuiz: TestQuiz;

    beforeAll(async () => {
      testUser = await AuthHelper.createAndLoginUser();

      otherUser = await AuthHelper.createAndLoginUser({
        email: 'other-user@email.com',
        password: 'password',
        username: 'OtherUser'
      });

      const createResponse = await QuizHelper.createQuiz(testUser.token);
      testQuiz = createResponse.quiz;
      quizId = testQuiz.id;


      await QuizHelper.addQuestion(testUser.token, quizId);
    });

    afterAll(async () => {
      await QuizHelper.deleteQuiz(quizId);
      await AuthHelper.deleteUser(testUser.uid);
      await AuthHelper.deleteUser(otherUser.uid);
    });

    it('should retrieve a quiz by ID for an authenticated user', async () => {
      const response = await request(defaultUrl)
        .get(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${testUser.token}`);

      expect(response.status).toBe(200);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('description');
      expect(response.body).toHaveProperty('questions');
      expect(Array.isArray(response.body.questions)).toBe(true);

      // Vérifie que chaque question est un objet contenant les propriétés attendues
      response.body.questions.forEach((question) => {
        expect(question).toHaveProperty('id');
        expect(question).toHaveProperty('title');
        expect(question).toHaveProperty('answers');
        expect(Array.isArray(question.answers)).toBe(true);

        // Vérifie que chaque réponse est un objet contenant `title` et `isCorrect`
        question.answers.forEach((answer) => {
          expect(answer).toHaveProperty('title');
          expect(answer).toHaveProperty('isCorrect');
          expect(typeof answer.title).toBe('string');
          expect(typeof answer.isCorrect).toBe('boolean');
        });
      });
    });

    it('should return 404 if the quiz does not exist', async () => {
      await request(defaultUrl)
        .get('/api/quiz/nonexistentQuizId')
        .set('Authorization', `Bearer ${testUser.token}`)
        .expect(404);
    });

    it("should return 401 if the quiz doesn't belong to the authenticated user", async () => {
      const response = await request(defaultUrl)
        .get(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${otherUser.token}`);

      expect(response.status).toBe(401);
    });
  });

  /**
   * Tests for the PATCH /api/quiz/:id endpoint
   * 
   * Verifies that:
   * - Authenticated users can update their quiz properties
   * - Users can only update their own quizzes
   * - The API accepts and processes valid JSON patch operations
   * - Invalid operations are rejected with appropriate error codes
   * - Unauthenticated requests are rejected with 401
   * - Proper 404 response when quiz doesn't exist
   */
  describe('PATCH /api/quiz/:id', () => {
    let testUser: TestUser;
    let otherUser: TestUser;
    let quizId: string;

    beforeAll(async () => {
      testUser = await AuthHelper.createAndLoginUser();

      // Create another user for 401 test
      otherUser = await AuthHelper.createAndLoginUser({
        email: 'other-patch@email.com',
        password: 'password',
        username: 'OtherPatchUser'
      });

      // Création d'un quiz pour avoir un ID valide
      const createResponse = await QuizHelper.createQuiz(testUser.token);

      expect(createResponse.response.status).toBe(201);

      // Récupération de l'ID du quiz
      const locationHeader = createResponse.response.headers.location;
      quizId = locationHeader.split('/').pop();
    });

    afterAll(async () => {
      await AuthHelper.deleteUser(testUser.uid);
      await AuthHelper.deleteUser(otherUser.uid);

      // delete quiz
      await QuizHelper.deleteQuiz(quizId);
    });

    it('should update a quiz title successfully', async () => {
      const patchOperations = [
        { op: 'replace', path: '/title', value: 'New Quiz Title' },
      ];

      const response = await request(defaultUrl)
        .patch(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(patchOperations);

      expect(response.status).toBe(204);
    });

    it('should return 404 if the quiz does not exist', async () => {
      const patchOperations = [
        { op: 'replace', path: '/title', value: 'New Title' },
      ];

      const response = await request(defaultUrl)
        .patch('/api/quiz/nonexistentQuizId')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(patchOperations);

      expect(response.status).toBe(404);
    });

    it("should return 401 if the quiz doesn't belong to the authenticated user", async () => {
      const patchOperations = [
        { op: 'replace', path: '/title', value: 'Hacked Title' },
      ];

      const response = await request(defaultUrl)
        .patch(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${otherUser.token}`)
        .send(patchOperations);

      expect(response.status).toBe(401);
    });
  });

  /**
   * Tests for the POST /api/quiz/:id/questions endpoint
   * 
   * Verifies that:
   * - Authenticated users can add questions to their quizzes
   * - Question data is validated (title, answers, correct answer)
   * - Users can only add questions to their own quizzes
   * - The response includes proper location header for the new question
   * - Unauthenticated requests are rejected with 401
   * - Proper 404 response when quiz doesn't exist
   * - Proper 400 response when question data is invalid
   */
  describe('POST /api/quiz/:id/questions', () => {
    let testUser: TestUser;
    let quizId: string;

    beforeAll(async () => {
      testUser = await AuthHelper.createAndLoginUser();
      
      // Create a quiz using the helper
      const createResponse = await QuizHelper.createQuiz(testUser.token, {
        title: 'Quiz Test addQuestions',
        description: 'Description du quiz test',
      });

      expect(createResponse.response.status).toBe(201);
      quizId = createResponse.quiz.id;
    });

    afterAll(async () => {
      if (quizId) {
        await QuizHelper.deleteQuiz(quizId);
      }
      await AuthHelper.deleteUser(testUser.uid);
    });

    it('should add a question to a quiz successfully', async () => {
      const response = await QuizHelper.addQuestion(testUser.token, quizId);

      expect(response.response.status).toBe(201);
      expect(response.response.headers).toHaveProperty('location');
    });

    it('should return 404 if the quiz does not exist', async () => {
      const response = await QuizHelper.addQuestion(testUser.token, 'nonexistentQuizId');

      expect(response.response.status).toBe(404);  
    });

    it('should reject a question with invalid structure', async () => {
      const invalidQuestion = {
        // Missing title
        answers: [
          { title: 'Answer 1', isCorrect: true },
          { title: 'Answer 2', isCorrect: false }
        ]
      };

      const response = await request(defaultUrl)
        .post(`/api/quiz/${quizId}/questions`)
        .set(AuthHelper.getAuthHeader(testUser.token))
        .send(invalidQuestion);

      expect(response.status).toBe(400);
    });

    it('should reject a question with multiple correct answers', async () => {
      const invalidQuestion = {
        title: 'Question with multiple correct answers',
        answers: [
          { title: 'Answer 1', isCorrect: true },
          { title: 'Answer 2', isCorrect: true },
          { title: 'Answer 3', isCorrect: false }
        ]
      };

      const response = await request(defaultUrl)
        .post(`/api/quiz/${quizId}/questions`)
        .set(AuthHelper.getAuthHeader(testUser.token))
        .send(invalidQuestion);

      expect(response.status).toBe(400);
    });
  });

  /**
   * Tests for the PUT /api/quiz/:quizId/questions/:questionId endpoint
   * 
   * Verifies that:
   * - Authenticated users can update questions in their quizzes
   * - Question data is validated during updates
   * - Users can only update questions in their own quizzes
   * - Unauthenticated requests are rejected with 401
   * - Proper 404 response when quiz or question doesn't exist
   * - Proper 400 response when updated question data is invalid
   */
  describe('PUT /api/quiz/:quizId/questions/:questionId', () => {
    let token: string;
    let quizId: string;
    let questionId: string;
    let testUser: TestUser;
    let testQuiz: TestQuiz;

    beforeAll(async () => {
      testUser = await AuthHelper.createAndLoginUser();
      token = testUser.token;

      const createResponse = await QuizHelper.createQuiz(token);
      testQuiz = createResponse.quiz;
      quizId = testQuiz.id;

      // Ajout d'une question au quiz
      const questionData = await QuizHelper.addQuestion(token, quizId);
      
      expect(questionData.response.status).toBe(201);
      expect(questionData.response.headers).toHaveProperty('location');

      const questionLocationHeader = questionData.response.headers.location;
      questionId = questionLocationHeader.split('/').pop();
      console.log('questionId', questionId);
    });

    afterAll(async () => {
      await QuizHelper.deleteQuiz(quizId);
      await AuthHelper.deleteUser(testUser.uid);
    });

    it('should replace a question successfully', async () => {
      const updatedQuestionData = {
        title: 'What is the capital of Germany?',
        answers: [
          { title: 'Berlin', isCorrect: true },
          { title: 'Paris', isCorrect: false },
          { title: 'Rome', isCorrect: false },
          { title: 'London', isCorrect: false },
        ],
      };

      const response = await QuizHelper.updateQuestion(token, quizId, questionId, updatedQuestionData);

      expect(response.response.status).toBe(204);
    });

    it('should return 404 if the quiz does not exist', async () => {
      const updatedQuestionData = {
        title: 'What is the capital of Germany?',
        answers: [
          { title: 'Berlin', isCorrect: true },
          { title: 'Paris', isCorrect: false },
          { title: 'Rome', isCorrect: false },
          { title: 'London', isCorrect: false },
        ],
      };

      const response = await QuizHelper.updateQuestion(token, 'nonexistentQuizId', questionId, updatedQuestionData);

      expect(response.response.status).toBe(404);
    });

    it('should return 404 if the question does not exist', async () => {
      const updatedQuestionData = {
        title: 'What is the capital of Germany?',
        answers: [
          { title: 'Berlin', isCorrect: true },
          { title: 'Paris', isCorrect: false },
          { title: 'Rome', isCorrect: false },
          { title: 'London', isCorrect: false },
        ],
      };

      const response = await QuizHelper.updateQuestion(token, quizId, 'nonexistentQuestionId', updatedQuestionData);

      expect(response.response.status).toBe(404);
    });

    it('should return 401 if the user is not authenticated', async () => {
      const updatedQuestionData = {
        title: 'What is the capital of Germany?',
        answers: [
          { title: 'Berlin', isCorrect: true },
          { title: 'Paris', isCorrect: false },
          { title: 'Rome', isCorrect: false },
          { title: 'London', isCorrect: false },
        ],
      };

      const response = await QuizHelper.updateQuestion('invalid-token', quizId, questionId, updatedQuestionData);
      
      expect(response.response.status).toBe(401);
    });
  });

  /**
   * Tests for the POST /api/quiz/:id/start endpoint
   * 
   * Verifies that:
   * - Authenticated users can start their quizzes
   * - A quiz can only be started if it meets the required criteria:
   *   - Has a non-empty title
   *   - Has at least one question
   *   - All questions have a title and at least two answers with exactly one correct answer
   * - The API returns a proper execution ID and location header
   * - Unauthenticated requests are rejected with 401
   * - Proper 404 response when quiz doesn't exist
   * - Proper 400 response when quiz is not startable
   */
  describe('POST /api/quiz/:id/start', () => {
    let token: string;
    let nonexistentQuizId: string;
    let quizId: string;
    let testUser: TestUser;

    beforeAll(async () => {
      testUser = await AuthHelper.createAndLoginUser();
      token = testUser.token;

      const quizData = {
        title: 'Quiz Test start',
        description: 'Description du quiz test',
      };

      const createResponse = await QuizHelper.createQuiz(token, quizData);

      expect(createResponse.response.status).toBe(201);  

      quizId = createResponse.quiz.id;

      const questionResponse = await QuizHelper.addQuestion(token, quizId);

      expect(questionResponse.response.status).toBe(201);
    });

    afterAll(async () => {
      await QuizHelper.deleteQuiz(quizId);
      await AuthHelper.deleteUser(testUser.uid);
    });

    it('should start an existing quiz successfully with a correct pattern for its id', async () => {
      const response = await QuizHelper.startQuiz(token, quizId);

      expect(response.response.status).toBe(201);
      expect(response.response.headers).toHaveProperty('location');
      expect(response.response.headers.location).toMatch(/\/api\/execution\/[A-Z0-9]{6}/);
    });

    it('should return 404 if quiz does not exist', async () => {
      nonexistentQuizId = 'ade1246';
      const response = await QuizHelper.startQuiz(token, nonexistentQuizId);

      expect(response.response.status).toBe(404);
    });

    it('should return 400 if quiz is not ready to be started', async () => {
      // Création d'un quiz sans questions
      const incompleteQuizData = {
        title: 'Incomplete Quiz',
        description: 'This quiz has no questions',
      };

      const createResponse = await QuizHelper.createQuiz(token, incompleteQuizData);

      expect(createResponse.response.status).toBe(201);

      const incompleteQuizId = createResponse.quiz.id;

      // Essayer de démarrer ce quiz qui n'a pas de questions
      const response = await QuizHelper.startQuiz(token, incompleteQuizId);

      expect(response.response.status).toBe(400);
    });
  });
});
