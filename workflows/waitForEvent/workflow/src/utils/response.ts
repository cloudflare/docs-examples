import { CORS_HEADERS, HTTP_STATUS } from '../config';
import { ApiResponse } from '../types';

export class ResponseHandler {
  static success<T>(data: T, status: number = HTTP_STATUS.OK): Response {
    const response: ApiResponse<T> = {
      success: true,
      ...data,
    };
    return Response.json(response, {
      status,
      headers: CORS_HEADERS,
    });
  }

  static error(message: string, status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR): Response {
    const response: ApiResponse<null> = {
      success: false,
      error: message,
    };
    return Response.json(response, {
      status,
      headers: CORS_HEADERS,
    });
  }

  static badRequest(message: string): Response {
    return this.error(message, HTTP_STATUS.BAD_REQUEST);
  }

  static notFound(message: string = 'Resource not found'): Response {
    return this.error(message, HTTP_STATUS.NOT_FOUND);
  }

  static methodNotAllowed(message: string = 'Method not allowed'): Response {
    return this.error(message, HTTP_STATUS.METHOD_NOT_ALLOWED);
  }

  static corsPreflight(): Response {
    return new Response(null, {
      headers: CORS_HEADERS,
    });
  }
}
