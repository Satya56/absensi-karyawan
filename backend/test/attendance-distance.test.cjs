const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  ATTENDANCE_RADIUS_METERS,
  distanceMeters,
  isOutsideAttendanceRadius,
} = require("../dist/attendance/distance.js");

test("distance between identical coordinates is zero", () => {
  assert.equal(distanceMeters(-6.2088, 106.8456, -6.2088, 106.8456), 0);
});

test("distance calculation uses the expected earth-scale distance", () => {
  const oneDegreeAtEquator = distanceMeters(0, 0, 0, 1);

  assert.ok(oneDegreeAtEquator > 111000);
  assert.ok(oneDegreeAtEquator < 112000);
});

test("attendance is flagged only when it exceeds the 2 km radius", () => {
  assert.equal(ATTENDANCE_RADIUS_METERS, 2000);
  assert.equal(isOutsideAttendanceRadius(2000), false);
  assert.equal(isOutsideAttendanceRadius(2000.01), true);
});
