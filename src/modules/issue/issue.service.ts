import { pool } from "../../db/index.js";
import type {
  IIssue,
  ISSUE_TYPE,
  ISSUE_STATUS,
  IGetAllIssuesQuery,
  IReporterInfo,
  IIssueWithReporter,
} from "./issue.interface.js";

const createIssueIntoDB = async (payload: {
  title: string;
  description: string;
  type: ISSUE_TYPE;
  reporter_id: number;
}) => {
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
  const { sort = "newest", type, status } = query;

  // Build WHERE clause dynamically
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

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // Determine order
  const orderClause = sort === "oldest" ? "ASC" : "DESC";

  // Fetch issues
  const issuesResult = await pool.query(
    `SELECT * FROM issues ${whereClause} ORDER BY created_at ${orderClause}`,
    values,
  );

  if (issuesResult.rows.length === 0) {
    return [];
  }

  // Fetch reporters for all issues in one query
  const reporterIds = issuesResult.rows.map((issue) => issue.reporter_id);
  const uniqueIds = [...new Set(reporterIds)];

  const reportersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1)`,
    [uniqueIds],
  );

  // Create a map of reporters by id
  const reportersMap = new Map<number, IReporterInfo>();
  reportersResult.rows.forEach((reporter) => {
    reportersMap.set(reporter.id, {
      id: reporter.id,
      name: reporter.name,
      role: reporter.role,
    });
  });

  // Map issues with their reporter info
  const issues: IIssueWithReporter[] = issuesResult.rows.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: reportersMap.get(issue.reporter_id) || { id: 0, name: "Unknown", role: "unknown" },
    created_at: issue.created_at,
    updated_at: issue.updated_at,
  }));

  return issues;
};

export const issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
};