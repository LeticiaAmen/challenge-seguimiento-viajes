import { Controller, Post, Body, UseGuards, Req, Get } from '@nestjs/common';
import type { Request } from 'express';
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { FirebaseAuthGuard } from '../auth/guards/firebase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';

/**
 * Controlador de Viajes - Expone la funcionalidad REST para la gestión de viajes.
 */
@Controller('trips')
export class TripsController {
    constructor(private readonly tripsService: TripsService) { }

    /**
     * Endpoint para solicitar un nuevo viaje.
     * 
     * Acceso:
     * - Requiere autenticación (FirebaseAuthGuard)
     * - Requiere rol de PASAJERO (@Roles('passenger') + RolesGuard)
     * 
     * Validaciones:
     * - El body debe cumplir con CreateTripDto (validado por ValidationPipe global)
     * 
     * @param dto - Datos del viaje (destino)
     * @param req - Objeto Request (contiene el usuario autenticado en request.user)
     * @returns El viaje creado
     */
    @Post()
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles('passenger')
    async createTrip(
        @Body() dto: CreateTripDto,
        @Req() req: Request & { user: RequestUser }
    ) {
        // Obtenemos el usuario ya validado y sincronizado por los Guards anteriores
        const currentUser = req.user;

        // Delegamos la lógica al servicio
        return this.tripsService.requestTrip(currentUser, dto.destination);
    }

    /**
     * Endpoint para listar viajes activos.
     * 
     * Acceso:
     * - Requiere autenticación (FirebaseAuthGuard).
     * - Requiere rol de CONDUCTOR (@Roles('driver') + RolesGuard).
     * 
     * Función:
     * - Retorna todos los viajes con estado REQUESTED.
     * - Incluye información del pasajero (Email, UID, etc.).
     * 
     * @returns Array de viajes activos
     */
    @Get('active')
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles('driver')
    async listActiveTrips() {
        return this.tripsService.listActiveTripsForDrivers();
    }
}
