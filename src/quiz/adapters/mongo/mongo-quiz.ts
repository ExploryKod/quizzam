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
// Title may be empty while the question is a draft; strict rules apply at quiz start, not on save.
const QuestionSchema = new MongooseBaseSchema({
  id: { type: String, required: true },
  title: { type: String, default: '' },
  answers: { type: Array<Answer>, default: [] },
});

export namespace MongoQuiz {
  export const CollectionName = 'quizzes';

  @MongooseSchema({ collection: CollectionName })
  export class SchemaClass {
    @Prop({ type: String, required: true })
    _id: string;

    /** Set only when the host starts a quiz; unique 6-char code. Sparse index so many drafts omit it. */
    @Prop({ type: String, required: false, unique: true, sparse: true })
    executionId?: string;

    @Prop({ required: true })
    title: string;

    @Prop({ default: '' })
    description: string;

    @Prop({ type: [QuestionSchema], default: [] })
    questions: Array<Question>;

    @Prop({ required: true })
    userId: string;
  }

  export const Schema = SchemaFactory.createForClass(SchemaClass);
  export type Document = HydratedDocument<SchemaClass>;
}
