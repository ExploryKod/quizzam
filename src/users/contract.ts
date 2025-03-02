import { z } from 'zod';

export namespace userAPI {
  export namespace addUsername {
    export const schema = z.object({
      username: z.string(),
    });

    export type Request = z.infer<typeof schema>;
    export type Response = void
  }



}