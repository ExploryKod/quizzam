import {
  Schema as MongooseSchema,
  Prop,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseBaseSchema } from 'mongoose';

type Answer = {
  isCorrect: boolean;
  title: string;
};

type Question = {
  id: string;
  title: string;
  answers: Answer[];
}

// Define a separate schema for Questions
const QuestionSchema = new MongooseBaseSchema({
  id: { type: String, required: true, unique: true }, // Unique question ID
  title: { type: String, required: true },
  answers: { type: Array<Answer>, default: [] },
});

export namespace MongoQuiz {
  export const CollectionName = 'quizzes';

  @MongooseSchema({ collection: CollectionName })
  export class SchemaClass {
    @Prop({ type: String, required: true })
    _id: string;

    @Prop({ index: true, unique: true })
    executionId?: string;

    @Prop({ required: true })
    title: string;

    @Prop({ default: '' })
    description: string;

    @Prop({ type: [QuestionSchema], default: [], unique: true })
    questions: Array<Question>;

    @Prop({ required: true })
    userId: string;
  }

  export const Schema = SchemaFactory.createForClass(SchemaClass);
  export type Document = HydratedDocument<SchemaClass>;
}
