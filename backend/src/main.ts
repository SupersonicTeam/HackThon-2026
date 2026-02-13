import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable CORS - allow all origins in development
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:8080',
      'http://10.35.41.217:8080',
      /^http:\/\/\d+\.\d+\.\d+\.\d+:\d+$/, // Accept any IP:port
    ],
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
  await app.listen(port, '0.0.0.0'); // Listen on all network interfaces

  console.log(`🚀 AgroTributos API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  console.log(`🌐 Network access: http://<your-ip>:${port}`);
}

bootstrap();
