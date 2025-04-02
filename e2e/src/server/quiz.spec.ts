import request from 'supertest';
import { defaultUrl } from '../constants';
import { AuthHelper, TestUser } from '../helpers/auth.helper';
import { QuizHelper, TestQuiz } from '../helpers/quiz.helper';

// ========== RECUPERATION DE TOUS LES QUIZ POUR UN USER =============== //
describe('GET /api/quiz', () => {
  let testUser: TestUser;

  beforeAll(async () => {
    console.log('Creating and authenticating user for /api/quiz test...');
    testUser = await AuthHelper.createAndLoginUser({
      email: 'user@email.com',
      password: 'password',
      username: 'TestUser'
    });
  });

  afterAll(async () => {
    await AuthHelper.deleteUser(testUser.uid);
  });

  it('should return quizzes for the authenticated user', async () => {
    const response = await request(defaultUrl)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${testUser.token}`);

    console.log('Response:', response.body);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
    // TODO : Verifier pourquoi cela (pas demandé à l'issue 5)
    expect(response.body).toHaveProperty('_links');
    expect(response.body._links).toHaveProperty('create');
  });

  it('should return 401 if user is not authenticated', async () => {
    try {
      await request(defaultUrl).get('/api/quiz');
    } catch (e) {
      expect(e.response.status).toBe(401);
    }
  });
});

// ========== CREATION D'UN QUIZ =============== //
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
    const response = await request(defaultUrl)
        .post('/api/quiz')
        .set('Authorization', `Bearer ${testUser.token}`)
        .send(quizData);

    console.log('Location header:', response.headers.location);
    expect(response.status).toBe(201);
    expect(response.headers).toHaveProperty('location');
  });

  it('should return 401 if user is not authenticated', async () => {
    try {
      await request(defaultUrl).post('/api/quiz').send({
        email: 'user@email.com',
        password: 'passwor',
        returnSecureToken: true,
      });
    } catch (e) {
      expect(e.response.status).toBe(401);
    }
  });
});

// ========== RECUPERATION D'UN QUIZ PAR ID =============== //
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

    console.log('Retrieved Quiz:', JSON.stringify(response.body, null, 2));

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
    const response = await request(defaultUrl)
      .get('/api/quiz/nonexistentQuizId')
      .set('Authorization', `Bearer ${testUser.token}`);
      
    expect(response.status).toBe(404);
  });

  it("should return 401 if the quiz doesn't belong to the authenticated user", async () => {
    const response = await request(defaultUrl)
      .get(`/api/quiz/${quizId}`)
      .set('Authorization', `Bearer ${otherUser.token}`);

    expect(response.status).toBe(401);
  });
});

// ========== MODIFICATION D'UN QUIZ =============== // 
describe('PATCH /api/quiz/:id', () => {
  let testUser: any;
  let otherUserToken: string;
  let quizId: string;

  beforeAll(async () => {
    testUser = await AuthHelper.createAndLoginUser({
      email: 'user@email.com',
      password: 'password',
      username: 'TestUser'
    });

    // Création d'un quiz pour avoir un ID valide
    const quizData = {
      title: 'Quiz Test',
      description: 'Description du quiz test',
    };

    const createResponse = await request(defaultUrl)
      .post('/api/quiz')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send(quizData);

    expect(createResponse.status).toBe(201);

    // Récupération de l'ID du quiz
    const locationHeader = createResponse.headers.location;
    quizId = locationHeader.split('/').pop();
  });

  afterAll(async () => {
    await AuthHelper.deleteUser(testUser.uid);

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
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send(patchOperations);

    expect(response.status).toBe(401);
  });
});

// ========== CREATION D'UNE QUESTION =============== // !!!!!!! Pas encore refactoré !!!!!!! (et tout ceux qui suivent)
describe('POST /api/quiz/:id/questions', () => {
  let token: string;
  let quizId: string;
  let testUser: TestUser;

  beforeAll(async () => {
    testUser = await AuthHelper.createAndLoginUser();
    console.log('TEST USER : ' + testUser.token);
    token = testUser.token;
    const quizData = {
      title: 'Quiz Test addQuestions',
      description: 'Description du quiz test',
    };

    const createResponse = await request(defaultUrl)
      .post('/api/quiz')
      .set('Authorization', `Bearer ${testUser.token}`)
      .send(quizData);

    expect(createResponse.status).toBe(201);

    const locationHeader = createResponse.headers.location;
    quizId = locationHeader.split('/').pop();
  });

  afterAll(async () => {
    await AuthHelper.deleteUser(testUser.uid);
  });

  it('should add a question to a quiz successfully', async () => {
    const response = await QuizHelper.addQuestion(token, quizId);

    expect(response.response.status).toBe(201);
    expect(response.response.headers).toHaveProperty('location');
    console.log('Location:', response.response.headers.location);
  });

  it('should return 404 if the quiz does not exist', async () => {
    const response = await QuizHelper.addQuestion(token, 'nonexistentQuizId');

    expect(response.response.status).toBe(404);  
  });
});


// ========== MODIFICATION D'UNE QUESTION ========== //
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
    console.log('Location:', questionData.response.headers.location);

    const questionLocationHeader = questionData.response.headers.location;
    questionId = questionLocationHeader.split('/').pop();
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

    const response = await QuizHelper.updateQuestion('no-token', quizId, questionId, updatedQuestionData);

    expect(response.response.status).toBe(401);
  });
});

// ========== DEMARRAGE D'UN QUIZ =============== //
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
