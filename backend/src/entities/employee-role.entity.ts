import {
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Employee } from "./employee.entity";
import { Role } from "./role.entity";

@Entity("employee_roles")
export class EmployeeRole {
  @PrimaryColumn({ type: "varchar", length: 36 }) employee_id: string;
  @PrimaryColumn({ type: "varchar", length: 36 }) role_id: string;
  @OneToOne(() => Employee, (employee) => employee.roleLink, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "employee_id" })
  employee: Employee;
  @ManyToOne(() => Role, (role) => role.employeeLinks, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "role_id" })
  role: Role;
}
