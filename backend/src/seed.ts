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
seed().catch((error: unknown) => {
  if (
    error instanceof Error &&
    error.message.startsWith("Set the bootstrap HR account fields")
  ) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
    return;
  }

  const errorObject =
    typeof error === "object" && error !== null
      ? (error as {
          code?: unknown;
          driverError?: { code?: unknown; message?: unknown };
          name?: unknown;
        })
      : undefined;
  const possibleCode = errorObject?.code ?? errorObject?.driverError?.code;
  const safeCode =
    typeof possibleCode === "string" && /^[A-Z0-9_]+$/.test(possibleCode)
      ? possibleCode
      : undefined;
  const databaseMessage = errorObject?.driverError?.message;
  const invalidDefaultColumn =
    safeCode === "ER_INVALID_DEFAULT" && typeof databaseMessage === "string"
      ? /^Invalid default value for ['`]?([A-Za-z0-9_]+)['`]?$/.exec(
          databaseMessage,
        )?.[1]
      : undefined;

  if (safeCode) {
    const detail = invalidDefaultColumn
      ? ` MySQL rejected the default for the “${invalidDefaultColumn}” column.`
      : "";
    process.stderr.write(
      `HR bootstrap failed with error code ${safeCode}.${detail} Check MySQL availability, the schema, and the DB_* values in backend/.env. No credentials or employee details were logged.\n`,
    );
  } else {
    const errorName =
      typeof errorObject?.name === "string" &&
      /^[A-Za-z][A-Za-z0-9]*$/.test(errorObject.name)
        ? errorObject.name
        : "UnknownError";
    process.stderr.write(
      `HR bootstrap failed (${errorName}). Check backend/.env and the MySQL schema. No credentials or employee details were logged.\n`,
    );
  }

  process.exitCode = 1;
});
