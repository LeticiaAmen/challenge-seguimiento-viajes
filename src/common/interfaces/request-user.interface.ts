import { Types } from 'mongoose';

/**
 * Interfaz que representa al usuario autenticado en req.user
 *
 * Esta interfaz define la estructura del usuario que se adjunta a cada
 * request después de pasar por FirebaseStrategy. Contiene los datos
 * del usuario REAL de MongoDB, no solo el payload del token de Firebase.
 *
 * ¿Por qué usar una interfaz separada?
 * - Tipado fuerte: TypeScript sabe exactamente qué hay en req.user
 * - Independencia: No depende del Document de Mongoose
 * - Claridad: Define explícitamente qué campos están disponibles
 *
 * Uso con el decorador @CurrentUser:
 * ```typescript
 * @Get('profile')
 * getProfile(@CurrentUser() user: RequestUser) {
 *   console.log(user._id, user.email, user.roles);
 * }
 * ```
 */
export interface RequestUser {
    /**
     * ObjectId de MongoDB del usuario.
     * Útil para crear relaciones (ej: Trip.passenger = user._id)
     */
    _id: Types.ObjectId;

    /**
     * UID único de Firebase Auth.
     * Usado para identificar al usuario en el sistema de autenticación.
     */
    firebaseUid: string;

    /**
     * Email del usuario obtenido de Firebase.
     */
    email: string;

    /**
     * Roles del usuario en el sistema.
     * Valores: ['passenger'] o ['driver']
     * Usado por RolesGuard para control de acceso.
     */
    roles: string[];
}
