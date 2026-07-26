import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AdminService } from './admin.service';
import { LoginDto } from './dto/login.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  @HttpCode(200)
  async login(
    @Req() req: Request,
    @Body() dto: LoginDto,
  ): Promise<{ success: true }> {
    await this.adminService.login(
      req.session,
      dto.password,
      req.ip ?? 'unknown',
    );
    return { success: true };
  }
}
