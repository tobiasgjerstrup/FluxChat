export class HttpError extends Error {
    httpCode: number;

    constructor(message: string, httpCode: number) {
        super(message);
        this.name = 'HttpError';
        this.httpCode = httpCode;
        Error.captureStackTrace(this, this.constructor);
    }
}
// test
