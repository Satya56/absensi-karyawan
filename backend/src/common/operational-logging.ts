import { randomUUID } from "crypto";
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Request, Response } from "express";
import { catchError, Observable, tap, throwError } from "rxjs";

export type RequestWithId = Request & { requestId?: string };

const logger = new Logger("OperationalLog");
export type OperationalLogLevel = "info" | "warn" | "error";

/** Emit only fixed event codes and explicitly supplied, non-sensitive operational metadata. */
export function logOperationalEvent(
  level: OperationalLogLevel,
  eventCode: string,
  metadata: Record<string, string | number | boolean | null>,
) {
  const message = JSON.stringify({ event_code: eventCode, ...metadata });
  if (level === "error") logger.error(message);
  else if (level === "warn") logger.warn(message);
  else logger.log(message);
}

export function requestIdMiddleware(
  request: RequestWithId,
  response: Response,
  next: () => void,
) {
  // Do not trust a caller-supplied ID; it could contain sensitive or forged log data.
  request.requestId = randomUUID();
  response.setHeader("X-Request-Id", request.requestId);
  next();
}

@Injectable()
export class OperationalLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<RequestWithId>();
    const response = http.getResponse<Response>();
    const requestId = request.requestId ?? "unavailable";
    const handler = context.getHandler().name;
    const controller = context.getClass().name.replace(/Controller$/, "");
    const operation = `${controller}.${handler}`;
    const startedAt = Date.now();

    const metadata = (statusCode: number) => ({
      request_id: requestId,
      method: request.method,
      operation,
      status_code: statusCode,
      duration_ms: Date.now() - startedAt,
    });

    return next.handle().pipe(
      tap(() => {
        logOperationalEvent("info", "http.request.completed", metadata(response.statusCode));
      }),
      catchError((error: unknown) => {
        const statusCode =
          typeof error === "object" &&
          error !== null &&
          "getStatus" in error &&
          typeof error.getStatus === "function"
            ? error.getStatus()
            : 500;
        logOperationalEvent(
          statusCode >= 500 ? "error" : "warn",
          "http.request.failed",
          metadata(statusCode),
        );
        return throwError(() => error);
      }),
    );
  }
}
