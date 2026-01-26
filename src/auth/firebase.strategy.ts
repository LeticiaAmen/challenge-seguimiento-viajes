import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-firebase-jwt';
import * as jwt from 'jsonwebtoken';
import { JwksClient } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseStrategy extends PassportStrategy(Strategy, 'firebase-jwt') {
    private client: JwksClient;

    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        });

        this.client = new JwksClient({
            jwksUri: 'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
        });
    }

    async validate(token: string) {
        const firebaseProjectID = this.configService.get<string>('FIREBASE_PROJECT_ID');
        if (!firebaseProjectID) {
            throw new UnauthorizedException('FIREBASE_PROJECT_ID not configured');
        }

        try {
            const decodedParam = jwt.decode(token, { complete: true });
            if (!decodedParam) {
                throw new Error('Invalid token');
            }

            const { header } = decodedParam as { header: { kid: string } }; // Cast to handle Jwt or null

            const key = await new Promise<string>((resolve, reject) => {
                this.client.getSigningKey(header.kid, (err, key) => {
                    if (err) reject(err);
                    else resolve(key?.getPublicKey() || '');
                });
            });

            const decoded = jwt.verify(token, key, {
                algorithms: ['RS256'],
                audience: firebaseProjectID,
                issuer: `https://securetoken.google.com/${firebaseProjectID}`,
            });

            return decoded;
        } catch (err) {
            console.error('Firebase Token Verification Failed:', err);
            throw new UnauthorizedException();
        }
    }
}
