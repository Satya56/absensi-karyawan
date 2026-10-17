import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  RelationId,
} from "typeorm";
import { EmployeeRole } from "./employee-role.entity";
import { Attendance } from "./attendance.entity";
import { Role } from "./role.entity";

@Entity("employees")
export class Employee {
  @PrimaryColumn({ type: "varchar", length: 36 }) employee_id: string;
  @Column({ type: "varchar", length: 140 }) name: string;
  @Column({ type: "varchar", length: 190, unique: true }) email: string;
  @Column({ type: "varchar", length: 255, select: false }) password: string;
  @Column({ type: "date" }) birth_date: string;
  @Column({ type: "text" }) address: string;
  @Column({ type: "decimal", precision: 10, scale: 7 })
  address_longitude: number;
  @Column({ type: "decimal", precision: 10, scale: 7 })
  address_latitude: number;
  @ManyToOne(() => Role, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "role_id" })
  role: Role;
  @RelationId((employee: Employee) => employee.role) role_id: string;
  @OneToOne(() => EmployeeRole, (link) => link.employee) roleLink: EmployeeRole;
  @OneToMany(() => Attendance, (attendance) => attendance.employee)
  attendances: Attendance[];
}
