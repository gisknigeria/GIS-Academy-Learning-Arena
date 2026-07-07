import { Controller, Post, UploadedFile, UseInterceptors, Body, UseGuards, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

type UploadedBufferFile = {
  originalname: string;
  buffer: Buffer;
  mimetype?: string;
};

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  // Public lesson resource upload (may be protected in prod)
  @Post('lesson-resource')
  @UseInterceptors(FileInterceptor('file'))
  async uploadLessonResource(@UploadedFile() file: UploadedBufferFile, @Body('lessonId') lessonId?: string) {
    const folder = lessonId ? `lessons/${lessonId}` : 'lessons';
    const r = await this.uploadsService.uploadBuffer(file.originalname, file.buffer, file.mimetype, folder);
    return r;
  }

  // Assignment submission upload
  @UseGuards(JwtAuthGuard)
  @Post('submission')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSubmission(@UploadedFile() file: UploadedBufferFile, @Body('assignmentId') assignmentId?: string, @Req() req?: any) {
    const folder = assignmentId ? `submissions/${assignmentId}` : `submissions/user-${req.user.sub}`;
    const r = await this.uploadsService.uploadBuffer(file.originalname, file.buffer, file.mimetype, folder);
    return r;
  }

  // Profile avatar (authenticated)
  @UseGuards(JwtAuthGuard)
  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: UploadedBufferFile, @Req() req?: any) {
    const folder = `avatars`;
    const r = await this.uploadsService.uploadBuffer(file.originalname, file.buffer, file.mimetype, folder);
    // Optionally update user's profile URL in DB (left to caller)
    return r;
  }

  // Certificate asset
  @UseGuards(JwtAuthGuard)
  @Post('certificate')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCertificate(@UploadedFile() file: UploadedBufferFile, @Body('certificateId') certificateId?: string) {
    const folder = certificateId ? `certificates/${certificateId}` : 'certificates';
    const r = await this.uploadsService.uploadBuffer(file.originalname, file.buffer, file.mimetype, folder);
    return r;
  }

  // Course thumbnail
  @UseGuards(JwtAuthGuard)
  @Post('course-thumbnail')
  @UseInterceptors(FileInterceptor('file'))
  async uploadCourseThumbnail(@UploadedFile() file: UploadedBufferFile, @Body('courseId') courseId?: string) {
    const folder = courseId ? `courses/${courseId}` : 'courses';
    const r = await this.uploadsService.uploadBuffer(file.originalname, file.buffer, file.mimetype, folder);
    return r;
  }
}
