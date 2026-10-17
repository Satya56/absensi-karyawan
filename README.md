# Daymark — work from home attendance

Daymark is a full-stack attendance starter for remote teams. The API is NestJS + TypeScript with TypeORM/MySQL, and the browser app is React + TypeScript.

## Included

- Employee and human-resources sign-in with bcrypt password hashes and short-lived JWTs.
- HR employee create/edit and attendance review screens.
- Employee selfie and browser geolocation capture for daily clock-in and clock-out.
- HR review tag when a submission is more than 2 km from the employee’s registered home coordinates.
- Private photo storage on local disk, AWS S3, or Google Cloud Storage.
- `employees`, `attendances`, `roles`, and `employee_roles` tables with foreign keys. Each employee has a `role_id` and one unique employee-role link; HR updates keep the two role references aligned.
- No request-body, SQL, or employee-data logging. Framework logging is disabled, TypeORM query logging is off, errors returned to clients are sanitized, and photos are served only through an authenticated endpoint.

## Run locally

Requirements: Node.js 20+, npm, and Docker.

1. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`. Set `JWT_SECRET` in `backend/.env` to a long random value. Keep `DB_SYNC=true` for the local starter database.
2. Start MySQL with `docker compose up -d mysql`.
3. Install the API and web dependencies separately:

   ```bash
   npm install --prefix backend
   npm install --prefix frontend
   ```
4. Create the first HR account by filling these one-time values in `backend/.env`:

   ```dotenv
   BOOTSTRAP_HR_NAME=Your Name
   BOOTSTRAP_HR_EMAIL=hr@example.com
   BOOTSTRAP_HR_PASSWORD=use-a-long-temporary-password
   BOOTSTRAP_HR_BIRTH_DATE=1990-01-01
   BOOTSTRAP_HR_ADDRESS=Your registered home address
   BOOTSTRAP_HR_LATITUDE=-6.2088
   BOOTSTRAP_HR_LONGITUDE=106.8456
   ```

5. Run `npm run seed:hr`. Remove the `BOOTSTRAP_HR_*` secrets from `backend/.env` after the account is created.
6. Run `npm run dev` and open <http://localhost:5173>.

Run `npm run build` to build both applications and `npm test` to run the backend attendance-distance and geofence tests. Backend and frontend dependencies are installed separately from their package directories, keeping `backend/node_modules` and `frontend/node_modules` independent.

The browser needs camera and location permission. Browsers only permit these APIs on `localhost` or a secure HTTPS origin.

## Photo storage

`PHOTO_STORAGE=local` stores private files under `uploads/` and is suitable for development. For AWS, set `PHOTO_STORAGE=s3`, `AWS_REGION`, and `AWS_S3_BUCKET`; the AWS SDK uses the standard credential chain. For Google Cloud, set `PHOTO_STORAGE=gcs` and `GCP_BUCKET`; the Google SDK uses Application Default Credentials. Do not make the bucket public. The database stores the private object key, and the API streams each photo after checking that the caller owns the attendance record or has the HR role.

## Database and API

The TypeORM entities are in `backend/src/entities`. Set `DB_SYNC=false` in production and create/manage schema changes with migrations before deploying. `DB_SYNC=true` is intended only for local development. The API listens on port 3000 under `/api`.

The matching MySQL 8 schema is in [`database/schema.sql`](database/schema.sql). You can create the database and tables with `mysql -u root -p < database/schema.sql`; change the database connection values in `backend/.env` to match your MySQL setup. The SQL also inserts the employee and human-resources roles. The first HR employee account is created separately with the bootstrap instructions above.

- `POST /api/auth/login`
- `GET /api/attendances/mine`
- `POST /api/attendances/clock` (multipart `photo`, `latitude`, `longitude`, `is_clock_in`)
- `GET /api/attendances/review` (HR only)
- `GET /api/attendances/:id/photo` (record owner or HR)
- `GET /api/employees`, `POST /api/employees`, `PUT /api/employees/:id` (HR only)

## Privacy notes

Authentication and authorization never write employee values to logs. Do not add logging of request bodies, passwords, addresses, exact coordinates, uploaded file names, or object keys. Logs should contain only operational event codes and opaque request IDs. In production, use HTTPS, a private object bucket, secret-manager credentials, database backups with restricted access, regular dependency updates, and TypeORM migrations.
