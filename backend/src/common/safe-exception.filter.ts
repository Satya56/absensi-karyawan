import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";
import { logOperationalEvent, RequestWithId } from "./operational-logging";

@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException && status < 500
        ? exception.message
        : "An unexpected error occurred.";
    const request = http.getRequest<RequestWithId>();
    logOperationalEvent(status >= 500 ? "error" : "warn", "http.exception.filtered", {
      request_id: request.requestId ?? "unavailable",
      status_code: status,
    });
    response.status(status).json({ statusCode: status, message });
  }
}
