export interface IUser {
  id?: number;
  name: string;
  email: string;
  password: string;
  role: "contributor" | "maintainer";
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ILoginPayload {
  email: string;
  password: string;
}

export interface ISignupPayload {
  name: string;
  email: string;
  password: string;
  role: "contributor" | "maintainer";
}

export interface IAuthResponse {
  token?: string;
  user?: Omit<IUser, "password" | "is_active">;
}

