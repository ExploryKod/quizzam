import { User } from '../entities/user.entity';

export const testUsers = {
  user: new User({
    uid: 'kBLwc2mdo7R1DeHkyN0d3YqjLdH2',
    email: 'user@email.com',
    username: 'TestUser',
  }),

  usera: new User({
    uid: '9urslj5LY6RqYJANIGFG1g1esgw1',
    email: 'usera@email.com',
    username: 'atopos',
  }),
};
