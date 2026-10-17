import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { AttendanceModule } from "./attendance/attendance.module";
import { EmployeesModule } from "./employees/employees.module";
import { Role } from "./entities/role.entity";
import { Employee } from "./entities/employee.entity";
import { EmployeeRole } from "./entities/employee-role.entity";
import { Attendance } from "./entities/attendance.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "mysql",
        host: config.get("DB_HOST", "localhost"),
        port: Number(config.get("DB_PORT", 3306)),
        username: config.get("DB_USERNAME", "attendance"),
        password: config.get("DB_PASSWORD", "attendance"),
        database: config.get("DB_DATABASE", "attendance"),
        timezone: "Z",
        entities: [Employee, Role, EmployeeRole, Attendance],
        synchronize: config.get("DB_SYNC", "false") === "true",
        logging: false,
      }),
    }),
    AuthModule,
    EmployeesModule,
    AttendanceModule,
  ],
})
export class AppModule {}
