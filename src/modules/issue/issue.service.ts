import { pool } from "../../db/index.js";
import {
  ISSUE_STATUS,
  ISSUE_TYPE,
  SORT_OPTION,
  type ICreateIssuePayload,
  type IGetAllIssuesQuery,
  type IIssue,
  type IIssueWithReporter,
  type IReporterInfo,
} from "./issue.interface.js";

const createIssueIntoDB = async (payload: ICreateIssuePayload) => {
  const { title, description, type, reporter_id } = payload;

  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id) 
     VALUES ($1, $2, $3, $4) 
     RETURNING *`,
    [title, description, type, reporter_id],
  );

  return result.rows[0];
};

const getAllIssuesFromDB = async (query: IGetAllIssuesQuery) => {
  const { sort, type, status } = query;

  if (
    sort !== undefined &&
    sort !== SORT_OPTION.newest &&
    sort !== SORT_OPTION.oldest
  ) {
    throw new Error(
      `Invalid sort value. Must be '${SORT_OPTION.newest}' or '${SORT_OPTION.oldest}'`,
    );
  }

  if (
    type !== undefined &&
    type !== ISSUE_TYPE.bug &&
    type !== ISSUE_TYPE.feature_request
  ) {
    throw new Error(
      `Invalid type value. Must be '${ISSUE_TYPE.bug}' or '${ISSUE_TYPE.feature_request}'`,
    );
  }

  if (
    status !== undefined &&
    status !== ISSUE_STATUS.open &&
    status !== ISSUE_STATUS.in_progress &&
    status !== ISSUE_STATUS.resolved
  ) {
    throw new Error(
      `Invalid status value. Must be '${ISSUE_STATUS.open}', '${ISSUE_STATUS.in_progress}', or '${ISSUE_STATUS.resolved}'`,
    );
  }

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (type) {
    conditions.push(`type = $${paramIndex++}`);
    values.push(type);
  }

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const orderClause = sort === SORT_OPTION.oldest ? "ASC" : "DESC";

  const issuesResult = await pool.query(
    `SELECT * FROM issues ${whereClause} ORDER BY created_at ${orderClause}`,
    values,
  );

  if (issuesResult.rows.length === 0) {
    return [];
  }

  const reporterIds = issuesResult.rows.map((issue) => issue.reporter_id);
  const uniqueIds = [...new Set(reporterIds)];

  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [uniqueIds],
  );

  const reportersMap = new Map<number, IReporterInfo>();
  reportersResult.rows.forEach((reporter) => {
    reportersMap.set(reporter.id, {
      id: reporter.id,
      name: reporter.name,
      role: reporter.role,
    });
  });

  const issues: IIssueWithReporter[] = issuesResult.rows.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reportersMap.get(issue.reporter_id) || {
      id: 0,
      name: "Unknown",
      role: "unknown",
    },
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  return issues;
};

const getSingleIssueFromDB = async (
  id: number,
): Promise<IIssueWithReporter> => {
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id,
  ]);

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

  const reporterResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = $1`,
    [issue.reporter_id],
  );

  const reporter = reporterResult.rows[0];

  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reporter
      ? { id: reporter.id, name: reporter.name, role: reporter.role }
      : { id: 0, name: "Unknown", role: "unknown" },
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  };
};

interface IUpdateIssuePayload {
  title?: string;
  description?: string;
  type?: ISSUE_TYPE;
}

interface IUserInfo {
  id: number;
  role: string;
}

const updateIssueIntoDB = async (
  id: number,
  payload: IUpdateIssuePayload,
  user: IUserInfo,
): Promise<IIssue> => {
  // Fetch the issue first
  const issueResult = await pool.query(`SELECT * FROM issues WHERE id = $1`, [
    id,
  ]);

  if (issueResult.rows.length === 0) {
    throw new Error("Issue not found");
  }

  const issue = issueResult.rows[0];

  // Permission check: maintainer can update any, contributor can only update own if status is open
  if (user.role === "contributor") {
    if (issue.reporter_id !== user.id) {
      throw new Error("You can only update your own issues");
    }
    if (issue.status !== "open") {
      throw new Error("You can only update issues with status 'open'");
    }
  }

  // Build dynamic update query
  const updates: string[] = [];
  const values: any[] = [];
  let paramIndex = 1;

  if (payload.title) {
    updates.push(`title = $${paramIndex++}`);
    values.push(payload.title);
  }
  if (payload.description) {
    updates.push(`description = $${paramIndex++}`);
    values.push(payload.description);
  }
  if (payload.type) {
    updates.push(`type = $${paramIndex++}`);
    values.push(payload.type);
  }

  if (updates.length === 0) {
    throw new Error("No fields to update");
  }

  updates.push(`updated_at = NOW()`);
  values.push(id);

  const result = await pool.query(
    `UPDATE issues SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );

  return result.rows[0];
};

const deleteIssueIntoDB = async (id: number): Promise<void> => {
  const result = await pool.query(
    `DELETE FROM issues WHERE id = $1 RETURNING id`,
    [id],
  );

  if (result.rows.length === 0) {
    throw new Error("Issue not found");
  }
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueIntoDB,
};
