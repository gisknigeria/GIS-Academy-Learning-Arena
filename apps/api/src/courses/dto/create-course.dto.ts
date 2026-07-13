import { DeliveryMode } from "@prisma/client";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";

export class CreateCourseDto {
  @IsString()
  @MinLength(2)
  code!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  trainingCategory?: string;

  @IsOptional()
  @IsInt()
  @Min(100)
  @Max(999)
  level?: number;

  @IsEnum(DeliveryMode)
  deliveryMode!: DeliveryMode;

  @IsOptional()
  @IsBoolean()
  requiresPayment?: boolean;
}
