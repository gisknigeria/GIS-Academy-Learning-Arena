import { IsString, MinLength } from "class-validator";

export class SelectSoftwareTrackDto {
  @IsString()
  @MinLength(1)
  softwareTrackId!: string;
}
