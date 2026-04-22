/**
 * JSON Patch–style replace operation used by quiz update (persistence / domain).
 * Distinct from the HTTP DTO in `../dto/quiz.dto` (`PatchOperation` class for validation + OpenAPI).
 */
export type JsonPatchReplaceOperation = {
  op: 'replace';
  path: string;
  value: string;
};
