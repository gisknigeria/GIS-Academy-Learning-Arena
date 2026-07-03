import { Injectable } from "@nestjs/common";

@Injectable()
export class PlatformService {
  getModules() {
    return {
      product: "GIS Academy Learning Arena",
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
        "competition-arena",
        "olympiad",
        "leaderboards-and-achievements",
        "certificates",
        "notifications",
        "reports-and-analytics",
      ],
    };
  }
}
