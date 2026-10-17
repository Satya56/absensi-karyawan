import { Injectable, UnauthorizedException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { compare } from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { Employee } from "../entities/employee.entity";
import { EmployeeRole } from "../entities/employee-role.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employee) private employees: Repository<Employee>,
    @InjectRepository(EmployeeRole) private roles: Repository<EmployeeRole>,
    private jwt: JwtService,
  ) {}

  async login(email: string, password: string) {
    const employee = await this.employees
      .createQueryBuilder("employee")
      .addSelect("employee.password")
      .where("employee.email = :email", { email: email.toLowerCase() })
      .getOne();
    if (!employee || !(await compare(password, employee.password)))
      throw new UnauthorizedException("Email or password is incorrect.");
    const link = await this.roles.findOne({
      where: { employee_id: employee.employee_id },
      relations: { role: true },
    });
    const roleName = link?.role?.role_name ?? "employee";
    const accessToken = await this.jwt.signAsync({
      sub: employee.employee_id,
      role: roleName,
    });
    return {
      accessToken,
      employee: {
        employee_id: employee.employee_id,
        name: employee.name,
        email: employee.email,
        role: roleName,
      },
    };
  }
}
