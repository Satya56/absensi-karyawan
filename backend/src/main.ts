import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { SafeExceptionFilter } from "./common/safe-exception.filter";

async function bootstrap() {
  // Disable framework request/error logging; employee data and photo metadata are sensitive.
  const app = await NestFactory.create(AppModule, { logger: false });
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
  await app.listen(process.env.PORT || 3000);
}
void bootstrap();
