import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { GoogleCalendarService } from './calendar.service.js';
import { IcsService } from './ics.service.js';
import { AuthService, SessionUser } from '../auth/auth.service.js';
import {
  CalendarListDto,
  CalendarDto,
  CreateCalendarDto,
} from './dto/calendar-list.dto.js';
import { AddEventsDto } from './dto/add-events.dto.js';
import { GenerateIcsDto } from './dto/generate-ics.dto.js';

interface RequestWithUser extends Request {
  user?: SessionUser;
}

@ApiTags('Calendar')
@Controller('api')
export class CalendarController {
  constructor(
    private readonly calendarService: GoogleCalendarService,
    private readonly icsService: IcsService,
    private readonly authService: AuthService,
  ) {}

  @Get('calendars')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user Google Calendars' })
  @ApiResponse({
    status: 200,
    description: 'List of calendars',
    type: CalendarListDto,
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async listCalendars(@Req() req: RequestWithUser): Promise<CalendarListDto> {
    const accessToken = this.getAccessToken(req);
    const calendars = await this.calendarService.listCalendars(accessToken);
    return { calendars };
  }


  @Post('calendars')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new Google Calendar' })
  @ApiResponse({
    status: 201,
    description: 'Calendar created',
    type: CalendarDto,
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  async createCalendar(
    @Req() req: RequestWithUser,
    @Body() dto: CreateCalendarDto,
  ): Promise<CalendarDto> {
    const accessToken = this.getAccessToken(req);
    return this.calendarService.createCalendar(
      accessToken,
      dto.name,
      dto.description,
    );
  }

  @Post('calendars/events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add events to a Google Calendar' })
  @ApiResponse({ status: 201, description: 'Events added successfully' })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 500, description: 'Google Calendar API error' })
  async addEvents(
    @Req() req: RequestWithUser,
    @Body() dto: AddEventsDto,
  ): Promise<{ message: string; count: number }> {
    const accessToken = this.getAccessToken(req);
    await this.calendarService.addEvents(
      accessToken,
      dto.calendarId,
      dto.events,
      dto.semesterStart,
      dto.semesterEnd,
    );
    return {
      message: 'Events added successfully',
      count: dto.events.length,
    };
  }

  @Post('generate/ics')
  @ApiOperation({ summary: 'Generate ICS file from events' })
  @ApiResponse({
    status: 200,
    description: 'ICS file content',
    content: {
      'text/calendar': {
        schema: { type: 'string' },
      },
    },
  })
  async generateIcs(
    @Body() dto: GenerateIcsDto,
    @Res() res: Response,
  ): Promise<void> {
    const icsContent = this.icsService.generateIcs(
      dto.events,
      dto.semesterStart,
      dto.semesterEnd,
    );

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="schedule.ics"',
    );
    res.send(icsContent);
  }

  /**
   * Gets the access token from the request session
   * @throws HttpException if not authenticated
   */
  private getAccessToken(req: RequestWithUser): string {
    const accessToken = this.authService.getAccessToken(req.user);
    if (!accessToken) {
      throw new HttpException(
        {
          statusCode: HttpStatus.UNAUTHORIZED,
          message: 'Not authenticated. Please login with Google first.',
          error: 'GOOGLE_AUTH_REQUIRED',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
    return accessToken;
  }
}
