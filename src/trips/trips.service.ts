import { Injectable, BadRequestException } from '@nestjs/common';
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
}
