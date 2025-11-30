import { Injectable, Logger, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

interface BlockedIPInfo {
  ip: string;
  attempts: number;
  blockedAt: number;
  reason: string;
}

/**
 * Service for tracking and blocking IP addresses based on failed authentication attempts
 */
@Injectable()
export class IpBlockingService {
  private readonly logger = new Logger(IpBlockingService.name);
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly BLOCK_DURATION_MS = 3600000; // 1 hour
  private readonly ATTEMPT_WINDOW_MS = 900000; // 15 minutes
  private readonly FAILED_ATTEMPTS_PREFIX = 'auth:failed:';
  private readonly BLOCKED_IP_PREFIX = 'auth:blocked:';

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Records a failed authentication attempt for an IP address
   * @param ip - The IP address that failed authentication
   * @returns True if the IP should be blocked, false otherwise
   */
  async recordFailedAttempt(ip: string): Promise<boolean> {
    const key = `${this.FAILED_ATTEMPTS_PREFIX}${ip}`;
    
    // Get current attempt count
    const currentAttempts = (await this.cacheManager.get<number>(key)) || 0;
    const newAttempts = currentAttempts + 1;

    // Store updated attempt count with TTL
    await this.cacheManager.set(key, newAttempts, this.ATTEMPT_WINDOW_MS);

    this.logger.warn({
      message: 'Failed authentication attempt recorded',
      ip,
      attempts: newAttempts,
      maxAttempts: this.MAX_FAILED_ATTEMPTS,
    });

    // Check if we should block this IP
    if (newAttempts >= this.MAX_FAILED_ATTEMPTS) {
      await this.blockIP(ip, `Exceeded ${this.MAX_FAILED_ATTEMPTS} failed authentication attempts`);
      return true;
    }

    return false;
  }

  /**
   * Blocks an IP address
   * @param ip - The IP address to block
   * @param reason - The reason for blocking
   */
  async blockIP(ip: string, reason: string): Promise<void> {
    const blockInfo: BlockedIPInfo = {
      ip,
      attempts: await this.getFailedAttempts(ip),
      blockedAt: Date.now(),
      reason,
    };

    const key = `${this.BLOCKED_IP_PREFIX}${ip}`;
    await this.cacheManager.set(key, blockInfo, this.BLOCK_DURATION_MS);

    // Clear failed attempts counter since IP is now blocked
    await this.cacheManager.del(`${this.FAILED_ATTEMPTS_PREFIX}${ip}`);

    this.logger.warn({
      message: 'IP address blocked',
      ip,
      reason,
      blockDuration: `${this.BLOCK_DURATION_MS / 1000}s`,
      expiresAt: new Date(Date.now() + this.BLOCK_DURATION_MS).toISOString(),
    });
  }

  /**
   * Checks if an IP address is currently blocked
   * @param ip - The IP address to check
   * @returns BlockedIPInfo if blocked, null otherwise
   */
  async isBlocked(ip: string): Promise<BlockedIPInfo | null> {
    const key = `${this.BLOCKED_IP_PREFIX}${ip}`;
    const blockInfo = await this.cacheManager.get<BlockedIPInfo>(key);
    return blockInfo || null;
  }

  /**
   * Unblocks an IP address (manual unblock mechanism)
   * @param ip - The IP address to unblock
   * @returns True if IP was blocked and is now unblocked, false if IP was not blocked
   */
  async unblockIP(ip: string): Promise<boolean> {
    const blockInfo = await this.isBlocked(ip);
    
    if (!blockInfo) {
      return false;
    }

    // Remove block
    await this.cacheManager.del(`${this.BLOCKED_IP_PREFIX}${ip}`);
    
    // Clear any remaining failed attempts
    await this.cacheManager.del(`${this.FAILED_ATTEMPTS_PREFIX}${ip}`);

    this.logger.log({
      message: 'IP address manually unblocked',
      ip,
      previousBlockReason: blockInfo.reason,
    });

    return true;
  }

  /**
   * Clears failed attempts for an IP (called on successful auth)
   * @param ip - The IP address to clear attempts for
   */
  async clearFailedAttempts(ip: string): Promise<void> {
    const key = `${this.FAILED_ATTEMPTS_PREFIX}${ip}`;
    await this.cacheManager.del(key);
  }

  /**
   * Gets the number of failed attempts for an IP
   * @param ip - The IP address to check
   * @returns The number of failed attempts
   */
  async getFailedAttempts(ip: string): Promise<number> {
    const key = `${this.FAILED_ATTEMPTS_PREFIX}${ip}`;
    return (await this.cacheManager.get<number>(key)) || 0;
  }

  /**
   * Gets information about a blocked IP
   * @param ip - The IP address to get info for
   * @returns BlockedIPInfo if blocked, null otherwise
   */
  async getBlockInfo(ip: string): Promise<BlockedIPInfo | null> {
    return this.isBlocked(ip);
  }

  /**
   * Gets the time remaining until an IP is unblocked
   * @param ip - The IP address to check
   * @returns Time remaining in milliseconds, or 0 if not blocked
   */
  async getTimeUntilUnblock(ip: string): Promise<number> {
    const blockInfo = await this.isBlocked(ip);
    
    if (!blockInfo) {
      return 0;
    }

    const timeRemaining = (blockInfo.blockedAt + this.BLOCK_DURATION_MS) - Date.now();
    return Math.max(0, timeRemaining);
  }
}
