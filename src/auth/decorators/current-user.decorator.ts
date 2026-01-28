import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../../common/interfaces/request-user.interface';

/**
 * Decorador @CurrentUser - Extrae el usuario autenticado del request.
 *
 * Este decorador simplifica el acceso al usuario autenticado en los controllers.
 * En lugar de acceder manualmente a req.user, el decorador lo hace por ti.
 *
 * El usuario que retorna es el usuario REAL de MongoDB (no solo el payload
 * de Firebase), incluyendo su _id, firebaseUid, email y roles.
 *
 * IMPORTANTE: Este decorador solo funciona en rutas protegidas con FirebaseAuthGuard.
 * Si la ruta no está protegida, user será undefined.
 */
export const CurrentUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): RequestUser => {
        const request = ctx.switchToHttp().getRequest();
        return request.user as RequestUser;
    },
);
