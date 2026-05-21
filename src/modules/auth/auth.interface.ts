import type { IUser, ROLES } from "../../types/index.js";

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface ISignupPayload {
  name: string;
  email: string;
  password: string;
  role: ROLES;
}

