export enum PdfType {
    LECTURE = 'lecture',
    TEST = 'test',
    EXAM = 'exam',
}

export interface ParsedEvent {
    id: string;
    module: string;
    activity: string;
    group?: string;
    day?: string;
    date?: string;
    startTime: string;
    endTime: string;
    venue: string;
    semester?: string;
    isRecurring: boolean;
}

export enum JobStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed',
}
