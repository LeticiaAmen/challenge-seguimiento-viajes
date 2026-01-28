import { SetMetadata } from '@nestjs/common';

/**
 * Clave utilizada para almacenar la metadata de roles.
 * El RolesGuard leerá esta clave para verificar permisos.
 * 
 * Se exporta para que pueda ser utilizada por el Guard.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorador @Roles
 * 
 * Este decorador permite especificar qué roles son requeridos para acceder a un endpoint o controlador.
 * No realiza validaciones por sí mismo; solo almacena la metadata que luego será leída por un Guard.
 * 
 * Uso:
 * @Roles('admin')
 * @Roles('driver', 'passenger')
 * 
 * @param roles - Lista de strings con los roles permitidos.
 * @returns Decorador que asigna la metadata ROLES_KEY.
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
