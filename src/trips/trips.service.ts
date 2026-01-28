import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { TripStatus } from './enums/trip-status.enum';
import { TripsRepository } from './repositories/trips.repository';
import { RequestUser } from '../common/interfaces/request-user.interface';
import { TripDocument } from './schemas/trip.schema';

/**
 * TripsService
 * 
 * Contiene la lógica de negocio relacionada con los viajes.
 * Coordina las operaciones entre los controladores (o gateways) y el repositorio de datos.
 * 
 * Responsabilidades:
 * - Gestionar la creación de viajes solicitados por pasajeros.
 * - Proveer listados de viajes disponibles para conductores.
 */
@Injectable()
export class TripsService {
    constructor(private readonly tripsRepository: TripsRepository) { }

    /**
     * Permite a un pasajero solicitar un nuevo viaje.
     * 
     * @param user - Usuario autenticado que solicita el viaje (Passenger).
     * @param destination - Dirección de destino deseada.
     * @returns El viaje creado en estado REQUESTED.
     * @throws BadRequestException si el usuario no tiene un ID válido.
     */
    async requestTrip(user: RequestUser, destination: string): Promise<TripDocument> {
        // Validación defensiva: asegurar que tenemos el ID de Mongo del usuario
        if (!user._id) {
            throw new BadRequestException('User ID is missing for the authenticated user');
        }

        // Delegamos la creación al repositorio
        return this.tripsRepository.createTrip(user._id, destination);
    }

    /**
     * Obtiene la lista de viajes activos (en estado REQUESTED) para que los conductores los vean.
     * 
     * @returns Lista de viajes con la información del pasajero poblada.
     */
    async listActiveTripsForDrivers(): Promise<TripDocument[]> {
        return this.tripsRepository.findActiveRequestedTrips();
    }

    /**
     * Actualiza la ubicación y estado de un viaje (para WebSockets).
     * 
     * @param driverUser - Usuario que realiza la actualización (debe ser conductor).
     * @param tripId - ID del viaje.
     * @param location - Nueva ubicación (lat,long o similar).
     * @param status - Nuevo estado del viaje.
     * @returns El viaje actualizado con datos del pasajero.
     * @throws ForbiddenException si el usuario no es conductor.
     * @throws BadRequestException si el tripId es inválido o el estado es incorrecto.
     * @throws NotFoundException si el viaje no existe.
     */
    async updateLocation(
        driverUser: RequestUser,
        tripId: string,
        location: string,
        status: TripStatus,
    ): Promise<TripDocument> {
        // 1. Validar que el usuario tenga rol de conductor
        if (!driverUser.roles?.includes('driver')) {
            throw new ForbiddenException('Only drivers can update trip location');
        }

        // 2. Validar formato de tripId
        if (!Types.ObjectId.isValid(tripId)) {
            throw new BadRequestException('Invalid tripId format');
        }

        // 3. Validar que el estado no sea REQUESTED (ya que es para updates)
        if (status === TripStatus.REQUESTED) {
            throw new BadRequestException('Cannot set status back to REQUESTED');
        }

        // 4. Verificar existencia del viaje 
        // Optimizamos llamando directo al update, si devuelve null es que no existe.
        // Sin embargo, para cumplir estrictamente los pasos de "Not Found" vs "Logic", 
        // a veces se separa. Aquí haremos el update directo por eficiencia y si es null lanzamos 404.

        const updatedTrip = await this.tripsRepository.updateTripPopulated(tripId, {
            currentLocation: location,
            status: status,
        });

        if (!updatedTrip) {
            throw new NotFoundException(`Trip with ID ${tripId} not found`);
        }

        return updatedTrip;
    }

    /**
     * Obtiene un viaje por su ID.
     * Útil para validaciones simples.
     * 
     * @param tripId - ID del viaje.
     * @returns El viaje o null si no existe.
     */
    async getTrip(tripId: string): Promise<TripDocument | null> {
        return this.tripsRepository.findById(tripId);
    }
}
