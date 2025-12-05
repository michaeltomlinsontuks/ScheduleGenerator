import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity.js';

export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

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

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status!: JobStatus;

  @Column({
    type: 'enum',
    enum: PdfType,
  })
  pdfType!: PdfType;

  @Column()
  s3Key!: string;

  @Column({ type: 'jsonb', nullable: true })
  result!: ParsedEvent[] | null;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'bigint', default: 0 })
  fileSizeBytes!: number;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @ManyToOne(() => User, (user) => user.jobs, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user!: User | null;
}
