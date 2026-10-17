import "dotenv/config";
import "reflect-metadata";
import { randomUUID } from "crypto";
import { hash } from "bcrypt";
import { DataSource } from "typeorm";
import { Employee } from "./entities/employee.entity";
import { Role } from "./entities/role.entity";
import { EmployeeRole } from "./entities/employee-role.entity";
import { Attendance } from "./entities/attendance.entity";

async function seed() {
  const required = [
    "BOOTSTRAP_HR_NAME",
    "BOOTSTRAP_HR_EMAIL",
    "BOOTSTRAP_HR_PASSWORD",
    "BOOTSTRAP_HR_BIRTH_DATE",
    "BOOTSTRAP_HR_ADDRESS",
    "BOOTSTRAP_HR_LATITUDE",
    "BOOTSTRAP_HR_LONGITUDE",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length)
    throw new Error(
      `Set the bootstrap HR account fields in .env: ${missing.join(", ")}`,
    );
  const db = new DataSource({
    type: "mysql",
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    username: process.env.DB_USERNAME || "attendance",
    password: process.env.DB_PASSWORD || "attendance",
    database: process.env.DB_DATABASE || "attendance",
    timezone: "Z",
    entities: [Employee, Role, EmployeeRole, Attendance],
    synchronize: process.env.DB_SYNC === "true",
    logging: false,
  });
  await db.initialize();
  try {
    const roles = db.getRepository(Role);
    const employees = db.getRepository(Employee);
    const links = db.getRepository(EmployeeRole);
    let role = await roles.findOne({ where: { role_name: "human-resources" } });
    if (!role)
      role = await roles.save(
        roles.create({ role_id: randomUUID(), role_name: "human-resources" }),
      );
    if (!(await roles.exists({ where: { role_name: "employee" } })))
      await roles.save(
        roles.create({ role_id: randomUUID(), role_name: "employee" }),
      );
    const email = process.env.BOOTSTRAP_HR_EMAIL!.toLowerCase();
    let employee = await employees.findOne({ where: { email } });
    if (!employee) {
      employee = await employees.save(
        employees.create({
          employee_id: randomUUID(),
          name: process.env.BOOTSTRAP_HR_NAME!,
          email,
          password: await hash(process.env.BOOTSTRAP_HR_PASSWORD!, 12),
          birth_date: process.env.BOOTSTRAP_HR_BIRTH_DATE!,
          address: process.env.BOOTSTRAP_HR_ADDRESS!,
          address_latitude: Number(process.env.BOOTSTRAP_HR_LATITUDE),
          address_longitude: Number(process.env.BOOTSTRAP_HR_LONGITUDE),
          role,
        }),
      );
      await links.save(
        links.create({
          employee_id: employee.employee_id,
          role_id: role.role_id,
        }),
      );
    } else {
      employee.role = role;
      await employees.save(employee);
      const link = await links.findOne({
        where: { employee_id: employee.employee_id },
      });
      if (link)
        await links.update(
          { employee_id: employee.employee_id },
          { role_id: role.role_id },
        );
      else
        await links.save(
          links.create({
            employee_id: employee.employee_id,
            role_id: role.role_id,
          }),
        );
    }
  } finally {
    await db.destroy();
  }
}
seed().catch(() => {
  process.stderr.write(
    "HR bootstrap failed. Check required configuration and database availability.\n",
  );
  process.exitCode = 1;
});
