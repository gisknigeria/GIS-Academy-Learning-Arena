import { Controller, Get } from "@nestjs/common";
import { PlatformService } from "./platform.service";

@Controller("platform")
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get("modules")
  modules() {
    return this.platformService.getModules();
  }
}
