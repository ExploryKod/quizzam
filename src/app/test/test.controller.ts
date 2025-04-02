import { Controller, Delete, Param, HttpCode } from '@nestjs/common';
import { FirebaseAdmin, InjectFirebaseAdmin } from 'nestjs-firebase';


@Controller('test')
export class TestController {
  constructor(
    @InjectFirebaseAdmin() private readonly firebase: FirebaseAdmin
  ) {}

  @Delete('users/:uid')
  @HttpCode(200)
  async deleteTestUser(@Param('uid') uid: string) {
    try {
      // supprime dans Firestore
      await this.firebase.firestore
        .collection('users')
        .doc(uid)
        .delete();
      
      // supprime dans Firebase Auth
      await this.firebase.auth.deleteUser(uid);

      return { success: true };
    } catch (error) {
      console.error('Error deleting test user:', error);
      throw error;
    }
  }

  @Delete('quiz/:id')
  @HttpCode(200)
  async deleteTestQuiz(@Param('id') id: string) {
    try {
      await this.firebase.firestore
        .collection('quizzes')  
        .doc(id)
        .delete();

      return { success: true };
    } catch (error) {
      console.error('Error deleting test quiz:', error);
      throw error;
    }
  }
}
