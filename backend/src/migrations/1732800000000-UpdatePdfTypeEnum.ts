import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePdfTypeEnum1732800000000 implements MigrationInterface {
  name = 'UpdatePdfTypeEnum1732800000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // PostgreSQL requires enum values to be added outside of a transaction
    // We need to commit the transaction, add the enum values, then start a new transaction
    
    // Step 1: Commit current transaction
    await queryRunner.commitTransaction();
    
    // Step 2: Add 'lecture' and 'exam' values to the enum (outside transaction)
    await queryRunner.query(`
      ALTER TYPE "jobs_pdftype_enum" ADD VALUE IF NOT EXISTS 'lecture'
    `);
    
    await queryRunner.query(`
      ALTER TYPE "jobs_pdftype_enum" ADD VALUE IF NOT EXISTS 'exam'
    `);
    
    // Step 3: Start a new transaction for the data update
    await queryRunner.startTransaction();
    
    // Step 4: Update existing 'weekly' records to 'lecture'
    await queryRunner.query(`
      UPDATE jobs 
      SET "pdfType" = 'lecture' 
      WHERE "pdfType" = 'weekly'
    `);

    // Note: We cannot remove 'weekly' from the enum in PostgreSQL
    // The enum will contain: 'weekly', 'test', 'lecture', 'exam'
    // But 'weekly' will no longer be used in the application
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert 'lecture' records back to 'weekly'
    await queryRunner.query(`
      UPDATE jobs 
      SET "pdfType" = 'weekly' 
      WHERE "pdfType" = 'lecture'
    `);

    // Note: PostgreSQL doesn't support removing enum values
    // The 'lecture' and 'exam' values will remain in the enum type
    // but won't be used after rollback
  }
}
