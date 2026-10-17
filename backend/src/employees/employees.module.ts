import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Employee } from "../entities/employee.entity";
import { EmployeeRole } from "../entities/employee-role.entity";
import { Role } from "../entities/role.entity";
import { EmployeesController } from "./employees.controller";
import { EmployeesService } from "./employees.service";
import { JwtAuthGuard, RolesGuard } from "../auth/guards";

@Module({
  imports: [TypeOrmModule.forFeature([Employee, EmployeeRole, Role])],
  controllers: [EmployeesController],
  providers: [EmployeesService, JwtAuthGuard, RolesGuard],
})
export class EmployeesModule {}
