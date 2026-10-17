import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomUUID } from "crypto";
import { Attendance } from "../entities/attendance.entity";
import { Employee } from "../entities/employee.entity";
import { EmployeeRole } from "../entities/employee-role.entity";
import { PhotoStorageService } from "./photo-storage.service";
import { distanceMeters, isOutsideAttendanceRadius } from "./distance";
const dayKey = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.ATTENDANCE_TIMEZONE || "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance) private attendances: Repository<Attendance>,
    @InjectRepository(Employee) private employees: Repository<Employee>,
    @InjectRepository(EmployeeRole)
    private employeeRoles: Repository<EmployeeRole>,
    private photos: PhotoStorageService,
  ) {}
  private async validatePhoto(file: Express.Multer.File) {
    const bytes = file.buffer;
    if (!bytes || bytes.length < 12)
      throw new BadRequestException("The photo file is invalid.");
    let extension: string;
    let contentType: string;
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      extension = "jpg";
      contentType = "image/jpeg";
    } else if (
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    ) {
      extension = "png";
      contentType = "image/png";
    } else if (
      bytes.toString("ascii", 0, 4) === "RIFF" &&
      bytes.toString("ascii", 8, 12) === "WEBP"
    ) {
      extension = "webp";
      contentType = "image/webp";
    } else throw new BadRequestException("Upload a JPEG, PNG, or WebP photo.");
    return { extension, contentType };
  }
  async clock(
    employeeId: string,
    dto: { latitude: number; longitude: number; is_clock_in: boolean },
    file: Express.Multer.File,
  ) {
    if (dto.is_clock_in !== true && dto.is_clock_in !== false)
      throw new BadRequestException("Choose clock in or clock out.");
    const employee = await this.employees.findOne({
      where: { employee_id: employeeId },
    });
    if (!employee) throw new NotFoundException("Employee not found.");
    const existing = await this.attendances.find({
      where: { employee_id: employeeId },
      order: { timestamp: "DESC" },
    });
    const today = existing.filter(
      (a) => dayKey(new Date(a.timestamp)) === dayKey(new Date()),
    );
    if (dto.is_clock_in && today.some((a) => a.is_clock_in))
      throw new BadRequestException("You have already clocked in today.");
    if (
      !dto.is_clock_in &&
      (!today.some((a) => a.is_clock_in) || today.some((a) => a.is_clock_out))
    )
      throw new BadRequestException(
        "Clock in first; clock out can be recorded once per day.",
      );
    const { extension, contentType } = await this.validatePhoto(file);
    const id = randomUUID();
    const timestamp = new Date();
    const key = `${employeeId}/${id}-${timestamp.toISOString().replace(/[:.]/g, "-")}.${extension}`;
    await this.photos.save(key, file.buffer, contentType);
    const attendance = this.attendances.create({
      attendance_id: id,
      employee_id: employeeId,
      evidence_photo_address: key,
      attendance_latitude: dto.latitude,
      attendance_longitude: dto.longitude,
      timestamp,
      is_clock_in: dto.is_clock_in,
      is_clock_out: !dto.is_clock_in,
    });
    await this.attendances.save(attendance);
    const distance = distanceMeters(
      Number(employee.address_latitude),
      Number(employee.address_longitude),
      dto.latitude,
      dto.longitude,
    );
    return {
      attendance_id: id,
      timestamp,
      is_clock_in: attendance.is_clock_in,
      is_clock_out: attendance.is_clock_out,
      distance_from_home_m: Math.round(distance),
    };
  }
  async mine(employeeId: string) {
    const rows = await this.attendances.find({
      where: { employee_id: employeeId },
      order: { timestamp: "DESC" },
    });
    return rows.map((a) => ({
      attendance_id: a.attendance_id,
      timestamp: a.timestamp,
      is_clock_in: a.is_clock_in,
      is_clock_out: a.is_clock_out,
      evidence_url: `/attendances/${a.attendance_id}/photo`,
    }));
  }
  async review() {
    const rows = await this.attendances.find({
      relations: { employee: true },
      order: { timestamp: "DESC" },
      take: 500,
    });
    return rows.map((a) => {
      const distance = distanceMeters(
        Number(a.employee.address_latitude),
        Number(a.employee.address_longitude),
        Number(a.attendance_latitude),
        Number(a.attendance_longitude),
      );
      return {
        attendance_id: a.attendance_id,
        employee_id: a.employee_id,
        employee_name: a.employee.name,
        email: a.employee.email,
        timestamp: a.timestamp,
        is_clock_in: a.is_clock_in,
        is_clock_out: a.is_clock_out,
        attendance_latitude: Number(a.attendance_latitude),
        attendance_longitude: Number(a.attendance_longitude),
        distance_from_home_m: Math.round(distance),
        outside_radius: isOutsideAttendanceRadius(distance),
        evidence_url: `/attendances/${a.attendance_id}/photo`,
      };
    });
  }
  async photo(id: string, employeeId: string, role: string) {
    const item = await this.attendances.findOne({
      where: { attendance_id: id },
    });
    if (!item) throw new NotFoundException("Attendance record not found.");
    if (role !== "human-resources" && item.employee_id !== employeeId)
      throw new ForbiddenException();
    return this.photos.read(item.evidence_photo_address);
  }
}
