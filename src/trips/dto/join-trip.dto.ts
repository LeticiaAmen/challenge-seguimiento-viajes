import { IsString, IsNotEmpty } from 'class-validator';

/**
 * Data Transfer Object (DTO) para unirse a la sala de un viaje.
 * 
 * Se utiliza en el evento 'join-trip'.
 */
export class JoinTripDto {
    /**
     * ID del viaje al que se quiere suscribir.
     */
    @IsString()
    @IsNotEmpty()
    tripId: string;
}
