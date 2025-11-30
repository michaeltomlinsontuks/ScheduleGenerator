# Storage Quota Implementation Summary

## Overview

Implemented per-user storage quota tracking to enforce a 50MB storage limit per authenticated user, as specified in Requirement 11.4 of the production readiness specification.

## Changes Made

### 1. Database Schema

#### New User Entity (`backend/src/auth/entities/user.entity.ts`)
- Created `User` entity to track user information and storage usage
- Fields:
  - `id`: UUID primary key
  - `email`: Unique email address
  - `firstName`, `lastName`, `picture`: User profile information
  - `storageUsedBytes`: Current storage usage (bigint, default 0)
  - `storageQuotaBytes`: Storage quota limit (bigint, default 52428800 = 50MB)
  - `createdAt`, `updatedAt`: Timestamps
  - `jobs`: One-to-many relationship with Job entity

#### Updated Job Entity (`backend/src/jobs/entities/job.entity.ts`)
- Added `fileSizeBytes`: Tracks the size of the uploaded PDF file
- Added `userId`: Foreign key to User entity (nullable for unauthenticated uploads)
- Added `user`: Many-to-one relationship with User entity

#### Migration (`backend/src/migrations/1732900000000-AddUserStorageTracking.ts`)
- Creates `users` table with storage tracking fields
- Adds `userId` and `fileSizeBytes` columns to `jobs` table
- Creates foreign key constraint from jobs to users
- Creates index on `userId` for faster queries

### 2. Authentication Service Updates

#### AuthService (`backend/src/auth/auth.service.ts`)
- Updated `validateGoogleUser` to create or update users in database
- Now returns `SessionUser` with database user ID
- Automatically creates new users with default 50MB quota on first login
- Updates user profile information on subsequent logins

#### GoogleStrategy (`backend/src/auth/strategies/google.strategy.ts`)
- Updated to call `AuthService.validateGoogleUser` during OAuth flow
- Ensures user is created/updated in database before session is established

#### AuthModule (`backend/src/auth/auth.module.ts`)
- Added TypeORM import for User entity

### 3. Upload Service Updates

#### UploadService (`backend/src/upload/upload.service.ts`)
- **Quota Check**: Added pre-upload quota validation
  - Checks if user's current usage + file size would exceed quota
  - Throws `StorageQuotaExceededException` if quota would be exceeded
  - Only applies to authenticated users (unauthenticated uploads bypass quota)
  
- **Storage Tracking**: Updates user storage usage after successful upload
  - Increments `storageUsedBytes` by file size
  - Associates job with user ID
  
- **New Methods**:
  - `releaseStorageForJob(jobId)`: Decrements user storage when job is deleted
  - `getStorageUsage(userId)`: Returns current storage usage statistics

#### UploadController (`backend/src/upload/upload.controller.ts`)
- Updated to extract user ID from session
- Passes user ID to `processUpload` method
- Added API documentation for 413 (Quota Exceeded) response

#### UploadModule (`backend/src/upload/upload.module.ts`)
- Added TypeORM import for User entity

### 4. Exception Handling

#### StorageQuotaExceededException (`backend/src/upload/exceptions/storage-quota-exceeded.exception.ts`)
- Custom exception for quota violations
- Returns HTTP 413 (Payload Too Large)
- Provides detailed error information:
  - Current usage
  - Quota limit
  - File size
  - Amount by which quota would be exceeded

#### StorageQuotaExceededDto (`backend/src/upload/dto/storage-quota-exceeded.dto.ts`)
- DTO for quota exceeded error responses
- Includes all relevant quota information

### 5. Data Source Updates

- Updated `backend/src/data-source.ts` to include User entity
- Updated `backend/src/data-source-cli.ts` to include User entity for migrations

### 6. Tests

#### UploadService Tests (`backend/src/upload/upload.service.spec.ts`)
- Added comprehensive tests for storage quota functionality:
  - ✅ Rejects upload when user quota is exceeded
  - ✅ Allows upload when user has sufficient quota
  - ✅ Allows upload for unauthenticated users (no quota check)
  - ✅ Returns correct storage usage for a user
  - ✅ Returns null for non-existent user

## Behavior

### For Authenticated Users
1. User logs in via Google OAuth
2. User record is created/updated in database with 50MB default quota
3. When uploading a PDF:
   - System checks if `currentUsage + fileSize > quota`
   - If yes: Returns 413 error with quota details
   - If no: Proceeds with upload and increments storage usage

### For Unauthenticated Users
- No quota check is performed
- Uploads are allowed without storage tracking
- Jobs are created with `userId = null`

### Storage Usage Tracking
- Storage is incremented immediately after job creation
- Storage can be released by calling `releaseStorageForJob(jobId)`
- Storage usage can be queried via `getStorageUsage(userId)`

## API Changes

### Upload Endpoint
**POST /api/upload**

New Response Status:
- **413 Payload Too Large**: Storage quota exceeded

Response Body (413):
```json
{
  "statusCode": 413,
  "message": "STORAGE_QUOTA_EXCEEDED",
  "error": "Storage quota exceeded",
  "details": {
    "currentUsage": 48000000,
    "quota": 52428800,
    "fileSize": 5000000,
    "wouldExceedBy": 571200
  }
}
```

## Configuration

### Default Quota
- Default quota: 50MB (52,428,800 bytes)
- Configured in User entity default value
- Can be adjusted per user by updating `storageQuotaBytes` field

### Quota Enforcement
- Enforced only for authenticated users
- Checked before PDF validation and storage
- Prevents unnecessary processing of files that would exceed quota

## Database Migration

To apply the migration:

```bash
cd backend
npm run migration:run
```

To revert the migration:

```bash
cd backend
npm run migration:revert
```

## Future Enhancements

1. **Admin Interface**: Add endpoints to view and adjust user quotas
2. **Quota Cleanup**: Implement automatic cleanup of old files to free up quota
3. **Quota Notifications**: Notify users when approaching quota limit
4. **Tiered Quotas**: Support different quota levels for different user types
5. **Storage Analytics**: Track storage usage patterns and trends

## Requirements Validation

✅ **Requirement 11.4**: WHEN users store files THEN the System SHALL enforce a 50MB storage quota per user

- Storage quota is tracked per user in the database
- Quota check is performed before accepting uploads
- Clear error message is returned when quota is exceeded
- Default quota is set to 50MB (52,428,800 bytes)
- Unauthenticated users can still upload (no quota applied)

## Testing

All tests pass successfully:
- 3 existing property-based tests for valid uploads
- 5 new unit tests for storage quota functionality
- Total: 8 tests passing

Run tests:
```bash
cd backend
npm test -- upload.service.spec.ts
```
