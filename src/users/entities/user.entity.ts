import { Entity } from '../../shared/entity';

type UserProps = {
  uid: string;
  username: string;
  email?: string;
  password?: string;
};

export class User extends Entity<UserProps> {}
