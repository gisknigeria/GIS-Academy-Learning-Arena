import { DeliveryMode } from "@prisma/client";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class CourseSoftwareOptionDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  version?: string;
}

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
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  bannerUrl?: string;

  @IsOptional()
  @IsString()
  whatYoullLearn?: string;

  @IsOptional()
  @IsString()
  prerequisites?: string;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  estimatedHours?: number;

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

  @IsOptional()
  @IsBoolean()
  usesSoftware?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CourseSoftwareOptionDto)
  softwareOptions?: CourseSoftwareOptionDto[];
}
