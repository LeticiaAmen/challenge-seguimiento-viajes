import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Trip, TripSchema } from './schemas/trip.schema';
import { TripsRepository } from './repositories/trips.repository';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';

import { TripsGateway } from './trips.gateway';

import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Trip.name, schema: TripSchema }]),
        AuthModule, // Necesario para FirebaseTokenService
        UsersModule, // Necesario para UsersService
    ],
    controllers: [TripsController],
    providers: [TripsRepository, TripsService, TripsGateway],
    exports: [MongooseModule, TripsRepository, TripsService],
})
export class TripsModule { }
