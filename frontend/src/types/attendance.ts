export type User = { employee_id: string; name: string; email: string; role: string };
export type Entry = {
  attendance_id: string;
  employee_id?: string;
  employee_name?: string;
  email?: string;
  timestamp: string;
  is_clock_in: boolean;
  is_clock_out: boolean;
  distance_from_home_m?: number;
  outside_radius?: boolean;
  evidence_url: string;
};
export type Employee = {
  employee_id: string;
  name: string;
  email: string;
  birth_date: string;
  address: string;
  address_latitude: number;
  address_longitude: number;
  role_name: string;
};
