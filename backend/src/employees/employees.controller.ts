import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  IsDateString,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { EmployeesService } from "./employees.service";
import { JwtAuthGuard, Roles, RolesGuard } from "../auth/guards";
import { logOperationalEvent, RequestWithId } from "../common/operational-logging";

class EmployeeDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @MinLength(8) password?: string;
  @IsDateString() birth_date: string;
  @IsString() address: string;
  @Type(() => Number) @IsNumber() @Min(-90) @Max(90) address_latitude: number;
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  address_longitude: number;
  @IsIn(["employee", "human-resources"]) role_name: string;
}

@Controller("employees")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("human-resources")
export class EmployeesController {
  constructor(private employees: EmployeesService) {}
  @Get() async list(@Req() req: RequestWithId) {
    const result = await this.employees.list();
    logOperationalEvent("info", "employee.list.completed", {
      request_id: req.requestId ?? "unavailable",
    });
    return result;
  }
  @Post() async create(@Body() dto: EmployeeDto, @Req() req: RequestWithId) {
    const result = await this.employees.create(dto);
    logOperationalEvent("info", "employee.create.completed", {
      request_id: req.requestId ?? "unavailable",
    });
    return result;
  }
  @Put(":id") async update(
    @Param("id") id: string,
    @Body() dto: EmployeeDto,
    @Req() req: RequestWithId,
  ) {
    const result = await this.employees.update(id, dto);
    logOperationalEvent("info", "employee.update.completed", {
      request_id: req.requestId ?? "unavailable",
    });
    return result;
  }
}
