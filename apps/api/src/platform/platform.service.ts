import { Injectable } from "@nestjs/common";

@Injectable()
export class PlatformService {
  getModules() {
    return {
      product: "GIS Konsult Knowledge Hub",
      backend: "NestJS",
      modules: [
        "auth",
        "users-and-roles",
        "schools-and-organizations",
        "courses-and-packages",
        "curriculum",
        "lessons-and-resources",
        "classes-and-attendance",
        "assignments",
        "assessments",
        "challenges-and-competitions",
        "olympiad",
        "leaderboards-and-achievements",
        "certificates",
        "notifications",
        "reports-and-analytics",
      ],
    };
  }
}
