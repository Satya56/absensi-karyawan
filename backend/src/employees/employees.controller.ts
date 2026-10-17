import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Param,
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
  @Get() list() {
    return this.employees.list();
  }
  @Post() create(@Body() dto: EmployeeDto) {
    return this.employees.create(dto);
  }
  @Put(":id") update(@Param("id") id: string, @Body() dto: EmployeeDto) {
    return this.employees.update(id, dto);
  }
}
