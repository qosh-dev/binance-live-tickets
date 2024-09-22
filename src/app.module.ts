import { Module } from '@nestjs/common';
import { ConfigModule, Envs } from './config/config.module';
import { TicketModule } from './ticket/ticket.module';

@Module({
  imports: [
    ConfigModule,
    TicketModule.forRoot({
      redis: {
        host: Envs.REDIS_HOST,
        port: Envs.REDIS_PORT,
        password: Envs.REDIS_PASSWORD,
      },
      percentageChange: {
        intervals: [2, 4, 6,],
      },
    }),
  ],
})
export class AppModule {}
