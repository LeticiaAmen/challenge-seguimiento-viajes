import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-firebase-jwt';
import { ConfigService } from '@nestjs/config';
import { JwksClient } from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { UsersService } from '../../users/users.service';
import { RequestUser } from '../../common/interfaces/request-user.interface';
/**
 * Estrategia de autenticación que valida tokens JWT emitidos por Firebase.
 * Se utiliza para proteger endpoints de la API, verificando la validez del token
 * y vinculando la identidad de Firebase con el servicio de usuarios interno.
 */

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase-jwt') {
    private jwksClient: JwksClient;

    constructor(
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
    ) {
        const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
        if (!projectId) {
            throw new Error('FIREBASE_PROJECT_ID not configured');
        }

        const jwksUri =
            'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com';

        const client = new JwksClient({
            jwksUri,
            cache: true,
            rateLimit: true,
            cacheMaxEntries: 5,
            cacheMaxAge: 600000, // 10 minutes
        });

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            issuer: `https://securetoken.google.com/${projectId}`,
            audience: projectId,
            algorithms: ['RS256'],
            secretOrKeyProvider: (
                _request: any,
                rawJwtToken: string,
                done: (err: Error | null, key?: string) => void,
            ) => {
                // Decode token header to get kid
                const decodedToken = jwt.decode(rawJwtToken, { complete: true });
                if (!decodedToken || typeof decodedToken === 'string') {
                    return done(new UnauthorizedException('Invalid token format'));
                }

                const kid = decodedToken.header.kid;
                if (!kid) {
                    return done(new UnauthorizedException('Token missing kid'));
                }

                // Get signing key from JWKS
                client.getSigningKey(kid, (err, key) => {
                    if (err) {
                        return done(new UnauthorizedException('Unable to get signing key'));
                    }
                    const publicKey = key?.getPublicKey();
                    if (!publicKey) {
                        return done(new UnauthorizedException('Public key not found'));
                    }
                    done(null, publicKey);
                });
            },
        });

        this.jwksClient = client;
    }

    /**
     * Valida el token JWT emitido por Firebase.
     * 
     * @param payload - El payload del token JWT.
     * @returns Un objeto RequestUser con la información del usuario.
     */
    async validate(payload: any): Promise<RequestUser> {
        // En algunos casos (dependiendo de la librería/config), el payload puede llegar como string.
        // Aseguramos que sea un objeto decodificado.
        if (typeof payload === 'string') {
            const decoded = jwt.decode(payload);
            if (typeof decoded === 'object' && decoded !== null) {
                payload = decoded;
            }
        }

        const firebaseUid = payload.sub ?? payload.user_id;
        const email = payload.email;

        if (!firebaseUid || !email) {
            throw new UnauthorizedException('Invalid Firebase token: missing sub or email');
        }

        //Buscar o Crear usuario en Mongo
        try {
            const mongoUser = await this.usersService.findOrCreateUser(firebaseUid, email);

            // Retornar objeto compatible con RequestUser
            return {
                _id: mongoUser._id,
                firebaseUid: mongoUser.firebaseUid,
                email: mongoUser.email,
                roles: mongoUser.roles,
            };
        } catch (error) {
            console.error('Error syncing user:', error);
            throw new UnauthorizedException('Error syncing user with database');
        }
    }
}
