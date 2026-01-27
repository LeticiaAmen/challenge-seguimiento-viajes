import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

/**
 * Data Transfer Object (DTO) para la creación de un nuevo viaje.
 * 
 * Este objeto define la estructura y validaciones de los datos que envía el cliente
 * al endpoint POST /trips.
 * 
 * El ValidationPipe de NestJS usará estos decoradores para validar el body de la request
 * antes de que llegue al controlador.
 */
export class CreateTripDto {
    /**
     * Dirección de destino del viaje.
     * 
     * Validaciones:
     * - Debe ser un string (@IsString)
     * - No puede estar vacío (@IsNotEmpty)
     * - Longitud máxima de 200 caracteres (@MaxLength) para evitar abusos o descripciones excesivas.
     */
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    destination: string;
}