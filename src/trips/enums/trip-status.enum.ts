/**
 * Enum que representa los estados posibles de un viaje.
 * 
 * Estados definidos:
 * - REQUESTED: El pasajero solicitó el viaje, esperando conductor.
 * - ACCEPTED: Un conductor aceptó el viaje, en camino al origen.
 * - IN_PROGRESS: El pasajero subió y el viaje comenzó.
 * - COMPLETED: El viaje finalizó exitosamente.
 */
export enum TripStatus {
    REQUESTED = 'REQUESTED',
    ACCEPTED = 'ACCEPTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
}
