import { compare, hash } from "bcrypt-ts";
import jwt from "jsonwebtoken";
import config from "../../config/index.js";
import { pool } from "../../db/index.js";
import type { ILoginPayload, ISignupPayload } from "../../types/index.js";

const registerUserIntoDB = async (payload: ISignupPayload) => {
  const { name, email, password, role } = payload;

  const existingUser = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email,
  ]);


  if (existingUser.rows.length > 0) {
    throw new Error("User already exists!");
  }

  const hashedPassword = await hash(password, 10);


  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [name, email, hashedPassword, role],
  );


  if (result.rows.length === 0) {
    throw new Error("Failed to create user!");
  }

  const user = result.rows[0];
  delete user.password;

  return user;
};

const loginUserIntoDB = async (payload: ILoginPayload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email],
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }

  const user = userData.rows[0];
  const matchPassword = await compare(password, user.password);

  if (!matchPassword) {
    throw new Error("Invalid Credentials!");
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role,
    is_active: user.is_active,
    email: user.email,
  };

  const accessToken = jwt.sign(jwtPayload, config.secret as string, {
    expiresIn: "1d",
  });

  return {
    token: accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
  };
};

export const authService = {
  loginUserIntoDB,
  registerUserIntoDB,
};
