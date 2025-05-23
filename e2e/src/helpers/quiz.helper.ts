// implement quiz helper

import request from 'supertest';
import { defaultUrl } from '../constants';

export interface TestQuiz {
  id?: string;
  title: string;
  description: string;
  questions?: TestQuestion[];
}

export interface TestQuestion {
  id?: string;
  title: string;
  answers: TestAnswer[];
}

export interface TestAnswer {
  title: string;
  isCorrect: boolean;
}

export class QuizHelper {
  /**
   * Creates a quiz for testing purposes
   * @param token Authentication token
   * @param quizData Quiz data to create
   * @returns The created quiz with its ID
   */
  static async createQuiz(token: string, quizData: TestQuiz = {
    title: 'Quiz Test',
    description: 'Description du quiz test',
  }): Promise<{response: any, quiz: TestQuiz}> {
    try {
      const response = await request(defaultUrl)
        .post('/api/quiz')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: quizData.title,
          description: quizData.description
        });

      if (response.status !== 201) {
        throw new Error(`Failed to create quiz: ${response.status}`);
      }

      // Extract quiz ID from location header
      const locationHeader = response.headers.location;
      const quizId = locationHeader.split('/').pop();

      return {response : response,
        quiz : {
        ...quizData,
        id: quizId
      }};
    } catch (error) {
      console.error('Error creating test quiz:', error);
      throw error;
    }
  }

  /**
   * Retrieves a quiz by ID
   * @param token Authentication token
   * @param quizId Quiz ID to retrieve
   * @returns The retrieved quiz
   */
  static async getQuiz(token: string, quizId: string): Promise<TestQuiz> {
    try {
      const response = await request(defaultUrl)
        .get(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${token}`);

      if (response.status !== 200) {
        throw new Error(`Failed to get quiz: ${response.status}`);
      }

      return {
        id: quizId,
        ...response.body
      };
    } catch (error) {
      console.error('Error getting test quiz:', error);
      throw error;
    }
  }

  /**
   * Updates a quiz title
   * @param token Authentication token
   * @param quizId Quiz ID to update
   * @param newTitle New title for the quiz
   */
  static async updateQuizTitle(token: string, quizId: string, newTitle: string): Promise<{response: any}> {
    try {
      const patchOperations = [{ op: 'replace', path: '/title', value: newTitle }];
      
      const response = await request(defaultUrl)
        .patch(`/api/quiz/${quizId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(patchOperations);

      if (response.status !== 204) {
        throw new Error(`Failed to update quiz title: ${response.status}`);
      }

      return {response : response};
    } catch (error) {
      console.error('Error updating test quiz title:', error);
      throw error;
    }
  }

  /**
   * Adds a question to a quiz
   * @param token Authentication token
   * @param quizId Quiz ID to add question to
   * @param question Question data to add
   * @returns The added question with its ID
   */
  static async addQuestion(token: string, quizId: string, question: TestQuestion = {
    title: 'What is the capital of France?',
      answers: [
        { title: 'Paris', isCorrect: true },
        { title: 'London', isCorrect: false },
        { title: 'Rome', isCorrect: false },
        { title: 'Berlin', isCorrect: false },
      ]
  }): Promise<{response: any, question: TestQuestion}> {
    try {
      const response = await request(defaultUrl)
        .post(`/api/quiz/${quizId}/questions`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: question.title,
          answers: question.answers
        });

      console.log('response', response.body);
      
      if (response.status === 404) {
        return {response : response,
          question : null};
      }

      if (response.status !== 201) {
        throw new Error(`Failed to add question: ${response.status}`);
      }

      // Extract question ID from location header
      const locationHeader = response.headers.location;
      const questionId = locationHeader.split('/').pop();

      return {response : response,
        question : {
        ...question,
        id: questionId
      }};
    } catch (error) {

      console.error('Error adding test question:', error);
      throw error;
    }
  }

  /**
   * Updates a question in a quiz
   * @param token Authentication token
   * @param quizId Quiz ID containing the question
   * @param questionId Question ID to update
   * @param question Updated question data
   */
  static async updateQuestion(
    token: string, 
    quizId: string, 
    questionId: string, 
    question: TestQuestion
  ): Promise<{response: any, question: TestQuestion}> {
    try {
      const response = await request(defaultUrl)
        .put(`/api/quiz/${quizId}/questions/${questionId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: question.title,
          answers: question.answers
        });

      if (response.status !== 204) {
        return {response : response,
          question : null};
      }

      return {response : response,
        question : question};
    } catch (error) {
      console.error('Error updating test question:', error);
      throw error;
    }
  }

  /**
   * Deletes a quiz
   * @param quizId Quiz ID to delete
   */
  static async deleteQuiz(quizId: string): Promise<void> {
    try {
      // Since there's no delete endpoint in the API, we can use a test endpoint
      const response = await request(defaultUrl)
        .delete(`/api/test/quiz/${quizId}`)
        .send();
      
      if (response.status !== 200) {
        console.warn(`Failed to delete quiz ${quizId}: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting test quiz:', error);
      // Don't throw here to prevent test failures during cleanup
    }
  }

  /**
   * Gets all quizzes for a user
   * @param token Authentication token
   * @returns List of quizzes
   */
  static async getUserQuizzes(token: string): Promise<TestQuiz[]> {
    try {
      const response = await request(defaultUrl)
        .get('/api/quiz')
        .set('Authorization', `Bearer ${token}`);

      if (response.status !== 200) {
        throw new Error(`Failed to get user quizzes: ${response.status}`);
      }

      return response.body.data;
    } catch (error) {
      console.error('Error getting user quizzes:', error);
      throw error;
    }
  }

  static async startQuiz(token: string, quizId: string): Promise<{response: any, executionId: string}> {
    try {
      const response = await request(defaultUrl)
        .post(`/api/quiz/${quizId}/start`)
        .set('Authorization', `Bearer ${token}`);

      if (response.status !== 201) {
        return {response : response, executionId : null};
      }

      return {response : response, executionId : response.headers.location.split('/').pop()};
    } catch (error) {
      console.error('Error starting test quiz:', error);
      throw error;
    }
  }
}
