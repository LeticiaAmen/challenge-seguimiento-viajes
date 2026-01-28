import { WebSocketGateway, WebSocketServer, OnGatewayConnection, SubscribeMessage, MessageBody, ConnectedSocket, WsException } from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { FirebaseTokenService } from '../auth/services/firebase-token.service';
import { UsersService } from '../users/users.service';
import { TripsService } from './trips.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { JoinTripDto } from './dto/join-trip.dto';

/**
 * TripsGateway
 * 
 * Gestiona conexiones WebSocket para el seguimiento de viajes.
 * Implementa autenticación basada en tokens de Firebase en el handshake.
 */
@WebSocketGateway({
    cors: { origin: '*' },
})
export class TripsGateway implements OnGatewayConnection {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly firebaseTokenService: FirebaseTokenService,
        private readonly usersService: UsersService,
        private readonly tripsService: TripsService,
    ) { }

    /**
     * Helper para generar el nombre de la sala de un viaje.
     * Formato: "trip:<tripId>"
     */
    private getTripRoom(tripId: string): string {
        return `trip:${tripId}`;
    }

    /**
     * Maneja la conexión de un nuevo cliente WebSocket.
     * 
     * Flujo de Autenticación:
     * 1. Extrae el token del objeto `auth` del handshake (o header Authorization).
     * 2. Valida el token usando FirebaseTokenService.
     * 3. Obtiene o crea el usuario en Mongo (Sync Pattern).
     * 4. Almacena la información del usuario en `client.data`.
     * 
     * Si alguna validación falla, desconecta al cliente.
     */
    async handleConnection(client: Socket) {
        try {
            // 1. Extraer token
            let token = client.handshake.auth?.token;

            if (!token) {
                const authHeader = client.handshake.headers?.authorization;
                if (authHeader && authHeader.startsWith('Bearer ')) {
                    token = authHeader.substring(7);
                }
            }

            if (!token) {
                console.log('WS Connection rejected: No token provided');
                client.disconnect(true);
                return;
            }

            // 2. Validar token
            const { firebaseUid, email } = await this.firebaseTokenService.verifyIdToken(token);

            // 3. Sincronizar usuario (Sync Pattern)
            const mongoUser = await this.usersService.findOrCreateUser(firebaseUid, email);

            // 4. Guardar datos de sesión
            // Guardamos un objeto plano para acceso rápido posterior
            client.data.user = {
                _id: mongoUser._id.toString(),
                firebaseUid: mongoUser.firebaseUid,
                email: mongoUser.email,
                roles: mongoUser.roles,
            };

            console.log(`WS Connected: User ${mongoUser.email} (${mongoUser._id})`);

        } catch (error) {
            console.error('WS Connection rejected:', error.message);
            client.disconnect(true);
        }
    }

    /**
     * Maneja el evento 'update-location' enviado por los conductores.
     * 
     * @param dto - Datos de la actualización (tripId, ubicación, estado).
     * @param client - Socket del cliente conectado.
     * @returns El viaje actualizado (ack).
     */
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    @SubscribeMessage('update-location')
    async handleUpdateLocation(
        @MessageBody() dto: UpdateLocationDto,
        @ConnectedSocket() client: Socket,
    ) {
        try {
            // 1. Obtener usuario autenticado del socket
            const user = client.data.user;
            if (!user) {
                console.warn('Unauthorized update-location attempt');
                throw new WsException('Unauthorized');
            }

            // 2. Llamar al servicio de negocios
            // Delegamos la validación de roles y lógica al servicio
            const updatedTrip = await this.tripsService.updateLocation(
                user,
                dto.tripId,
                dto.location,
                dto.status,
            );

            // 3. Emitir evento de actualización
            // Emitimos SOLO a los clientes suscritos a la sala del viaje (incluyendo al driver si está unido)
            const room = this.getTripRoom(dto.tripId);

            // Unimos al driver a la sala por si no lo estaba (para recibir sus propios updates si quisiera, o por consistencia)
            client.join(room);

            this.server.to(room).emit('trip-update', updatedTrip);

            // 4. Retornar confirmación al emisor (Ack)
            return updatedTrip;

        } catch (error) {
            console.error('Error in handleUpdateLocation:', error.message);

            // Si es una excepción de WS, la relanzamos
            if (error instanceof WsException) {
                throw error;
            }

            // Si es un error de lógica de negocio (HttpException del servicio),
            // lo convertimos a WsException para que el cliente lo reciba limpio.
            // Los errores del servicio son: ForbiddenException, BadRequestException, NotFoundException
            if (error.status && typeof error.status === 'number') {
                throw new WsException(error.message);
            }

            // Error no controlado
            throw new WsException('Internal server error processing location update');
        }
    }

    /**
     * Permite a un cliente (pasajero o conductor) unirse a la sala de un viaje para recibir actualizaciones.
     */
    @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
    @SubscribeMessage('join-trip')
    async handleJoinTrip(
        @MessageBody() dto: JoinTripDto,
        @ConnectedSocket() client: Socket,
    ) {
        // 1. Auth check
        if (!client.data.user) {
            throw new WsException('Unauthorized');
        }

        // 2. Verificar existencia del viaje 
        // Esto evita que se suscriban a salas basura
        const trip = await this.tripsService.getTrip(dto.tripId);
        if (!trip) {
            throw new WsException('Trip not found');
        }

        // 3. Unirse a la sala
        const room = this.getTripRoom(dto.tripId);
        client.join(room);

        console.log(`User ${client.data.user.email} joined room ${room}`);

        // 4. Retornar ack
        return { ok: true, room };
    }

    /**
     * Permite a un cliente abandonar la sala de un viaje.
     */
    @SubscribeMessage('leave-trip')
    async handleLeaveTrip(
        @MessageBody() dto: JoinTripDto, // Reusamos DTO ya que solo necesitamos tripId
        @ConnectedSocket() client: Socket,
    ) {
        const room = this.getTripRoom(dto.tripId);
        client.leave(room);
        console.log(`User ${client.data.user?.email} left room ${room}`);
        return { ok: true, room };
    }
}
