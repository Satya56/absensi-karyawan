import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm";
import { EmployeeRole } from "./employee-role.entity";

@Entity("roles")
export class Role {
  @PrimaryColumn({ type: "varchar", length: 36 }) role_id: string;
  @Column({ type: "varchar", length: 80, unique: true }) role_name: string;
  @OneToMany(() => EmployeeRole, (link) => link.role)
  employeeLinks: EmployeeRole[];
}
