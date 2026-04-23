const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ?? '3000';

export const defaultUrl = `http://${host}:${port}`;
export const defaultFirebaseUrl = `https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=AIzaSyDwtB8c1BsnVI6R8dwHc9S5yl6DY6IEFWA`