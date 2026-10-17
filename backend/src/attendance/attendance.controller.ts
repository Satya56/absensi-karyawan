import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { IsBoolean, IsNumber, Max, Min } from "class-validator";
import { Transform, Type } from "class-transformer";
import { Request, Response } from "express";
import { AttendanceService } from "./attendance.service";
import { JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";

class ClockDto {
  @Type(() => Number) @IsNumber() @Min(-90) @Max(90) latitude: number;
  @Type(() => Number) @IsNumber() @Min(-180) @Max(180) longitude: number;
  @Transform(({ value }) =>
    value === true || value === "true"
      ? true
      : value === false || value === "false"
        ? false
        : value,
  )
  @IsBoolean()
  is_clock_in: boolean;
}
type AuthedRequest = Request & { user: { employee_id: string; role: string } };
@Controller("attendances")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private attendance: AttendanceService) {}
  @Post("clock")
  @UseInterceptors(
    FileInterceptor("photo", {
      storage: memoryStorage(),
      limits: {
        fileSize: Number(process.env.MAX_PHOTO_SIZE_MB || 8) * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async clock(
    @Req() req: AuthedRequest,
    @Body() dto: ClockDto,
    @UploadedFile() photo?: Express.Multer.File,
  ) {
    if (!photo) throw new BadRequestException("A selfie photo is required.");
    return this.attendance.clock(req.user.employee_id, dto, photo);
  }
  @Get("mine") mine(@Req() req: AuthedRequest) {
    return this.attendance.mine(req.user.employee_id);
  }
  @Get("review") @Roles("human-resources") review() {
    return this.attendance.review();
  }
  @Get(":id/photo")
  async photo(
    @Param("id") id: string,
    @Req() req: AuthedRequest,
    @Res() res: Response,
  ) {
    const result = await this.attendance.photo(
      id,
      req.user.employee_id,
      req.user.role,
    );
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(result.bytes);
  }
}
