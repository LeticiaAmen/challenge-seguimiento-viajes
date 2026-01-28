import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Trip, TripDocument } from '../schemas/trip.schema';
import { TripStatus } from '../enums/trip-status.enum';

/**
 * TripsRepository
 * 
 * Capa de acceso a datos para la entidad Trip.
 * Encapsula todas las interacciones directas con Mongoose.
 * 
 * Responsabilidades:
 * - Crear viajes
 * - Buscar viajes (por ID, estado, etc.)
 * - Actualizar viajes
 * 
 * NO contiene lógica de negocio (validaciones de roles, reglas de estado, etc.).
 */
@Injectable()
export class TripsRepository {
    constructor(
        @InjectModel(Trip.name)
        private readonly tripModel: Model<TripDocument>,
    ) { }

    /**
     * Crea un nuevo viaje en estado REQUESTED.
     * 
     * @param passengerId - ID del pasajero que solicita el viaje (ObjectId o string).
     * @param destination - Dirección de destino.
     * @returns El documento del viaje creado.
     */
    async createTrip(
        passengerId: Types.ObjectId | string,
        destination: string,
    ): Promise<TripDocument> {
        const trip = new this.tripModel({
            passenger: new Types.ObjectId(passengerId),
            destination,
            status: TripStatus.REQUESTED,
        });
        return trip.save();
    }

    /**
     * Busca todos los viajes que están en estado REQUESTED (activos).
     * Se utiliza para que los conductores vean los viajes disponibles.
     * 
     * Incluye los datos del pasajero (populate).
     * 
     * @returns Lista de viajes encontrados con el pasajero poblado.
     */
    async findActiveRequestedTrips(): Promise<TripDocument[]> {
        return this.tripModel
            .find({ status: TripStatus.REQUESTED })
            .select('-__v')
            .populate('passenger', '_id firebaseUid email roles')
            .exec();
    }

    /**
     * Busca un viaje por su ID.
     * 
     * @param tripId - ID del viaje.
     * @returns El documento del viaje o null si no existe.
     */
    async findById(tripId: string): Promise<TripDocument | null> {
        return this.tripModel.findById(tripId).exec();
    }

    /**
     * Actualiza un viaje existente.
     * 
     * @param tripId - ID del viaje a actualizar.
     * @param updates - Objeto parcial con los campos a modificar.
     * @returns El documento actualizado (new: true) o null si no se encontró.
     */
    async updateTrip(
        tripId: string,
        updates: Partial<Trip>,
    ): Promise<TripDocument | null> {
        return this.tripModel
            .findByIdAndUpdate(tripId, updates, { new: true })
            .exec();
    }

    /**
     * Actualiza un viaje y retorna el documento actualizado con el pasajero poblado.
     * Útil para operaciones donde el cliente necesita la información completa del viaje (ej: WebSockets).
     * 
     * @param tripId - ID del viaje a actualizar.
     * @param updates - Modificaciones a aplicar.
     * @returns El viaje actualizado y poblado, o null si no existe.
     */
    async updateTripPopulated(
        tripId: string,
        updates: Partial<Trip>,
    ): Promise<TripDocument | null> {
        return this.tripModel
            .findByIdAndUpdate(tripId, updates, { new: true })
            .select('-__v')
            .populate('passenger', '_id firebaseUid email roles')
            .exec();
    }
}
