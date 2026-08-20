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
import { CourseSoftwareOptionDto } from "./create-course.dto";

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  code?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

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

  @IsOptional()
  @IsEnum(DeliveryMode)
  deliveryMode?: DeliveryMode;

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
