import { IsString, MinLength } from "class-validator";

export class RedeemPromoDto {
  @IsString()
  @MinLength(4)
  code!: string;
}
