import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RequestUser } from '../common/interfaces/request-user.interface';

/**
 * Controlador de Autenticación.
 *
 * Módulo encargado de gestionar los endpoints relacionados con la autenticación.
 * Actualmente expone un endpoint de prueba para validar el token y obtener
 * la identidad del usuario.
 */
@Controller()
export class AuthController {
    /**
     * Endpoint GET /me
     *
     * Este endpoint está protegido por el guard FirebaseAuthGuard.
     * Solo se puede acceder si el request incluye un token Bearer válido de Firebase.
     *
     * @param req - El objeto Request de Express, que incluye al usuario validado en req.user
     * @returns - El objeto usuario extraído del token (firebaseUid, email, etc.)
     */
    @UseGuards(FirebaseAuthGuard)
    @Get('me')
    getProfile(@Req() req: Request & { user: RequestUser }) {
        // Retornamos directamente el usuario que la estrategia (FirebaseStrategy)
        // colocó en el request.
        return req.user;
    }
}
