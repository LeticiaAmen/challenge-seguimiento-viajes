import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { FirebaseStrategy } from './firebase.strategy';

@Module({
    imports: [PassportModule, ConfigModule],
    providers: [FirebaseStrategy],
    exports: [PassportModule],
})
export class AuthModule { }
