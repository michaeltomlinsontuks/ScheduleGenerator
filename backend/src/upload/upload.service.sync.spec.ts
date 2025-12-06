import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { Job, JobStatus, PdfType, ParsedEvent } from '../jobs/entities/job.entity';
import { User } from '../auth/entities/user.entity';
import { ParserService } from '../parser/parser.service';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MulterFile } from '../common/pipes/file-validation.pipe';
import { Logger } from '@nestjs/common';
import * as validator from '../common/validators/pdf-content.validator';

jest.mock('../common/validators/pdf-content.validator');

describe('UploadService (Sync)', () => {
    let service: UploadService;
    let jobRepository: jest.Mocked<Repository<Job>>;
    let userRepository: jest.Mocked<Repository<User>>;
    let parserService: jest.Mocked<ParserService>;
    let configService: jest.Mocked<ConfigService>;

    const mockDate = new Date('2025-02-15T12:00:00Z'); // Mid-February (Assume S1 start)

    beforeEach(async () => {
        jest.useFakeTimers();
        jest.setSystemTime(mockDate);

        const mockJobRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
        };

        const mockUserRepository = {
            findOne: jest.fn(),
            increment: jest.fn(),
            decrement: jest.fn(),
        };

        const mockParserService = {
            parsePdf: jest.fn(),
        };

        const mockConfigService = {
            get: jest.fn((key: string) => {
                switch (key) {
                    case 'FIRST_SEMESTER_START': return '2025-02-01';
                    case 'FIRST_SEMESTER_END': return '2025-06-30';
                    case 'SECOND_SEMESTER_START': return '2025-07-20';
                    case 'SECOND_SEMESTER_END': return '2025-11-15';
                    default: return null;
                }
            }),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UploadService,
                { provide: getRepositoryToken(Job), useValue: mockJobRepository },
                { provide: getRepositoryToken(User), useValue: mockUserRepository },
                { provide: ParserService, useValue: mockParserService },
                { provide: ConfigService, useValue: mockConfigService },
            ],
        }).compile();

        service = module.get<UploadService>(UploadService);
        jobRepository = module.get(getRepositoryToken(Job)) as any;
        userRepository = module.get(getRepositoryToken(User)) as any;
        parserService = module.get(ParserService) as any;
        configService = module.get(ConfigService) as any;

        // Default mocks
        jest.spyOn(validator, 'validatePdfContent').mockResolvedValue(PdfType.LECTURE);
        jobRepository.create.mockImplementation((dto) => ({ id: 'job-123', ...dto } as Job));
        jobRepository.save.mockImplementation((job) => Promise.resolve(job as Job));
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    const createMockFile = (): MulterFile => ({
        fieldname: 'file',
        originalname: 'test.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('mock-pdf-content'),
    });

    const createMockEvent = (semester: string): ParsedEvent => ({
        id: 'evt-1',
        module: 'COS 123',
        semester,
        activity: 'Lecture',
        group: 'A',
        day: 'Monday',
        date: '',
        startTime: '08:00',
        endTime: '09:00',
        venue: 'IT 2-27',
        isRecurring: true,
    });

    it('should return S1 events when current date is in S1 and S1 events are parsed (Standard Case)', async () => {
        const s1Events = [createMockEvent('S1'), createMockEvent('Y')];
        parserService.parsePdf.mockResolvedValue(s1Events);

        const result = await service.processUpload(createMockFile());

        expect(result.events).toHaveLength(2);
        expect(result.events[0].semester).toBe('S1');
        // Should return S1 semester dates
        expect(result.semesterDates).toEqual({
            semester: 'S1',
            startDate: '2025-02-01',
            endDate: '2025-06-30',
        });
    });

    it('should return S2 events and S2 dates when current date is in S1, if ONLY S2 events are found (The Fix)', async () => {
        // Current date is Feb (S1). Upload contains ONLY S2 events.
        // OLD Behavior: Filter would remove S2 events because they don't match 'S1', returning empty.
        // NEW Behavior: Should detect empty result, return original events, AND return S2 dates.
        const s2Events = [createMockEvent('S2')];
        parserService.parsePdf.mockResolvedValue(s2Events);

        const result = await service.processUpload(createMockFile());

        expect(result.events).toHaveLength(1);
        expect(result.events[0].semester).toBe('S2');
        // Should return S2 semester dates since the events are S2
        expect(result.semesterDates).toEqual({
            semester: 'S2',
            startDate: '2025-07-20',
            endDate: '2025-11-15',
        });
    });

    it('should still filter out S2 events when mixed with S1 events during S1', async () => {
        // If the file covers the WHOLE year, we likely only want what's relevant NOW.
        const mixedEvents = [createMockEvent('S1'), createMockEvent('S2')];
        parserService.parsePdf.mockResolvedValue(mixedEvents);

        const result = await service.processUpload(createMockFile());

        expect(result.events).toHaveLength(1);
        expect(result.events[0].semester).toBe('S1');
        // Should return S1 semester dates
        expect(result.semesterDates).toEqual({
            semester: 'S1',
            startDate: '2025-02-01',
            endDate: '2025-06-30',
        });
    });
});
