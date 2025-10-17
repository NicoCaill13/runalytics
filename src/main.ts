import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, ClassSerializerInterceptor, HttpStatus } from '@nestjs/common';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './infra/http/exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableVersioning();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non attendus
      forbidNonWhitelisted: true,
      transform: true, // transforme les payloads vers les DTO
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const config = new DocumentBuilder()
    .setTitle('Runalytics API')
    .setDescription('Endpoints Runalytics (Strava, Coach, Analytics)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new PrismaClientExceptionFilter(httpAdapter, {
      P2000: HttpStatus.BAD_REQUEST,
      P2002: HttpStatus.CONFLICT,
      P2025: HttpStatus.NOT_FOUND,
      P2003: HttpStatus.BAD_REQUEST,
    }),
    new AllExceptionsFilter(),
  );
  const configService = app.get(ConfigService);

  const port = configService.get('APP_PORT');

  await app.listen(port ?? 3000);
}
bootstrap();
