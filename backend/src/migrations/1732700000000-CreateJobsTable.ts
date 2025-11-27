import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateJobsTable1732700000000 implements MigrationInterface {
  name = 'CreateJobsTable1732700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "job_status_enum" AS ENUM ('pending', 'processing', 'completed', 'failed')
    `);

    await queryRunner.query(`
      CREATE TYPE "pdf_type_enum" AS ENUM ('weekly', 'test')
    `);

    // Create jobs table
    await queryRunner.createTable(
      new Table({
        name: 'jobs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'status',
            type: 'job_status_enum',
            default: "'pending'",
          },
          {
            name: 'pdfType',
            type: 'pdf_type_enum',
          },
          {
            name: 's3Key',
            type: 'varchar',
          },
          {
            name: 'result',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
      }),
      true,
    );

    // Enable uuid-ossp extension for uuid_generate_v4()
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('jobs');
    await queryRunner.query(`DROP TYPE "job_status_enum"`);
    await queryRunner.query(`DROP TYPE "pdf_type_enum"`);
  }
}
