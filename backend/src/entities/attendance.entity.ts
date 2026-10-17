import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from "typeorm";
import { Employee } from "./employee.entity";

@Entity("attendances")
export class Attendance {
  @PrimaryColumn({ type: "varchar", length: 36 }) attendance_id: string;
  @Column({ type: "varchar", length: 500 }) evidence_photo_address: string;
  @Column({ type: "decimal", precision: 10, scale: 7 })
  attendance_longitude: number;
  @Column({ type: "decimal", precision: 10, scale: 7 })
  attendance_latitude: number;
  @Column({ type: "datetime", precision: 3 }) timestamp: Date;
  @Column({ type: "varchar", length: 36 }) employee_id: string;
  @Column({ type: "boolean", default: false }) is_clock_in: boolean;
  @Column({ type: "boolean", default: false }) is_clock_out: boolean;
  @ManyToOne(() => Employee, (employee) => employee.attendances, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "employee_id" })
  employee: Employee;
}
