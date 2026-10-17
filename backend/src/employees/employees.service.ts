import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { hash } from "bcrypt";
import { randomUUID } from "crypto";
import { Employee } from "../entities/employee.entity";
import { EmployeeRole } from "../entities/employee-role.entity";
import { Role } from "../entities/role.entity";

type EmployeeInput = {
  name: string;
  email: string;
  password?: string;
  birth_date: string;
  address: string;
  address_latitude: number;
  address_longitude: number;
  role_name: string;
};
@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employee) private employees: Repository<Employee>,
    @InjectRepository(EmployeeRole)
    private employeeRoles: Repository<EmployeeRole>,
    @InjectRepository(Role) private roles: Repository<Role>,
    private dataSource: DataSource,
  ) {}
  async list() {
    const rows = await this.employees.find({
      relations: { role: true, roleLink: { role: true } },
      order: { name: "ASC" },
    });
    return rows.map((e) => ({
      employee_id: e.employee_id,
      name: e.name,
      email: e.email,
      birth_date: e.birth_date,
      address: e.address,
      address_latitude: Number(e.address_latitude),
      address_longitude: Number(e.address_longitude),
      role_name: e.role?.role_name ?? e.roleLink?.role?.role_name,
    }));
  }
  private async findRole(name: string) {
    let role = await this.roles.findOne({ where: { role_name: name } });
    if (!role) {
      role = this.roles.create({ role_id: randomUUID(), role_name: name });
      await this.roles.save(role);
    }
    return role;
  }
  async create(input: EmployeeInput) {
    const email = input.email.toLowerCase();
    if (await this.employees.exists({ where: { email } }))
      throw new ConflictException("Email is already in use.");
    const role = await this.findRole(input.role_name);
    const id = randomUUID();
    const employee = this.employees.create({
      employee_id: id,
      name: input.name,
      email,
      password: await hash(input.password ?? randomUUID(), 12),
      birth_date: input.birth_date,
      address: input.address,
      address_latitude: input.address_latitude,
      address_longitude: input.address_longitude,
      role,
    });
    await this.dataSource.transaction(async (manager) => {
      await manager.save(employee);
      await manager.save(EmployeeRole, {
        employee_id: id,
        role_id: role.role_id,
      });
    });
    return { employee_id: id, name: employee.name, email: employee.email };
  }
  async update(id: string, input: EmployeeInput) {
    const employee = await this.employees.findOne({
      where: { employee_id: id },
    });
    if (!employee) throw new NotFoundException("Employee not found.");
    const email = input.email.toLowerCase();
    const existing = await this.employees.findOne({ where: { email } });
    if (existing && existing.employee_id !== id)
      throw new ConflictException("Email is already in use.");
    const role = await this.findRole(input.role_name);
    employee.name = input.name;
    employee.email = email;
    employee.birth_date = input.birth_date;
    employee.address = input.address;
    employee.address_latitude = input.address_latitude;
    employee.address_longitude = input.address_longitude;
    employee.role = role;
    if (input.password) employee.password = await hash(input.password, 12);
    await this.dataSource.transaction(async (manager) => {
      await manager.save(employee);
      const link = await manager.findOne(EmployeeRole, {
        where: { employee_id: id },
      });
      if (link)
        await manager.update(
          EmployeeRole,
          { employee_id: id },
          { role_id: role.role_id },
        );
      else
        await manager.save(EmployeeRole, {
          employee_id: id,
          role_id: role.role_id,
        });
    });
    return { employee_id: id, name: employee.name, email: employee.email };
  }
}
