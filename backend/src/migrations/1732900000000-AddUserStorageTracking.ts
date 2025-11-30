import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from 'typeorm';

export class AddUserStorageTracking1732900000000 implements MigrationInterface {
  name = 'AddUserStorageTracking1732900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create users table
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'firstName',
            type: 'varchar',
          },
          {
            name: 'lastName',
            type: 'varchar',
          },
          {
            name: 'picture',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'storageUsedBytes',
            type: 'bigint',
            default: 0,
          },
          {
            name: 'storageQuotaBytes',
            type: 'bigint',
            default: 52428800, // 50MB in bytes
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
        ],
      }),
      true,
    );

    // Add userId and fileSizeBytes columns to jobs table
    await queryRunner.addColumn(
      'jobs',
      new TableColumn({
        name: 'userId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'jobs',
      new TableColumn({
        name: 'fileSizeBytes',
        type: 'bigint',
        default: 0,
      }),
    );

    // Add foreign key constraint
    await queryRunner.createForeignKey(
      'jobs',
      new TableForeignKey({
        columnNames: ['userId'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      }),
    );

    // Create index on userId for faster queries
    await queryRunner.query(`CREATE INDEX "IDX_jobs_userId" ON "jobs" ("userId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key
    const table = await queryRunner.getTable('jobs');
    const foreignKey = table?.foreignKeys.find(
      (fk) => fk.columnNames.indexOf('userId') !== -1,
    );
    if (foreignKey) {
      await queryRunner.dropForeignKey('jobs', foreignKey);
    }

    // Drop index
    await queryRunner.query(`DROP INDEX "IDX_jobs_userId"`);

    // Drop columns from jobs table
    await queryRunner.dropColumn('jobs', 'userId');
    await queryRunner.dropColumn('jobs', 'fileSizeBytes');

    // Drop users table
    await queryRunner.dropTable('users');
  }
}
