# IP Blocking Implementation

## Overview

This document describes the IP blocking implementation for the UP Schedule Generator backend. The system automatically blocks IP addresses after 5 failed authentication attempts to protect against brute force attacks.

## Architecture

### Components

1. **IpBlockingService** (`src/auth/ip-blocking.service.ts`)
   - Tracks failed authentication attempts per IP address
   - Automatically blocks IPs after threshold is exceeded
   - Provides manual unblock mechanism
   - Uses Redis cache for storage with TTL

2. **IpBlockingGuard** (`src/auth/guards/ip-blocking.guard.ts`)
   - Checks if incoming requests are from blocked IPs
   - Returns 403 Forbidden for blocked IPs
   - Extracts client IP from X-Forwarded-For header (for proxied requests)

3. **GoogleAuthGuard** (updated)
   - Records failed authentication attempts
   - Clears failed attempts on successful authentication
   - Integrates with IpBlockingService

## Configuration

### Constants (IpBlockingService)

```typescript
MAX_FAILED_ATTEMPTS = 5        // Block after 5 failed attempts
BLOCK_DURATION_MS = 3600000    // Block for 1 hour (3600000ms)
ATTEMPT_WINDOW_MS = 900000     // Track attempts within 15 minutes (900000ms)
```

### Redis Keys

- `auth:failed:{ip}` - Failed attempt counter (TTL: 15 minutes)
- `auth:blocked:{ip}` - Block information (TTL: 1 hour)

## Usage

### Automatic Blocking

The system automatically tracks failed authentication attempts:

1. User attempts to authenticate via Google OAuth
2. If authentication fails, the attempt is recorded
3. After 5 failed attempts within 15 minutes, the IP is blocked for 1 hour
4. Blocked IPs receive a 403 Forbidden response with retry information

### Manual Unblocking

Administrators can manually unblock IPs using the API:

```bash
# Check IP status
curl http://localhost:3001/api/auth/ip/status?ip=192.168.1.100

# Unblock an IP
curl -X POST http://localhost:3001/api/auth/ip/unblock \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.100"}'
```

## API Endpoints

### GET /api/auth/ip/status

Check the blocking status of an IP address.

**Query Parameters:**
- `ip` (optional) - IP address to check. Defaults to request IP.

**Response:**
```json
{
  "blocked": false,
  "failedAttempts": 2
}
```

Or if blocked:
```json
{
  "blocked": true,
  "blockInfo": {
    "ip": "192.168.1.100",
    "attempts": 5,
    "blockedAt": 1701360000000,
    "reason": "Exceeded 5 failed authentication attempts",
    "timeRemaining": 1800000
  }
}
```

### POST /api/auth/ip/unblock

Manually unblock an IP address.

**Request Body:**
```json
{
  "ip": "192.168.1.100"
}
```

**Response:**
```json
{
  "message": "IP address successfully unblocked",
  "ip": "192.168.1.100"
}
```

## Error Responses

### 403 Forbidden (Blocked IP)

When a blocked IP attempts to access protected endpoints:

```json
{
  "statusCode": 403,
  "message": "IP_BLOCKED",
  "error": "Your IP address has been temporarily blocked due to multiple failed authentication attempts. Please try again in 30 minutes.",
  "retryAfter": 1800
}
```

### 404 Not Found (IP Not Blocked)

When attempting to unblock an IP that isn't blocked:

```json
{
  "statusCode": 404,
  "message": "IP_NOT_BLOCKED",
  "error": "IP address 192.168.1.100 is not currently blocked"
}
```

## Logging

The system logs the following events:

### Failed Attempt Recorded
```json
{
  "message": "Failed authentication attempt recorded",
  "ip": "192.168.1.100",
  "attempts": 3,
  "maxAttempts": 5
}
```

### IP Blocked
```json
{
  "message": "IP address blocked",
  "ip": "192.168.1.100",
  "reason": "Exceeded 5 failed authentication attempts",
  "blockDuration": "3600s",
  "expiresAt": "2024-11-30T12:00:00.000Z"
}
```

### Blocked IP Attempted Access
```json
{
  "message": "Blocked IP attempted access",
  "ip": "192.168.1.100",
  "reason": "Exceeded 5 failed authentication attempts",
  "blockedAt": "2024-11-30T11:00:00.000Z",
  "timeRemaining": "30 minutes"
}
```

### IP Manually Unblocked
```json
{
  "message": "IP address manually unblocked",
  "ip": "192.168.1.100",
  "previousBlockReason": "Exceeded 5 failed authentication attempts"
}
```

## Testing

### Unit Tests

Run the IP blocking service tests:
```bash
npm test -- ip-blocking.service.spec.ts
```

Run the IP blocking guard tests:
```bash
npm test -- ip-blocking.guard.spec.ts
```

### Manual Testing

1. **Test Failed Attempts:**
   ```bash
   # Attempt authentication 5 times with invalid credentials
   # The 5th attempt should result in IP being blocked
   ```

2. **Test Blocked Access:**
   ```bash
   # After being blocked, any request should return 403
   curl http://localhost:3001/api/auth/google
   ```

3. **Test Unblock:**
   ```bash
   # Unblock the IP
   curl -X POST http://localhost:3001/api/auth/ip/unblock \
     -H "Content-Type: application/json" \
     -d '{"ip": "YOUR_IP"}'
   ```

4. **Test Successful Auth Clears Attempts:**
   ```bash
   # Make 2 failed attempts, then 1 successful attempt
   # Failed attempt counter should be cleared
   ```

## Security Considerations

### IP Spoofing Protection

The system extracts the client IP from:
1. `X-Forwarded-For` header (first IP in the list)
2. Direct connection IP (`request.ip`)
3. Socket remote address

When behind a reverse proxy (like Traefik), ensure the proxy is configured to set the `X-Forwarded-For` header correctly.

### Rate Limiting Integration

IP blocking works alongside the existing rate limiting system:
- Rate limiting prevents request flooding
- IP blocking prevents authentication brute force attacks

Both systems use Redis for storage and are independent of each other.

### Bypass Prevention

- Block information is stored in Redis with TTL
- Manual unblock requires explicit API call
- Failed attempts are tracked within a 15-minute window
- Successful authentication clears the failed attempt counter

## Monitoring

Monitor IP blocking activity through logs:

```bash
# View blocked IPs
grep "IP address blocked" logs/app.log

# View blocked access attempts
grep "Blocked IP attempted access" logs/app.log

# View manual unblocks
grep "IP address manually unblocked" logs/app.log
```

## Future Enhancements

Potential improvements:
1. Add Prometheus metrics for blocked IPs
2. Create Grafana dashboard for IP blocking statistics
3. Add email notifications for repeated blocking
4. Implement IP whitelist for trusted sources
5. Add configurable thresholds per environment
6. Store block history in database for analysis

## Related Requirements

This implementation satisfies:
- **Requirement 8.5**: "WHEN authentication fails 5 times THEN the System SHALL temporarily block the IP address"

## Related Documentation

- [Authentication Documentation](./src/auth/README.md)
- [Rate Limiting Implementation](./RATE_LIMITING_IMPLEMENTATION.md)
- [Security Configuration](../docs/production/PRODUCTION_CHECKLIST.md)
