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
import { ConfigService } from '@nestjs/config';
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
    private readonly configService: ConfigService,
  ) { }

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
  @ApiOperation({
    summary: 'Add events to a Google Calendar',
    description:
      'Add parsed schedule events to a Google Calendar. ' +
      'For lecture mode (recurring events), semesterStart and semesterEnd are required. ' +
      'For test and exam modes (non-recurring events), semester dates are optional.',
  })
  @ApiResponse({
    status: 201,
    description: 'Events added successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Events added successfully' },
        count: { type: 'number', example: 15 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (missing semester dates for lecture mode)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Semester start and end dates are required for recurring events (lecture mode)',
        },
        error: { type: 'string', example: 'MISSING_SEMESTER_DATES' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Not authenticated' })
  @ApiResponse({ status: 500, description: 'Google Calendar API error' })
  async addEvents(
    @Req() req: RequestWithUser,
    @Body() dto: AddEventsDto,
  ): Promise<{ message: string; count: number }> {
    // Determine semester dates if not provided
    let semesterStart = dto.semesterStart;
    let semesterEnd = dto.semesterEnd;
    let semester = '';

    const hasRecurringEvents = dto.events.some(event => event.isRecurring);

    if (hasRecurringEvents && (!semesterStart || !semesterEnd)) {
      const semesterInfo = this.getCurrentSemesterInfo();
      if (semesterInfo) {
        semesterStart = semesterStart || semesterInfo.start;
        semesterEnd = semesterEnd || semesterInfo.end;
        semester = semesterInfo.name;
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Semester start and end dates are required for recurring events and could not be determined automatically.',
            error: 'MISSING_SEMESTER_DATES',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Filter events based on semester if detected
    let eventsToProcess = dto.events;
    if (semester) {
      eventsToProcess = dto.events.filter(event => {
        if (!event.semester) return true; // Keep events with no semester info
        // Keep Year modules ('Y') or matching semester
        return event.semester === 'Y' || event.semester === semester;
      });
    }

    const accessToken = this.getAccessToken(req);
    await this.calendarService.addEvents(
      accessToken,
      dto.calendarId,
      eventsToProcess,
      semesterStart,
      semesterEnd,
    );
    return {
      message: 'Events added successfully',
      count: dto.events.length,
    };
  }

  @Post('generate/ics')
  @ApiOperation({
    summary: 'Generate ICS file from events',
    description:
      'Generate an ICS (iCalendar) file from parsed schedule events. ' +
      'For lecture mode (recurring events), semesterStart and semesterEnd are required. ' +
      'For test and exam modes (non-recurring events), semester dates are optional. ' +
      'The generated file can be imported into any calendar application.',
  })
  @ApiResponse({
    status: 200,
    description: 'ICS file content',
    content: {
      'text/calendar': {
        schema: { type: 'string' },
        example:
          'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//UP Schedule Generator//EN\n...',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (missing semester dates for lecture mode)',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example:
            'Semester start and end dates are required for recurring events (lecture mode)',
        },
        error: { type: 'string', example: 'MISSING_SEMESTER_DATES' },
      },
    },
  })
  async generateIcs(
    @Body() dto: GenerateIcsDto,
    @Res() res: Response,
  ): Promise<void> {
    // Determine semester dates if not provided
    let semesterStart = dto.semesterStart;
    let semesterEnd = dto.semesterEnd;
    let semester = '';

    const hasRecurringEvents = dto.events.some(event => event.isRecurring);

    if (hasRecurringEvents && (!semesterStart || !semesterEnd)) {
      const semesterInfo = this.getCurrentSemesterInfo();
      if (semesterInfo) {
        semesterStart = semesterStart || semesterInfo.start;
        semesterEnd = semesterEnd || semesterInfo.end;
        semester = semesterInfo.name;
      } else {
        throw new HttpException(
          {
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Semester start and end dates are required for recurring events and could not be determined automatically.',
            error: 'MISSING_SEMESTER_DATES',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    // Filter events based on semester if detected
    let eventsToProcess = dto.events;
    if (semester) {
      eventsToProcess = dto.events.filter(event => {
        if (!event.semester) return true; // Keep events with no semester info
        // Keep Year modules ('Y') or matching semester (e.g. 'S1' matches 'S1')
        return event.semester === 'Y' || event.semester === semester;
      });
    }

    const icsContent = this.icsService.generateIcs(
      eventsToProcess,
      semesterStart,
      semesterEnd,
    );

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="schedule.ics"',
    );
    res.send(icsContent);
  }

  /**
   * Determine current semester based on today's date and env vars
   */
  private getCurrentSemesterInfo(): { name: string; start: string; end: string } | null {
    const now = new Date();
    const s1Start = this.configService.get<string>('FIRST_SEMESTER_START');
    const s1End = this.configService.get<string>('FIRST_SEMESTER_END');
    const s2Start = this.configService.get<string>('SECOND_SEMESTER_START');
    const s2End = this.configService.get<string>('SECOND_SEMESTER_END');

    if (!s1Start || !s1End || !s2Start || !s2End) {
      return null;
    }

    const dS1Start = new Date(s1Start);
    const dS1End = new Date(s1End);
    const dS2Start = new Date(s2Start);
    const dS2End = new Date(s2End);

    // 1. If we are currently IN a semester, return it
    if (now >= dS1Start && now <= dS1End) {
      return { name: 'S1', start: s1Start, end: s1End };
    }
    if (now >= dS2Start && now <= dS2End) {
      return { name: 'S2', start: s2Start, end: s2End };
    }

    // 2. If we are in a break, return the NEXT semester

    // Before S1 starts -> S1 is next
    if (now < dS1Start) {
      return { name: 'S1', start: s1Start, end: s1End };
    }

    // Between S1 end and S2 start -> S2 is next
    if (now > dS1End && now < dS2Start) {
      return { name: 'S2', start: s2Start, end: s2End };
    }

    // We return 'S1' so filtering works. 
    // Note: The dates will be the configured dates (current year). 
    // Ideally, env vars should be updated for the new year, or we logic to add 1 year. 
    // For safety/simplicity, we return the configured dates.
    if (now > dS2End) {
      return { name: 'S1', start: s1Start, end: s1End };
    }

    return null;
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
