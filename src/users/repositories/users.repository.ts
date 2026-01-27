import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

/**
 * Repositorio de Usuarios - Capa de acceso a datos.
 *
 * Esta clase es la ÚNICA que tiene acceso directo al modelo de Mongoose.
 * Siguiendo el patrón Repository y la arquitectura limpia del proyecto:
 * - Controllers/Gateways → Services → Repositories → Base de datos
 *
 * ¿Por qué usar un repositorio?
 * 1. Abstracción: Los servicios no conocen detalles de Mongoose
 * 2. Testabilidad: Fácil de mockear en pruebas unitarias
 * 3. Mantenibilidad: Si cambiamos de MongoDB a otra BD, solo cambia esta capa
 *
 * @see architecture.md - "Repositories: the only place allowed to touch Mongoose models"
 */
@Injectable()
export class UsersRepository {
    /**
     * Constructor que inyecta el modelo de Mongoose.
     * @InjectModel obtiene el modelo registrado en MongooseModule.forFeature()
     */
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
    ) { }

    /**
     * Busca un usuario por su UID de Firebase.
     * Este método se usa principalmente durante la validación de tokens.
     *
     * @param firebaseUid - El UID único del usuario en Firebase Auth
     * @returns El documento del usuario si existe, null si no existe
     *
     * Nota: La búsqueda es eficiente gracias al índice en firebaseUid
     */
    async findByFirebaseUid(firebaseUid: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ firebaseUid }).exec();
    }

    /**
     * Crea un nuevo usuario en la base de datos.
     *
     * @param userData - Objeto con los datos del usuario a crear
     * @param userData.firebaseUid - UID de Firebase (requerido, único)
     * @param userData.email - Email del usuario
     * @param userData.roles - Array de roles ['passenger'] o ['driver']
     * @returns El documento del usuario recién creado
     *
     * Este método es privado en uso: solo se llama desde findOrCreate()
     * para implementar el Sync Pattern correctamente.
     */
    async create(userData: {
        firebaseUid: string;
        email: string;
        roles: string[];
    }): Promise<UserDocument> {
        const user = new this.userModel(userData);
        return user.save();
    }

    /**
     * SYNC PATTERN: Busca un usuario o lo crea si no existe.
     *
     * Este es el método clave que implementa el "Sync Pattern" requerido:
     * - Cuando un usuario se autentica con Firebase por primera vez
     * - El backend valida el token y obtiene firebaseUid + email
     * - Este método verifica si ya existe en MongoDB
     * - Si no existe, lo crea automáticamente
     *
     * Flujo:
     * 1. Token de Firebase validado → se obtiene uid y email
     * 2. Se busca usuario por firebaseUid
     * 3. Si existe → se retorna
     * 4. Si no existe → se crea y se retorna
     *
     * @param firebaseUid - UID de Firebase del usuario
     * @param email - Email extraído del token de Firebase
     * @param roles - Roles determinados por DRIVER_UIDS (desde el Service)
     * @returns El usuario existente o el recién creado
     *
     * @see hard-constraints.md - "Implement Sync Pattern: create Mongo user only if firebaseUid does not exist"
     */
    async findOrCreate(
        firebaseUid: string,
        email: string,
        roles: string[],
    ): Promise<UserDocument> {
        let user = await this.findByFirebaseUid(firebaseUid);
        if (!user) {
            user = await this.create({ firebaseUid, email, roles });
        }
        return user;
    }

    /**
     * Busca un usuario por su ObjectId de MongoDB.
     * Útil para operaciones que ya tienen el ID interno del documento.
     *
     * @param id - ObjectId de MongoDB en formato string
     * @returns El documento del usuario si existe, null si no
     */
    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }
}
