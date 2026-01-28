import { HttpException } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

/**
 * Maneja errores en el Gateway convirtiéndolos a WsException.
 * 
 * Si el error es una HttpException (generada por el Service/Controller),
 * extrae el mensaje para enviarlo al cliente WS de forma limpia.
 * Si es otro tipo de error, lanza un "Internal server error" genérico
 * a menos que ya sea una WsException.
 * 
 * @param error - El error capturado en el try/catch del Gateway
 */
export function handleWsException(error: any): never {
    // 1. Si ya es WsException, relanzar
    if (error instanceof WsException) {
        throw error;
    }

    // 2. Si es HttpException (Forbidden, NotFound, BadRequest, etc.)
    if (error instanceof HttpException) {
        throw new WsException(error.message);
    }

    // También chequeamos por propiedad status si no fuera instancia directa (raro en Nest puro pero posible)
    if (error?.status && typeof error.status === 'number' && error.message) {
        throw new WsException(error.message);
    }

    // 3. Log y error genérico para lo demás
    console.error('WS Internal Error:', error);
    throw new WsException('Internal server error');
}
