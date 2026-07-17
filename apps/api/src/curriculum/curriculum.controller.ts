import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request";
import { CurriculumService } from "./curriculum.service";
import {
  CreateCategoryDto,
  CreateModuleDto,
  CreatePathwayDto,
  CreateStageDto,
  ImportModuleDto,
  PlaceCourseDto,
} from "./dto/curriculum.dto";

const MANAGE_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINING_MANAGER, UserRole.TRAINER];
const STRUCTURE_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINING_MANAGER];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("curriculum")
export class CurriculumController {
  constructor(private readonly curriculum: CurriculumService) {}

  @Get("catalogue")
  catalogue(@Req() req: AuthenticatedRequest) {
    return this.curriculum.getCatalogue(req.user.sub);
  }

  @Roles(...STRUCTURE_ROLES)
  @Post("categories")
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.curriculum.createCategory(dto);
  }

  @Roles(...STRUCTURE_ROLES)
  @Post("categories/:categoryId/pathways")
  createPathway(@Param("categoryId") categoryId: string, @Body() dto: CreatePathwayDto) {
    return this.curriculum.createPathway(categoryId, dto);
  }

  @Roles(...STRUCTURE_ROLES)
  @Post("pathways/:pathwayId/stages")
  createStage(@Param("pathwayId") pathwayId: string, @Body() dto: CreateStageDto) {
    return this.curriculum.createStage(pathwayId, dto);
  }

  @Roles(...STRUCTURE_ROLES)
  @Post("stages/:stageId/courses")
  placeCourse(@Param("stageId") stageId: string, @Body() dto: PlaceCourseDto) {
    return this.curriculum.placeCourse(stageId, dto);
  }

  @Roles(...STRUCTURE_ROLES)
  @Delete("course-placements/:placementId")
  removeCoursePlacement(@Param("placementId") placementId: string) {
    return this.curriculum.removeCoursePlacement(placementId);
  }

  @Get("courses/:courseId/modules")
  listModules(@Param("courseId") courseId: string) {
    return this.curriculum.listModules(courseId);
  }

  @Roles(...MANAGE_ROLES)
  @Get("module-library")
  moduleLibrary(@Query("search") search?: string, @Query("excludeCourseId") excludeCourseId?: string) {
    return this.curriculum.moduleLibrary(search, excludeCourseId);
  }

  @Roles(...MANAGE_ROLES)
  @Post("courses/:courseId/modules")
  createModule(@Param("courseId") courseId: string, @Body() dto: CreateModuleDto) {
    return this.curriculum.createModule(courseId, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Post("courses/:courseId/modules/import")
  importModule(@Param("courseId") courseId: string, @Body() dto: ImportModuleDto) {
    return this.curriculum.importModule(courseId, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Patch("modules/:moduleId")
  updateModule(@Param("moduleId") moduleId: string, @Body() dto: CreateModuleDto) {
    return this.curriculum.updateModule(moduleId, dto);
  }

  @Roles(...MANAGE_ROLES)
  @Delete("modules/:moduleId")
  deleteModule(@Param("moduleId") moduleId: string) {
    return this.curriculum.deleteModule(moduleId);
  }
}

