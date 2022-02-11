import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  ArrayUnique,
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

  @ApiProperty({ description: 'text to speech repeat times' })
  @IsNotEmpty()
  @IsNumber()
  tts: number;

  @ApiProperty({
    description:
      'During this time, the message cannot be closed (unit: seconds)',
  })
  @IsNotEmpty()
  @IsNumber()
  closeDelay: number;
}
