import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Attendance } from "../entities/attendance.entity";
import { Employee } from "../entities/employee.entity";
import { EmployeeRole } from "../entities/employee-role.entity";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";
import { PhotoStorageService } from "./photo-storage.service";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([Attendance, Employee, EmployeeRole]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, PhotoStorageService, JwtAuthGuard, RolesGuard],
})
export class AttendanceModule {}
