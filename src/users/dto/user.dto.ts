export class CreateUserDto {
  uid: string
  username: string;
}

export class FindUserDTO {
  uid: string;
  username: string;

  constructor(uid: string, username: string) {
    this.uid =uid;
    this.username = username;
  }
}