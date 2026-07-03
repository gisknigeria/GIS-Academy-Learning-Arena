import { Controller, Get } from "@nestjs/common";

@Controller()
export class AppController {
  @Get("health")
  health() {
    return {
      status: "ok",
      service: "GIS Academy Learning Arena API",
      timestamp: new Date().toISOString(),
    };
  }
}
