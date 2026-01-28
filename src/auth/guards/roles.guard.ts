import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';

/**
 * Guard para validación de roles.
 * 
 * Este guard verifica si el usuario autenticado tiene los roles necesarios para acceder
 * a un recurso protegido con el decorador @Roles().
 * 
 * Flujo:
 * 1. Lee la metadata 'roles' del handler (método) y la clase (controller).
 * 2. Si no hay roles requeridos, permite el acceso.
 * 3. Si hay roles, verifica que req.user.roles contenga al menos uno de ellos.
 * 4. Si no cumple, lanza 403 Forbidden.
 */
@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Leer metadata de roles combinando handler y clase (handler tiene prioridad)
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // Si el endpoint no requiere roles específicos, permitir acceso
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user as RequestUser | undefined;

        // Validación defensiva: asegurar que el usuario existe (autenticado)
        // Normalmente esto corre después de FirebaseAuthGuard, pero por seguridad verificamos.
        if (!user || !user.roles) {
            throw new ForbiddenException('User roles not found or user not authenticated');
        }

        // Verificar si el usuario tiene al menos uno de los roles requeridos
        const hasRole = requiredRoles.some((role) => user.roles.includes(role));

        if (!hasRole) {
            throw new ForbiddenException('Insufficient permissions');
        }

        return true;
    }
}