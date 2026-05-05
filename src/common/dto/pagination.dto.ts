import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number) // Transform the query parameter to a number, equivalent to enableImplicitConversions: true
  limit?: number = 10;

  @IsOptional()
  @Min(0)
  @Type(() => Number) // Transform the query parameter to a number
  offset: number = 0;
}
