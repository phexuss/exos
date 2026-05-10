import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class DeezerIdParamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id!: number;
}
