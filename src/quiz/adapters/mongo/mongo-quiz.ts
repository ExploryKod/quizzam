import {
  Schema as MongooseSchema,
  Prop,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

type Answer = {
  isCorrect: boolean;
  title: string;
}

type Question = {
  id: string;
  title: string;
  answers: Answer[];
}

export namespace MongoQuiz {
  export const CollectionName = 'quizzes';

  @MongooseSchema({ collection: CollectionName })
  export class SchemaClass {
    @Prop({ type: String })
    _id: string;

    @Prop()
    title: string;

    @Prop()
    description: string;

    @Prop()
    questions: Array<Question>;

    @Prop()
    userId: string;
  }

  export const Schema = SchemaFactory.createForClass(SchemaClass);
  export type Document = HydratedDocument<SchemaClass>;
}
