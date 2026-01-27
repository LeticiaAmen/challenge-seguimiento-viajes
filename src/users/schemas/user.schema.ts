import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * Tipo que combina la clase User con Document de Mongoose.
 * Esto permite tener acceso tanto a las propiedades definidas en User
 * como a los métodos de Document (save, remove, etc.)
 */
export type UserDocument = User & Document;

/**
 * Schema de Usuario para MongoDB usando Mongoose y NestJS.
 *
 * Este schema representa a los usuarios del sistema de seguimiento de viajes.
 * Los usuarios pueden ser pasajeros (passenger) o conductores (driver).
 *
 * IMPORTANTE - Decisiones de diseño:
 * - NO tiene campo password: La autenticación se maneja completamente por Firebase.
 *   El backend solo valida tokens de Firebase, nunca maneja credenciales directamente.
 * - firebaseUid está indexado: Permite búsquedas rápidas cuando se valida un token.
 * - timestamps: true añade automáticamente createdAt y updatedAt.
 */
@Schema({ timestamps: true })
export class User {
    /**
     * Identificador único de Firebase.
     * Este campo vincula al usuario de MongoDB con su cuenta en Firebase Auth.
     * - unique: Garantiza que no haya duplicados
     * - index: Mejora el rendimiento de búsquedas (usado en cada validación de token)
     */
    @Prop({ required: true, unique: true, index: true })
    firebaseUid: string;

    /**
     * Email del usuario obtenido del token de Firebase.
     * Se sincroniza automáticamente cuando el usuario se autentica por primera vez.
     */
    @Prop({ required: true })
    email: string;

    /**
     * Roles del usuario en el sistema.
     * Valores posibles:
     * - ['passenger']: Usuario que puede solicitar viajes (rol por defecto)
     * - ['driver']: Usuario que puede aceptar y gestionar viajes
     *
     * El rol se determina automáticamente basándose en la variable de entorno DRIVER_UIDS.
     */
    @Prop({ type: [String], default: ['passenger'] })
    roles: string[];
}

/**
 * Schema de Mongoose generado a partir de la clase User.
 * Se usa para registrar el modelo en MongooseModule.forFeature()
 */
export const UserSchema = SchemaFactory.createForClass(User);
