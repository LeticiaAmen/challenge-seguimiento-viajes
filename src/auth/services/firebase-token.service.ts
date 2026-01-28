import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as jwksRsa from 'jwks-rsa';

/**
 * Servicio encargado de validar tokens de Firebase ID manualmente.
 * 
 * Útil para contextos donde no se puede usar Passport (como WebSockets)
 * o cuando se necesita validación programática directa.
 */
@Injectable()
export class FirebaseTokenService {
    private client: jwksRsa.JwksClient;

    constructor(private readonly configService: ConfigService) {
        this.client = new jwksRsa.JwksClient({
            jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
        });
    }

    /**
     * Verifica la validez y firma de un Firebase ID Token.
     * 
     * Validaciones:
     * 1. Firma RS256 usando claves públicas de Google.
     * 2. Issuer correcto (https://securetoken.google.com/<projectId>).
     * 3. Audience correcto (<projectId>).
     * 4. Expiración.
     * 
     * @param idToken - El token JWT recibido del cliente.
     * @returns Objeto con uid y email si es válido.
     * @throws UnauthorizedException si el token es inválido o faltan datos.
     */
    async verifyIdToken(idToken: string): Promise<{ firebaseUid: string; email: string }> {
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        if (!projectId) {
            throw new Error('FIREBASE_PROJECT_ID not configured');
        }

        const issuer = `https://securetoken.google.com/${projectId}`;

        // Obtener KID del header sin verificar firma aún
        const decoded = jwt.decode(idToken, { complete: true }) as any;
        if (!decoded || !decoded.header || !decoded.header.kid) {
            throw new UnauthorizedException('Invalid token format');
        }

        const kid = decoded.header.kid;

        try {
            // Obtener clave pública
            const key = await this.client.getSigningKey(kid);
            const signingKey = key.getPublicKey();

            // Verificar firma y claims
            const payload = jwt.verify(idToken, signingKey, {
                algorithms: ['RS256'],
                issuer: issuer,
                audience: projectId,
            }) as jwt.JwtPayload;

            if (!payload.sub || !payload.email) {
                throw new UnauthorizedException('Token missing sub or email claims');
            }

            return {
                firebaseUid: payload.sub,
                email: payload.email,
            };
        } catch (error) {
            console.error('Token verification failed:', error);
            throw new UnauthorizedException('Invalid token');
        }
    }
}
