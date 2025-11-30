import { ApiProperty } from '@nestjs/swagger';
import { IsIP } from 'class-validator';

export class UnblockIpDto {
  @ApiProperty({
    description: 'IP address to unblock',
    example: '192.168.1.100',
  })
  @IsIP()
  ip!: string;
}

export class BlockedIpInfoDto {
  @ApiProperty({
    description: 'IP address',
    example: '192.168.1.100',
  })
  ip!: string;

  @ApiProperty({
    description: 'Number of failed attempts before blocking',
    example: 5,
  })
  attempts!: number;

  @ApiProperty({
    description: 'Timestamp when IP was blocked (Unix timestamp)',
    example: 1701360000000,
  })
  blockedAt!: number;

  @ApiProperty({
    description: 'Reason for blocking',
    example: 'Exceeded 5 failed authentication attempts',
  })
  reason!: string;

  @ApiProperty({
    description: 'Time remaining until automatic unblock (milliseconds)',
    example: 3600000,
  })
  timeRemaining!: number;
}

export class UnblockResponseDto {
  @ApiProperty({
    description: 'Success message',
    example: 'IP address successfully unblocked',
  })
  message!: string;

  @ApiProperty({
    description: 'The IP address that was unblocked',
    example: '192.168.1.100',
  })
  ip!: string;
}

export class IpStatusDto {
  @ApiProperty({
    description: 'Whether the IP is currently blocked',
    example: false,
  })
  blocked!: boolean;

  @ApiProperty({
    description: 'Number of failed attempts (if not blocked)',
    example: 2,
    required: false,
  })
  failedAttempts?: number;

  @ApiProperty({
    description: 'Block information (if blocked)',
    required: false,
    type: BlockedIpInfoDto,
  })
  blockInfo?: BlockedIpInfoDto;
}
