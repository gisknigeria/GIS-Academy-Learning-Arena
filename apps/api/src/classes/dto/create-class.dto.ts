import { DeliveryMode } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class CreateClassDto {
  @IsString()
  @MinLength(2)
  courseId!: string;

  @IsString()
  @MinLength(3)
  name!: string;

  @IsEnum(DeliveryMode)
  mode!: DeliveryMode;

  @IsOptional()
  @IsString()
  trainerId?: string;

  @IsOptional()
  @IsString()
  startsAt?: string;

  @IsOptional()
  @IsString()
  endsAt?: string;
}
