import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
} from 'class-validator';

export class SendMessageDto {
  @ApiProperty()
  @IsNotEmpty()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsUUID('all', { each: true })
  studentIds: string[];

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  message: string;

  @ApiProperty({ description: 'text to speech' })
  @IsNotEmpty()
  @IsBoolean()
  tts: boolean;

  @ApiProperty({
    description:
      'During this time, the message cannot be closed (unit: seconds)',
  })
  @IsNotEmpty()
  @IsNumber()
  closeDelay: number;
}
