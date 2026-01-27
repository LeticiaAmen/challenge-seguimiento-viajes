import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { FirebaseStrategy } from './strategies/firebase.strategy';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { AuthController } from './auth.controller';
import { AuthDebugController } from './auth-debug.controller';
import { UsersModule } from '../users/users.module';
import { RolesGuard } from './guards/roles.guard';

/**
 * Módulo de Autenticación - Configura la autenticación con Firebase.
 *
 * Este módulo integra:
 * - PassportModule: Framework de autenticación para NestJS
 * - FirebaseStrategy: Estrategia que valida tokens de Firebase
 *
 * No implementa endpoints de login/registro porque Firebase maneja eso.
 * Solo valida tokens.
 */
@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'firebase-jwt' }),
        ConfigModule,
        UsersModule,
    ],
    providers: [FirebaseStrategy, FirebaseAuthGuard, RolesGuard],
    controllers: [AuthController, AuthDebugController],
    exports: [PassportModule, FirebaseAuthGuard, RolesGuard],
})
export class AuthModule { }
