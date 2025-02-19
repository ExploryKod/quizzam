import request from 'supertest';
import { defaultFirebaseUrl, defaultUrl } from '../constants';

describe('GET /api/quiz', () => {
  let token: string;

  beforeAll(async () => {
    const auth = await request(defaultFirebaseUrl).post('').send({
      email: 'user@email.com',
      password: 'password',
      returnSecureToken: true,
    });

    expect(auth.status).toBe(200);
    token = auth.body.idToken;
  });

  it('should return quizzes for the authenticated user', async () => {
    const response = await request(defaultUrl)
      .get('/api/quiz')
      .set('Authorization', `Bearer ${token}`);

    console.log('Response:', response.body);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
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

describe('POST /api/quiz', () => {
  let token: string;

  beforeAll(async () => {
    const auth = await request(defaultFirebaseUrl).post('').send({
      email: 'user@email.com',
      password: 'password',
      returnSecureToken: true,
    });

    expect(auth.status).toBe(200);
    token = auth.body.idToken;
  });

   it('should create a quiz successfully', async () => {
        const quizData = {
            title: 'Quiz Test POST /api/quiz',
            description: 'Description du quiz test',
        };
        const response = await request(defaultUrl)
            .post('/api/quiz')
            .set('Authorization', `Bearer ${token}`)
            .send(quizData);

        console.log('Location header:', response.headers.location);
        expect(response.status).toBe(201);
        expect(response.headers).toHaveProperty('location');
    });

    it('should return 401 if user is not authenticated', async () => {
        try {
          await request(defaultUrl).post('/api/quiz').send({
            email: 'user@email.com',
            password: 'password',
            returnSecureToken: true,
          });
        } catch (e) {
          expect(e.response.status).toBe(401);
        }
      });
});

//Get Quiz by ID
describe('GET /api/quiz/:id', () => {
    let token: string
    let otherUserToken: string;

    beforeAll(async () => {
        const auth = await request(defaultFirebaseUrl).post('').send({
          email: 'user@email.com',
          password: 'password',
          returnSecureToken: true,
        });
    
        expect(auth.status).toBe(200);
        token = auth.body.idToken;

    });

  it('should retrieve a quiz by ID for an authenticated user', async () => {

    const response = await request(defaultUrl)
        .get(`/api/quiz/wKkPH7AE773kbOu9Sf2B`)
        .set('Authorization', `Bearer ${token}`);

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
          .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(404);
      });


    it("should return 401 if the quiz doesn't belong to the authenticated user", async () => {
        const response = await request(defaultUrl)
        .get(`/api/quiz/wKkPH7AE773kbOu9Sf2B`)
        .set('Authorization', `Bearer ${otherUserToken}`);

        expect(response.status).toBe(401);
    });
});

// ========== DEMARRAGE D'UN QUIZ ( # CREATION ) ===============
describe('POST /api/quiz/<id>/start', () => {
  let token: string;
  let quizId: string;
  let existingQuizId: string;
  let nonexistentQuizId: string;

  beforeAll(async () => {
    const auth = await request(defaultFirebaseUrl).post('').send({
      email: 'user@email.com',
      password: 'password',
      returnSecureToken: true,
    });

    expect(auth.status).toBe(200);
    token = auth.body.idToken;

    const quizData = {
      title: 'Quiz Test',
      description: 'Description du quiz test',
    };

    const createResponse = await request(defaultUrl)
      .post('/api/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send(quizData);

    expect(createResponse.status).toBe(201);
    existingQuizId = createResponse.headers.location.split('/').pop();

    const otherAuth = await request(defaultFirebaseUrl).post('').send({
      email: 'usera@email.com',
      password: 'password',
      returnSecureToken: true,
    });

    expect(otherAuth.status).toBe(200);
    const otherToken = otherAuth.body.idToken;

    const response = await request(defaultUrl)
      .post(`/api/quiz/${existingQuizId}/start`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(response.status).toBe(403);
  });

  it('should start an existing quiz successfully with a correct pattern for its id', async () => {
    const response = await request(defaultUrl)
      .post(`/api/quiz/${existingQuizId}/start`)
      .set('Authorization', `Bearer ${token}`);

    console.log('Start Quiz Response:', response.body);
    console.log('Headers:', response.headers);

    expect(response.status).toBe(201);
    expect(response.headers).toHaveProperty('location');
    // REGEX : /execution/ suivi de 6 chiffres et/ou lettres en uppercase ou non, pas plus de 6 caractères (ex : /execution/abc123)
    expect(response.headers.location).toMatch(/^\/execution\/[a-zA-Z0-9]{6}$/);
  });

  it('should return 404 if quiz does not exist', async () => {
    nonexistentQuizId = 'ade1246';
    const response = await request(defaultUrl)
      .post(`/api/quiz/${nonexistentQuizId}/start`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 if user is not authenticated', async () => {
    try {
      await request(defaultUrl).post(`/api/quiz/${existingQuizId}/start`);
    } catch (e) {
      expect(e.response.status).toBe(401);
    }
  });
});

describe('PATCH /api/quiz/:id', () => {
  let token: string;
  let otherUserToken: string;
  let quizId: string;

  beforeAll(async () => {
    const auth = await request(defaultFirebaseUrl)
      .post('')
      .send({
        email: 'user@email.com',
        password: 'password',
        returnSecureToken: true,
      });

    expect(auth.status).toBe(200);
    token = auth.body.idToken;

    // Création d'un quiz pour avoir un ID valide
    const quizData = {
      title: 'Quiz Test',
      description: 'Description du quiz test',
    };

    const createResponse = await request(defaultUrl)
      .post('/api/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send(quizData);

    expect(createResponse.status).toBe(201);

    // Récupération de l'ID du quiz
    const locationHeader = createResponse.headers.location;
    quizId = locationHeader.split('/').pop();

  });

  it('should update a quiz title successfully', async () => {
    const patchOperations = [{ op: 'replace', path: '/title', value: 'New Quiz Title' }];

    const response = await request(defaultUrl)
      .patch(`/api/quiz/${quizId}`)
      .set('Authorization', `Bearer ${token}`)
      .send(patchOperations);

    expect(response.status).toBe(204);
  });

  it('should return 404 if the quiz does not exist', async () => {
    const patchOperations = [{ op: 'replace', path: '/title', value: 'New Title' }];

    const response = await request(defaultUrl)
      .patch('/api/quiz/nonexistentQuizId')
      .set('Authorization', `Bearer ${token}`)
      .send(patchOperations);

    expect(response.status).toBe(404);
  });

  it("should return 401 if the quiz doesn't belong to the authenticated user", async () => {
    const patchOperations = [{ op: 'replace', path: '/title', value: 'Hacked Title' }];

    const response = await request(defaultUrl)
      .patch(`/api/quiz/${quizId}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send(patchOperations);

    expect(response.status).toBe(401);
  });

});

describe('POST /api/quiz/:id/questions', () => {
  let token: string;
  let quizId: string;

  beforeAll(async () => {
    const auth = await request(defaultFirebaseUrl)
      .post('')
      .send({
        email: 'user@email.com',
        password: 'password',
        returnSecureToken: true,
      });

    expect(auth.status).toBe(200);
    token = auth.body.idToken;

    const quizData = {
      title: 'Quiz Test addQuestions',
      description: 'Description du quiz test',
    };

    const createResponse = await request(defaultUrl)
      .post('/api/quiz')
      .set('Authorization', `Bearer ${token}`)
      .send(quizData);

    expect(createResponse.status).toBe(201);

    const locationHeader = createResponse.headers.location;
    quizId = locationHeader.split('/').pop();

  });

  it('should add a question to a quiz successfully', async () => {
    const questionData = {
      title: 'What is the capital of France?',
      answers: [
        { title: 'Paris', isCorrect: true },
        { title: 'London', isCorrect: false },
        { title: 'Rome', isCorrect: false },
        { title: 'Berlin', isCorrect: false },
      ],
    };
    
    console.log(quizId);
    const response = await request(defaultUrl)
      .post(`/api/quiz/${quizId}/questions`)
      .set('Authorization', `Bearer ${token}`)
      .send(questionData);

    expect(response.status).toBe(201);
    expect(response.headers).toHaveProperty('location');
    console.log('Location:', response.headers.location);
  });

  it('should return 404 if the quiz does not exist', async () => {
    const questionData = {
      title: 'What is the capital of France?',
      answers: [
        { title: 'Paris', isCorrect: true },
        { title: 'London', isCorrect: false },
        { title: 'Rome', isCorrect: false },
        { title: 'Berlin', isCorrect: false },
      ],
    };

    const response = await request(defaultUrl)
      .post('/api/quiz/nonexistentQuizId/questions')
      .set('Authorization', `Bearer ${token}`)
      .send(questionData);

    expect(response.status).toBe(404);
  });

});
