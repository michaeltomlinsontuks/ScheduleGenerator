import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiOAuth2,
} from '@nestjs/swagger';
import { AuthService, SessionUser } from './auth.service.js';
import { GoogleAuthGuard } from './guards/google-auth.guard.js';
import {
  AuthStatusDto,
  LogoutResponseDto,
} from './dto/auth-response.dto.js';

interface AuthRequest {
  user?: SessionUser;
  logout: (callback: (err?: Error) => void) => void;
  session: { destroy: (callback: (err?: Error) => void) => void };
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
  ) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Initiate Google OAuth',
    description: 'Redirects to Google OAuth consent screen with calendar scopes',
  })
  @ApiOAuth2(['https://www.googleapis.com/auth/calendar'])
  @ApiResponse({
    status: 302,
    description: 'Redirects to Google OAuth consent screen',
  })
  async googleAuth(): Promise<void> {
    // Guard handles the redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
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
  async googleCallback(
    @Req() _req: AuthRequest,
    @Res() res: AuthResponse,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontend.url');
    
    // Redirect to frontend after successful authentication
    res.redirect(`${frontendUrl}/generate`);
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
}
