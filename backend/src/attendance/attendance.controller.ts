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
import { IsBoolean, IsNumber, IsOptional, Max, Min } from "class-validator";
import { Transform, Type } from "class-transformer";
import { Response } from "express";
import { AttendanceService } from "./attendance.service";
import { JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import {
  logOperationalEvent,
  RequestWithId,
} from "../common/operational-logging";

class ClockDto {
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-90) @Max(90)
  latitude?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(-180) @Max(180)
  longitude?: number;
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
type AuthedRequest = RequestWithId & {
  user: { employee_id: string; role: string };
};
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
    const result = await this.attendance.clock(req.user.employee_id, dto, photo);
    logOperationalEvent("info", "attendance.clock.recorded", {
      request_id: req.requestId ?? "unavailable",
    });
    return result;
  }
  @Get("mine") async mine(@Req() req: AuthedRequest) {
    const result = await this.attendance.mine(req.user.employee_id);
    logOperationalEvent("info", "attendance.mine.listed", {
      request_id: req.requestId ?? "unavailable",
    });
    return result;
  }
  @Get("review")
  @Roles("human-resources")
  async review(@Req() req: AuthedRequest) {
    const result = await this.attendance.review();
    logOperationalEvent("info", "attendance.review.listed", {
      request_id: req.requestId ?? "unavailable",
    });
    return result;
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
    logOperationalEvent("info", "attendance.photo.served", {
      request_id: req.requestId ?? "unavailable",
    });
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Cache-Control", "private, no-store");
    res.send(result.bytes);
  }
}
