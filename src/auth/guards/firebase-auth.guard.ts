import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Guard personalizado para proteger rutas con autenticación de Firebase.
 * Extiende AuthGuard configurado con la estrategia 'firebase-jwt'.
 *
 * Este guard se encarga de verificar que el token JWT sea válido antes de
 * permitir el acceso a un endpoint.
 */
@Injectable()
export class FirebaseAuthGuard extends AuthGuard('firebase-jwt') {
    /**
     * Método que maneja el resultado de la validación del token.
     * Se ejecuta automáticamente después de que la Strategy valida el token.
     *
     * @param err - Error si ocurrió alguno durante la validación (ej: token malformado)
     * @param user - El usuario retornado por la Strategy (validate()) o null/false si falló
     * @param info - Información adicional del error (ej: "token expired")
     * @param context - Contexto de ejecución (request, response, etc.)
     * @returns el usuario validado si todo está bien.
     * @throws UnauthorizedException si el token es inválido o no existe.
     */
    handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
        // Validación estricta:
        // Si hay un error reportado por Passport (err) O si no hay usuario (user es false/null),
        // lanzamos UnauthorizedException (401).
        if (err || !user) {
            throw err || new UnauthorizedException();
        }

        // Si la validación es exitosa, retornamos el usuario.
        // NestJS lo asignará automáticamente a request.user.
        return user;
    }
}
