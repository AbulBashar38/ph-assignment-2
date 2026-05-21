export const USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer",
} as const;

export type ROLES = "contributor" | "maintainer";

export const ISSUE_STATUS = {
  open: "open",
  in_progress: "in_progress",
  resolved: "resolved",
} as const;

export type ISSUE_STATUS_TYPE = "open" | "in_progress" | "resolved";

export interface IUser {
  id: number;
  name: string;
  email: string;
  password: string;
  role: ROLES;
  created_at: string;
  updated_at: string;
}




