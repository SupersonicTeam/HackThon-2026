import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const corsOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable CORS - allow all origins in development
  app.enableCors({
    origin: corsOrigins.length
      ? [...corsOrigins, /^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/]
      : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AgroTributos API')
    .setDescription(
      'API para plataforma educativa sobre reforma tributária no agronegócio',
    )
    .setVersion('1.0')
    .addTag('chat', 'Assistente IA')
    .addTag('diagnostico', 'Diagnóstico tributário')
    .addTag('calendario', 'Calendário de obrigações')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  const appHost = process.env.APP_HOST || 'localhost';
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces

  console.log(`🚀 AgroTributos API running on http://${appHost}:${port}`);
  console.log(`📚 Swagger docs: http://${appHost}:${port}/api/docs`);
  console.log(`🌐 Network access: http://<your-ip>:${port}`);
}

bootstrap();
