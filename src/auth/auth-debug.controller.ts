import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { RequestUser } from '../common/interfaces/request-user.interface';

/**
 * Controlador de Debug para probar RolesGuard.
 * ESTE CONTROLADOR ES TEMPORAL Y SOLO PARA PRUEBAS (T11).
 */
@Controller()
export class AuthDebugController {

    @Get('only-driver')
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles('driver')
    onlyDriver(@Req() req: Request & { user: RequestUser }) {
        return {
            ok: true,
            endpoint: 'only-driver',
            message: 'Access granted to DRIVER',
            user: req.user,
        };
    }

    @Get('only-passenger')
    @UseGuards(FirebaseAuthGuard, RolesGuard)
    @Roles('passenger')
    onlyPassenger(@Req() req: Request & { user: RequestUser }) {
        return {
            ok: true,
            endpoint: 'only-passenger',
            message: 'Access granted to PASSENGER',
            user: req.user,
        };
    }
}
