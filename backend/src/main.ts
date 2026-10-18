import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SafeExceptionFilter } from "./common/safe-exception.filter";
import {
  OperationalLoggingInterceptor,
  requestIdMiddleware,
} from "./common/operational-logging";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(requestIdMiddleware);
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new SafeExceptionFilter());
  app.useGlobalInterceptors(new OperationalLoggingInterceptor());
  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
