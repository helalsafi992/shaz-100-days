// Safe errors shared by server validation and deterministic client previews.
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
