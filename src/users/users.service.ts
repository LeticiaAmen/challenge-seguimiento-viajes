import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersRepository } from './repositories/users.repository';
import { UserDocument } from './schemas/user.schema';

/**
 * Servicio de Usuarios - Capa de lógica de negocio.
 *
 * Esta clase contiene la lógica de negocio relacionada con usuarios:
 * - Determinación de roles basada en configuración
 * - Coordinación del Sync Pattern (crear usuario si no existe)
 *
 * Arquitectura del proyecto:
 * - Controllers/Gateways: Validan DTOs, llaman servicios, retornan respuestas
 * - Services (esta capa): Lógica de negocio, validaciones de roles
 * - Repositories: Único acceso a modelos de Mongoose
 *
 * ¿Por qué separar Service de Repository?
 * - El Repository solo maneja operaciones CRUD puras
 * - El Service añade lógica de negocio (determinar roles, validaciones)
 * - Facilita testing: puedes mockear el repository
 *
 * @see architecture.md - "Services: role checks, trip transitions, update logic"
 */
@Injectable()
export class UsersService {
    /**
     * Lista de UIDs de Firebase que corresponden a conductores.
     * Se carga desde la variable de entorno DRIVER_UIDS al iniciar el servicio.
     * Ejemplo en .env: DRIVER_UIDS=uid123,uid456,uid789
     */
    private readonly driverUids: string[];

    /**
     * Constructor que inyecta dependencias.
     *
     * @param usersRepository - Repositorio para acceso a datos de usuarios
     * @param configService - Servicio de NestJS para acceder a variables de entorno
     *
     * Durante la inicialización:
     * 1. Lee la variable DRIVER_UIDS del .env
     * 2. La divide por comas y filtra espacios vacíos
     * 3. Almacena la lista para uso en determineRoles()
     */
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly configService: ConfigService,
    ) {
        // Obtener UIDs de conductores desde variable de entorno (separados por coma)
        const driverUidsEnv = this.configService.get<string>('DRIVER_UIDS') || '';
        this.driverUids = driverUidsEnv.split(',').filter((uid) => uid.trim());
    }

    /**
     * Determina los roles de un usuario basándose en su Firebase UID.
     *
     * La lógica es determinista (siempre da el mismo resultado para el mismo UID):
     * - Si el UID está en la lista DRIVER_UIDS → rol 'driver'
     * - Si no está en la lista → rol 'passenger' (por defecto)
     *
     * ¿Por qué determinista desde env vars?
     * - Evita que usuarios se asignen roles arbitrariamente
     * - Los conductores son designados por configuración del sistema
     * - Fácil de gestionar: solo editar la variable de entorno
     *
     * @param firebaseUid - UID de Firebase del usuario
     * @returns Array con el rol: ['driver'] o ['passenger']
     *
     * @see auth-and-roles.md - "Determine driver role from env DRIVER_UIDS only (deterministic)"
     */
    private determineRoles(firebaseUid: string): string[] {
        if (this.driverUids.includes(firebaseUid)) {
            return ['driver'];
        }
        return ['passenger'];
    }

    /**
     * SYNC PATTERN: Busca o crea un usuario durante la autenticación.
     *
     * Este método se llama desde FirebaseStrategy después de validar el token.
     * Implementa el patrón de sincronización requerido:
     *
     * Flujo completo:
     * 1. Usuario hace request con token de Firebase en header Authorization
     * 2. FirebaseStrategy valida el token con Firebase Admin SDK
     * 3. Se obtiene { uid, email } del token decodificado
     * 4. Se llama este método con esos datos
     * 5. Se busca usuario en MongoDB por firebaseUid
     * 6. Si no existe, se crea con roles determinados por DRIVER_UIDS
     * 7. El usuario (nuevo o existente) se adjunta a la request
     *
     * @param firebaseUid - UID extraído del token de Firebase validado
     * @param email - Email extraído del token de Firebase
     * @returns Documento del usuario (existente o recién creado)
     *
     * @see hard-constraints.md - Sync Pattern
     * @see context.md - "Al validar el token, si el usuario no existe en MongoDB, crear registro"
     */
    async findOrCreateUser(
        firebaseUid: string,
        email: string,
    ): Promise<UserDocument> {
        const roles = this.determineRoles(firebaseUid);
        return this.usersRepository.findOrCreate(firebaseUid, email, roles);
    }

    /**
     * Busca un usuario por su UID de Firebase.
     * Wrapper simple sobre el repositorio para mantener la separación de capas.
     *
     * @param firebaseUid - UID de Firebase del usuario
     * @returns Usuario si existe, null si no
     */
    async findByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
        return this.usersRepository.findByFirebaseUid(firebaseUid);
    }

    /**
     * Busca un usuario por su ObjectId de MongoDB.
     * Útil para populate de relaciones (ej: Trip.passenger)
     *
     * @param id - ObjectId en formato string
     * @returns Usuario si existe, null si no
     */
    async findById(id: string): Promise<UserDocument | null> {
        return this.usersRepository.findById(id);
    }
}
