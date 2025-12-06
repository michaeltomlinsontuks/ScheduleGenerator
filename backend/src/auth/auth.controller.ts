import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpStatus,
  Body,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOAuth2,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthService, SessionUser } from './auth.service.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import { IpBlockingGuard } from './guards/ip-blocking.guard.js';
import {
  AuthStatusDto,
  LogoutResponseDto,
} from './dto/auth-response.dto.js';
import {
  UnblockIpDto,
  UnblockResponseDto,
  IpStatusDto,
} from './dto/ip-blocking.dto.js';
import { IpBlockingService } from './ip-blocking.service.js';

interface AuthRequest {
  user?: SessionUser;
  logout: (callback: (err?: Error) => void) => void;
  session: {
    destroy: (callback: (err?: Error) => void) => void;
    returnUrl?: string;
  };
}

interface AuthResponse {
  redirect: (url: string) => void;
  status: (code: number) => { json: (body: object) => void };
  clearCookie: (name: string) => void;
}

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
    private readonly ipBlockingService: IpBlockingService,
  ) { }

  @Get('google')
  @UseGuards(IpBlockingGuard, GoogleAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth',
    description: 'Redirects to Google OAuth consent screen with calendar scopes',
  })
  @ApiQuery({
    name: 'returnUrl',
    description: 'URL to redirect back to after successful authentication',
    required: false,
  })
  @ApiOAuth2(['https://www.googleapis.com/auth/calendar'])
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen',
  })
  @ApiResponse({
    status: 403,
    description: 'IP address is blocked due to too many failed attempts',
  })
  async googleAuth(): Promise<void> {
    // Guard handles the redirect to Google with returnUrl in state parameter
  }

  @Get('google/callback')
  @UseGuards(IpBlockingGuard, GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Handles the OAuth callback from Google and establishes session',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to frontend after successful authentication',
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication failed',
  })
  @ApiResponse({
    status: 403,
    description: 'IP address is blocked due to too many failed attempts',
  })
  async googleCallback(
    @Query('state') state: string | undefined,
    @Req() _req: AuthRequest,
    @Res() res: AuthResponse,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontend.url');

    // Parse the return URL from the OAuth state parameter
    let returnUrl = '/generate'; // Default fallback
    if (state) {
      try {
        const stateData = JSON.parse(state);
        if (stateData.returnUrl) {
          returnUrl = stateData.returnUrl;
        }
      } catch {
        // Invalid state, use default
      }
    }

    // Redirect to frontend at the return URL
    res.redirect(`${frontendUrl}${returnUrl}`);
  }

  @Get('status')
  @ApiOperation({
    summary: 'Check authentication status',
    description: 'Returns whether the user has valid Google credentials',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication status',
    type: AuthStatusDto,
  })
  getAuthStatus(@Req() req: AuthRequest): AuthStatusDto {
    return this.authService.getAuthStatus(req.user);
  }

  @Post('logout')
  @ApiOperation({
    summary: 'Logout user',
    description: 'Clears the user session and tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    type: LogoutResponseDto,
  })
  async logout(
    @Req() req: AuthRequest,
    @Res() res: AuthResponse,
  ): Promise<void> {
    req.logout((err) => {
      if (err) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          message: 'Failed to logout',
        });
        return;
      }

      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            message: 'Failed to destroy session',
          });
          return;
        }

        res.clearCookie('connect.sid');
        res.status(HttpStatus.OK).json({
          message: 'Successfully logged out',
        });
      });
    });
  }

  @Get('ip/status')
  @ApiOperation({
    summary: 'Check IP blocking status',
    description: 'Returns the blocking status and failed attempt count for an IP address',
  })
  @ApiQuery({
    name: 'ip',
    description: 'IP address to check (optional, defaults to request IP)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'IP status information',
    type: IpStatusDto,
  })
  async getIpStatus(
    @Query('ip') ip: string | undefined,
    @Req() req: AuthRequest,
  ): Promise<IpStatusDto> {
    // Use provided IP or extract from request
    const targetIp = ip || this.getClientIp(req as any);

    const blockInfo = await this.ipBlockingService.getBlockInfo(targetIp);

    if (blockInfo) {
      const timeRemaining = await this.ipBlockingService.getTimeUntilUnblock(targetIp);
      return {
        blocked: true,
        blockInfo: {
          ...blockInfo,
          timeRemaining,
        },
      };
    }

    const failedAttempts = await this.ipBlockingService.getFailedAttempts(targetIp);
    return {
      blocked: false,
      failedAttempts,
    };
  }

  @Post('ip/unblock')
  @ApiOperation({
    summary: 'Unblock an IP address',
    description: 'Manually unblock an IP address that was blocked due to failed authentication attempts',
  })
  @ApiResponse({
    status: 200,
    description: 'IP address successfully unblocked',
    type: UnblockResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'IP address is not blocked',
  })
  async unblockIp(@Body() unblockDto: UnblockIpDto): Promise<UnblockResponseDto> {
    const wasBlocked = await this.ipBlockingService.unblockIP(unblockDto.ip);

    if (!wasBlocked) {
      throw new NotFoundException({
        statusCode: 404,
        message: 'IP_NOT_BLOCKED',
        error: `IP address ${unblockDto.ip} is not currently blocked`,
      });
    }

    return {
      message: 'IP address successfully unblocked',
      ip: unblockDto.ip,
    };
  }

  /**
   * Extracts the client IP address from the request
   * Handles proxied requests by checking X-Forwarded-For header
   */
  private getClientIp(request: any): string {
    // Check X-Forwarded-For header (for proxied requests)
    const forwardedFor = request.headers['x-forwarded-for'];
    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
      return ips.split(',')[0].trim();
    }

    // Fall back to direct connection IP
    return request.ip || request.socket?.remoteAddress || 'unknown';
  }
}
