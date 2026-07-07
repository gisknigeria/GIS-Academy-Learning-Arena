import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { ClassesService } from "./classes.service";
import { CreateClassDto } from "./dto/create-class.dto";
import { EnrollStudentDto } from "./dto/enroll-student.dto";
import { MarkAttendanceDto } from "./dto/mark-attendance.dto";
import { UpdateClassDto } from "./dto/update-class.dto";
import { BulkEnrollDto } from "./dto/bulk-enroll.dto";
import { CreateAnnouncementDto } from "./dto/create-announcement.dto";

const WRITE_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.TRAINING_MANAGER,
  UserRole.TRAINER,
  UserRole.SCHOOL_COORDINATOR,
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller("classes")
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  findAll() {
    return this.classesService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.classesService.findOne(id);
  }

  @Roles(...WRITE_ROLES)
  @Post()
  create(@Body() dto: CreateClassDto) {
    return this.classesService.create(dto);
  }

  @Roles(...WRITE_ROLES)
  @Patch(":id")
  update(@Param("id") id: string, @Body() dto: UpdateClassDto) {
    return this.classesService.update(id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.TRAINING_MANAGER)
  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.classesService.remove(id);
  }

  @Roles(...WRITE_ROLES)
  @Post(":id/enroll")
  enroll(@Param("id") id: string, @Body() dto: EnrollStudentDto) {
    return this.classesService.enroll(id, dto);
  }

  @Roles(...WRITE_ROLES)
  @Post(":id/enroll/bulk")
  bulkEnroll(@Param("id") id: string, @Body() dto: BulkEnrollDto) {
    return this.classesService.bulkEnroll(id, dto);
  }

  @Get(":id/students")
  students(@Param("id") id: string) {
    return this.classesService.listStudents(id);
  }

  @Roles(...WRITE_ROLES)
  @Post(":id/attendance")
  markAttendance(@Param("id") id: string, @Body() dto: MarkAttendanceDto) {
    return this.classesService.markAttendance(id, dto);
  }

  @Get(":id/attendance")
  attendance(@Param("id") id: string, @Query("date") date?: string) {
    return this.classesService.listAttendance(id, date);
  }

  @Get(":id/attendance/analytics")
  attendanceAnalytics(@Param("id") id: string, @Query("from") from?: string, @Query("to") to?: string) {
    return this.classesService.attendanceAnalytics(id, from, to);
  }

  @Get(":id/attendance/export")
  exportAttendance(@Param("id") id: string, @Query("date") date?: string) {
    return this.classesService.exportAttendanceCsv(id, date);
  }

  @Get(":id/schedule")
  schedule(@Param("id") id: string) {
    return this.classesService.getSchedule(id);
  }

  @Roles(...WRITE_ROLES)
  @Post(":id/announcements")
  createAnnouncement(@Param("id") id: string, @Body() dto: CreateAnnouncementDto, @Query("author") author?: string) {
    return this.classesService.createAnnouncement(id, author ?? null, dto);
  }

  @Get(":id/announcements")
  listAnnouncements(@Param("id") id: string) {
    return this.classesService.listAnnouncements(id);
  }

  @Roles(...WRITE_ROLES)
  @Delete("announcements/:id")
  deleteAnnouncement(@Param("id") id: string) {
    return this.classesService.removeAnnouncement(id);
  }
}
