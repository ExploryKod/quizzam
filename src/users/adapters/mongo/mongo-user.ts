import {
  Schema as MongooseSchema,
  Prop,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export namespace MongoUser {
  export const CollectionName = 'users';

  @MongooseSchema({ collection: CollectionName })
  export class SchemaClass {
    @Prop({ type: String })
    _id: string;

    @Prop()
    username: string;

    /** Local JWT auth (optional; legacy Firebase users may omit). */
    @Prop({ type: String, lowercase: true, sparse: true, unique: true })
    email?: string;

    @Prop({ type: String })
    passwordHash?: string;
  }

  export const Schema = SchemaFactory.createForClass(SchemaClass);
  export type Document = HydratedDocument<SchemaClass>;
}
