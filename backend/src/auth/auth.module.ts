import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { seconds, ThrottlerModule } from '@nestjs/throttler';
import { PermisosModule } from '../permisos/permisos.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

export const INTENTOS_DE_LOGIN = 5;
export const VENTANA_DE_LOGIN_EN_SEGUNDOS = 60;

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    PermisosModule,
    ThrottlerModule.forRoot([
      {
        name: 'login',
        ttl: seconds(VENTANA_DE_LOGIN_EN_SEGUNDOS),
        limit: INTENTOS_DE_LOGIN,
      },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.getOrThrow<number>('JWT_EXPIRES_IN_SECONDS'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
