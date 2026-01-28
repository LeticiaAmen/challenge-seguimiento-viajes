import { IsString, IsNotEmpty, IsEnum, IsIn } from 'class-validator';
import { TripStatus } from '../enums/trip-status.enum';

/**
 * Data Transfer Object (DTO) para la creación de actualizaciones de ubicación vía WebSocket.
 * 
 * Este DTO se utiliza cuando un cliente envía el evento 'update-location'.
 * Valida que los datos recibidos (tripId, location, status) sean correctos antes
 * de procesarlos en el Gateway o Servicio.
 */
export class UpdateLocationDto {
    /**
     * Identificador único del viaje.
     * Debe ser un UUID o string válido.
     */
    @IsString()
    @IsNotEmpty()
    tripId: string;

    /**
     * Ubicación actual del conductor en formato string.
     * Puede ser coordenadas "lat,long" o cualquier formato acordado.
     */
    @IsString()
    @IsNotEmpty()
    location: string;

    /**
     * Estado actual del viaje reportado por el conductor.
     * 
     * Validaciones:
     * - Debe ser un valor válido del enum TripStatus.
     * - NO puede ser REQUESTED, ya que ese estado es inicial y no una actualización.
     */
    @IsEnum(TripStatus)
    @IsIn([TripStatus.ACCEPTED, TripStatus.IN_PROGRESS, TripStatus.COMPLETED])
    status: TripStatus;
}
