import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe, ClassSerializerInterceptor, HttpStatus } from '@nestjs/common';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from './infra/http/exception';
import { SuccessResponseInterceptor } from './infra/http/success';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableVersioning();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non attendus
      forbidNonWhitelisted: true,
      transform: true, // transforme les payloads vers les DTO
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  //app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const reflector = app.get(Reflector);

  // 1) sérialiser d'abord
  const classSerializer = new ClassSerializerInterceptor(reflector);
  // 2) puis wrapper 2xx
  const successWrapper = new SuccessResponseInterceptor(reflector);

  app.useGlobalInterceptors(classSerializer, successWrapper);

  const config = new DocumentBuilder()
    .setTitle('Runalytics API')
    .setDescription('Endpoints Runalytics (Strava, Coach, Analytics)')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);
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

  app.enableCors({
    origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  await app.listen(port ?? 3000);
}
bootstrap();
