import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './users.service';

/**
 * Módulo de Usuarios - Encapsula toda la funcionalidad de usuarios.
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
     */
    exports: [UsersService, UsersRepository],
})
export class UsersModule { }
