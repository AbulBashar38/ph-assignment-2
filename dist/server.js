
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import cors from "cors";
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.service.ts
import { compare, hash } from "bcrypt-ts";
import jwt from "jsonwebtoken";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING,
  port: process.env.PORT,
  secret: process.env.JWT_SECRET
};
var config_default = config;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var intDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      name VARCHAR(20),
      email VARCHAR(20) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'contributor' CHECK(role IN ('contributor', 'maintainer')),

      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
      )
      `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS issues(
        id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL,
        description TEXT NOT NULL,
        type VARCHAR(20) NOT NULL CHECK(type IN ('bug', 'feature_request')),
        status VARCHAR(20) DEFAULT 'open' CHECK(status IN ('open', 'in_progress', 'resolved')),
        reporter_id INT,

        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
    console.log("database connected successfully");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const existingUser = await pool.query(`SELECT * FROM users WHERE email=$1`, [
    email
  ]);
  if (existingUser.rows.length > 0) {
    throw new Error("User already exists!");
  }
  const hashedPassword = await hash(password, 10);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [name, email, hashedPassword, role]
  );
  if (result.rows.length === 0) {
    throw new Error("Failed to create user!");
  }
  const user = result.rows[0];
  delete user.password;
  return user;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `
        SELECT * FROM users WHERE email=$1
        `,
    [email]
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
    email: user.email
  };
  const accessToken = jwt.sign(jwtPayload, config_default.secret, {
    expiresIn: "1d"
  });
  return {
    token: accessToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  loginUserIntoDB,
  registerUserIntoDB
};

// src/modules/auth/auth.controller.ts
var registerUser = async (req, res) => {
  try {
    const user = await authService.registerUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: user
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  registerUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issue/issue.route.ts
import { Router as Router2 } from "express";

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    console.log(roles);
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access!!"
        });
      }
      const decoded = jwt2.verify(
        token,
        config_default.secret
      );
      const userData = await pool.query(
        `
     SELECT * FROM users WHERE email=$1   
        `,
        [decoded.email]
      );
      const user = userData.rows[0];
      if (userData.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!"
        });
      }
      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden!!,This role have no access!"
        });
      }
      req.user = decoded;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/modules/issue/issue.interface.ts
var SORT_OPTION = {
  newest: "newest",
  oldest: "oldest"
};
var ISSUE_TYPE = {
  bug: "bug",
  feature_request: "feature_request"
};
var ISSUE_STATUS = {
  open: "open",
  in_progress: "in_progress",
  resolved: "resolved"
};

// src/modules/issue/issue.service.ts
var createIssueIntoDB = async (payload) => {
  const { title, description, type, reporter_id } = payload;
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [title, description, type, reporter_id]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (query) => {
  const { sort, type, status } = query;
  if (sort !== void 0 && sort !== SORT_OPTION.newest && sort !== SORT_OPTION.oldest) {
    throw new Error(
      `Invalid sort value. Must be '${SORT_OPTION.newest}' or '${SORT_OPTION.oldest}'`
    );
  }
  if (type !== void 0 && type !== ISSUE_TYPE.bug && type !== ISSUE_TYPE.feature_request) {
    throw new Error(
      `Invalid type value. Must be '${ISSUE_TYPE.bug}' or '${ISSUE_TYPE.feature_request}'`
    );
  }
  if (status !== void 0 && status !== ISSUE_STATUS.open && status !== ISSUE_STATUS.in_progress && status !== ISSUE_STATUS.resolved) {
    throw new Error(
      `Invalid status value. Must be '${ISSUE_STATUS.open}', '${ISSUE_STATUS.in_progress}', or '${ISSUE_STATUS.resolved}'`
    );
  }
  const conditions = [];
  const values = [];
  let paramIndex = 1;
  if (type) {
    conditions.push(`type = $${paramIndex++}`);
    values.push(type);
  }
  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderClause = sort === SORT_OPTION.oldest ? "ASC" : "DESC";
  const issuesResult = await pool.query(
    `SELECT * FROM issues ${whereClause} ORDER BY created_at ${orderClause}`,
    values
  );
  if (issuesResult.rows.length === 0) {
    return [];
  }
  const reporterIds = issuesResult.rows.map((issue) => issue.reporter_id);
  const uniqueIds = [...new Set(reporterIds)];
  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [uniqueIds]
  );
  const reportersMap = /* @__PURE__ */ new Map();
  reportersResult.rows.forEach((reporter) => {
    reportersMap.set(reporter.id, {
      id: reporter.id,
      name: reporter.name,
      role: reporter.role
    });
  });
  const issues = issuesResult.rows.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reportersMap.get(issue.reporter_id) || {
      id: 0,
      name: "Unknown",
      role: "unknown"
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
  return issues;
};
var getSingleIssueFromDB = async (id) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id
  ]);
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id]
  );
  const reporter = reporterResult.rows[0];
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporter ? { id: reporter.id, name: reporter.name, role: reporter.role } : { id: 0, name: "Unknown", role: "unknown" },
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueIntoDB = async (id, payload, user) => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id
  ]);
  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const issue = issueResult.rows[0];
  if (user.role === USER_ROLE.contributor) {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can only update your own issues");
    }
    if (issue.status !== "open") {
      throw new Error("You can only update issues with status 'open'");
    }
  }
  if (payload.type !== void 0 && payload.type !== ISSUE_TYPE.bug && payload.type !== ISSUE_TYPE.feature_request) {
    throw new Error(
      `Invalid type value. Must be '${ISSUE_TYPE.bug}' or '${ISSUE_TYPE.feature_request}'`
    );
  }
  const result = await pool.query(
    `UPDATE issues 
     SET 
       title = COALESCE($1, title),
       description = COALESCE($2, description),
       type = COALESCE($3, type),
       updated_at = NOW() 
     WHERE id = $4 
     RETURNING *`,
    [
      payload.title ?? null,
      payload.description ?? null,
      payload.type ?? null,
      id
    ]
  );
  return result.rows[0];
};
var deleteIssueIntoDB = async (id) => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING id`,
    [id]
  );
  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueIntoDB
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  try {
    const { title, description, type } = req.body;
    const reporter_id = req.user.id;
    const issue = await issueService.createIssueIntoDB({
      title,
      description,
      type,
      reporter_id
    });
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: issue
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var getAllIssues = async (req, res) => {
  try {
    const { sort, type, status } = req.query;
    const issues = await issueService.getAllIssuesFromDB({
      sort,
      type,
      status
    });
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: issues
    });
  } catch (error) {
    const statusCode = error.message.includes("Invalid") ? 400 : 500;
    sendResponse_default(res, {
      statusCode,
      success: false,
      message: error.message
    });
  }
};
var getSingleIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const issue = await issueService.getSingleIssueFromDB(Number(id));
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: issue
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 404,
      success: false,
      message: error.message
    });
  }
};
var updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const issue = await issueService.updateIssueIntoDB(Number(id), req.body, user);
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: issue
    });
  } catch (error) {
    const statusCode = error.message === "Issue not found" ? 404 : 403;
    sendResponse_default(res, {
      statusCode,
      success: false,
      message: error.message
    });
  }
};
var deleteIssue = async (req, res) => {
  try {
    const { id } = req.params;
    await issueService.deleteIssueIntoDB(Number(id));
    sendResponse_default(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: error.message === "Issue not found" ? 404 : 500,
      success: false,
      message: error.message
    });
  }
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/modules/issue/issue.route.ts
var router2 = Router2();
router2.get("/", issueController.getAllIssues);
router2.get("/:id", issueController.getSingleIssue);
router2.patch("/:id", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.updateIssue);
router2.delete("/:id", auth_default(USER_ROLE.maintainer), issueController.deleteIssue);
router2.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.createIssue);
var issueRoute = router2;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express();
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000/" }));
app.use("/api/auth", authRoute);
app.use("/api/issues", issueRoute);
app.get("/", (req, res) => {
  res.status(200).json({
    message: "DevPulse Server is running"
  });
});
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var main = () => {
  intDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map