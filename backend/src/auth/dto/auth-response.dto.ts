import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ description: 'User email address' })
  email!: string;

  @ApiProperty({ description: 'User first name' })
  firstName!: string;

  @ApiProperty({ description: 'User last name' })
  lastName!: string;

  @ApiProperty({ description: 'User profile picture URL' })
  picture!: string;
}

export class AuthStatusDto {
  @ApiProperty({ description: 'Whether the user is authenticated' })
  authenticated!: boolean;

  @ApiPropertyOptional({ description: 'User information if authenticated', type: UserDto })
  user?: UserDto;
}

export class AuthResponseDto {
  @ApiProperty({ description: 'Success message' })
  message!: string;

  @ApiProperty({ description: 'User information', type: UserDto })
  user!: UserDto;
}

export class LogoutResponseDto {
  @ApiProperty({ description: 'Success message' })
  message!: string;
}
