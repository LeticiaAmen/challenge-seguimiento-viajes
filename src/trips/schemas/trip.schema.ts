import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { TripStatus } from '../enums/trip-status.enum';
/**
 * Esquema de viaje que define la estructura de los documentos de viaje en la base de datos.
 * 
 * Campos:
 * - passenger: ID del pasajero (referencia a User).
 * - destination: Destino del viaje (string).
 * - status: Estado actual del viaje (TripStatus).
 * - currentLocation: Ubicación actual del viaje (opcional, string).
 */
export type TripDocument = HydratedDocument<Trip>;

@Schema({ timestamps: true })
export class Trip {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: User.name, required: true, index: true })
    passenger: Types.ObjectId;

    @Prop({ required: true, trim: true })
    destination: string;

    @Prop({ required: true, enum: TripStatus, default: TripStatus.REQUESTED })
    status: TripStatus;

    @Prop({ required: false, trim: true })
    currentLocation?: string;
}

export const TripSchema = SchemaFactory.createForClass(Trip);
