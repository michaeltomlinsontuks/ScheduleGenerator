import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CalendarController } from './calendar.controller.js';
import { GoogleCalendarService } from './calendar.service.js';
import { IcsService } from './ics.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [CalendarController],
  providers: [GoogleCalendarService, IcsService],
  exports: [GoogleCalendarService, IcsService],
})
export class CalendarModule {}
