import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './users.service';

/**
 * Módulo de Usuarios - Encapsula toda la funcionalidad de usuarios.
 *
 * Este módulo sigue la arquitectura modular de NestJS donde cada dominio
 * tiene su propio módulo. UsersModule es uno de los tres módulos principales:
 * - AuthModule: Autenticación con Firebase
 * - UsersModule: Gestión de usuarios en MongoDB
 * - TripsModule: Gestión de viajes (a implementar)
 *
 * Estructura interna del módulo:
 * ```
 * users/
 * ├── schemas/
 * │   └── user.schema.ts      # Definición del schema de Mongoose
 * ├── repositories/
 * │   └── users.repository.ts # Acceso a datos (único que toca Mongoose)
 * ├── users.service.ts        # Lógica de negocio
 * └── users.module.ts         # Este archivo - configuración del módulo
 * ```
 *
 * @see architecture.md - "Use modules: AuthModule, UsersModule, TripsModule"
 */
@Module({
    /**
     * imports: Módulos de los que este módulo depende.
     *
     * MongooseModule.forFeature(): Registra el modelo User para este módulo.
     * - Permite usar @InjectModel(User.name) en el repositorio
     * - El schema se vincula a la colección 'users' en MongoDB
     */
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    ],

    /**
     * providers: Servicios disponibles dentro de este módulo.
     *
     * - UsersRepository: Capa de acceso a datos
     * - UsersService: Capa de lógica de negocio
     *
     * Estos providers pueden inyectarse entre sí dentro del módulo.
     */
    providers: [UsersRepository, UsersService],

    /**
     * exports: Lo que este módulo expone a otros módulos.
     *
     * - UsersService: Para que AuthModule pueda usar findOrCreateUser()
     *   durante la validación de tokens (Sync Pattern)
     * - UsersRepository: Por si otros módulos necesitan acceso directo
     *   (aunque normalmente deberían usar el Service)
     *
     * Para usar estos exports, otros módulos deben importar UsersModule.
     * Ejemplo en AuthModule:
     * ```typescript
     * @Module({
     *   imports: [UsersModule],
     *   // Ahora puede inyectar UsersService en FirebaseStrategy
     * })
     * export class AuthModule {}
     * ```
     */
    exports: [UsersService, UsersRepository],
})
export class UsersModule { }
