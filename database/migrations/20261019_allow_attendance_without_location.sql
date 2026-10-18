-- Existing attendance tables can now store a missing location and flag it for HR.
ALTER TABLE attendances
  MODIFY attendance_longitude DECIMAL(10, 7) NULL,
  MODIFY attendance_latitude DECIMAL(10, 7) NULL,
  ADD COLUMN location_unavailable BOOLEAN NOT NULL DEFAULT FALSE,
  ADD CONSTRAINT chk_attendances_location_pair
    CHECK ((attendance_latitude IS NULL) = (attendance_longitude IS NULL));
