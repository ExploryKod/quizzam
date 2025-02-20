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
            title: 'Quiz Test',
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
    let quizId:string
    let otherUserToken: string;

    beforeAll(async () => {
        const auth = await request(defaultFirebaseUrl).post('').send({
          email: 'user@email.com',
          password: 'password',
          returnSecureToken: true,
        });
    
        expect(auth.status).toBe(200);
        token = auth.body.idToken;

          // Création d'un quiz pour récupérer un ID valide
            const quizData = {
                title: 'Quiz Test',
                description: 'Description du quiz test',
            };
  
        const createResponse = await request(defaultUrl)
            .post('/api/quiz')
            .set('Authorization', `Bearer ${token}`)
            .send(quizData);
    
        expect(createResponse.status).toBe(201);
      
        // Extraction de l'ID du quiz depuis l'en-tête Location
        const locationHeader = createResponse.headers.location;
        console.log('Created Quiz Location:', locationHeader);
    
        quizId = locationHeader.split('/').pop();
    });

    it('should retrieve a quiz by ID for an authenticated user', async () => {

    const response = await request(defaultUrl)
        .get(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${token}`);

    console.log('Retrieved Quiz:', response.body);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('title', 'Quiz Test');
    expect(response.body).toHaveProperty('description', 'Description du quiz test');
    expect(response.body).toHaveProperty('questions');
    expect(Array.isArray(response.body.questions)).toBe(true);

    });


    it('should return 404 if the quiz does not exist', async () => {
        const response = await request(defaultUrl)
          .get('/api/quiz/nonexistentQuizId')
          .set('Authorization', `Bearer ${token}`);
    
        expect(response.status).toBe(404);
      });


    it("should return 401 if the quiz doesn't belong to the authenticated user", async () => {
        const response = await request(defaultUrl)
        .get(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

        expect(response.status).toBe(401);
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
