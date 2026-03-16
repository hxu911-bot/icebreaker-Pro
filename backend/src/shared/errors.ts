export class AppError extends Error {
  cooldownWarnings?: any[];
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}
export class ValidationError extends AppError {
  constructor(message: string) { super(400, message); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') { super(401, message); }
}
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') { super(403, message); }
}
export class NotFoundError extends AppError {
  constructor(message = 'Not found') { super(404, message); }
}
export class UnprocessableError extends AppError {
  constructor(message: string) { super(422, message); }
}
