import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    // Connecting eagerly (rather than relying on Prisma's lazy first-query
    // connect) gives a fast, clear diagnostic when Postgres is misconfigured.
    // But nothing outside this service should go down just because Postgres
    // is unreachable — no domain model queries it yet (Phase 1/2), and
    // unrelated features (search, health) don't depend on it. So we log
    // loudly instead of throwing; Prisma will still retry lazily on the
    // first real query once a caller actually needs the database.
    try {
      await this.$connect();
      this.logger.log('Connected to Postgres via Prisma');
    } catch (error) {
      this.logger.error(
        `Could not connect to Postgres at boot — continuing without it. Any code path that queries the database will fail until this is fixed. ${(error as Error).message}`,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
