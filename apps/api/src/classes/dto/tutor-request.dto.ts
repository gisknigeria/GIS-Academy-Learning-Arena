import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, IsUrl, MinLength } from "class-validator";

export class CreateTutorRequestDto {
  @IsString() @MinLength(2) topic!: string;
  @IsString() @MinLength(2) challenge!: string;
  @IsString() @MinLength(2) attempted!: string;
  @IsString() @MinLength(2) desiredOutcome!: string;
  @IsString() @MinLength(2) botSummary!: string;
}

export class ProposeTutorSlotsDto {
  @IsArray()
  @ArrayMinSize(3)
  @ArrayMaxSize(3)
  @IsString({ each: true })
  slots!: string[];
}

export class SelectTutorSlotDto {
  @IsString()
  selectedStart!: string;
}

export class SetTutorMeetingLinkDto {
  @IsUrl({ require_protocol: true })
  meetingUrl!: string;
}
