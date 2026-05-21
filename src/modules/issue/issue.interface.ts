export const SORT_OPTION = {
  newest: "newest",
  oldest: "oldest",
} as const;

export type SORT_OPTION = (typeof SORT_OPTION)[keyof typeof SORT_OPTION];

export const ISSUE_TYPE = {
  bug: "bug",
  feature_request: "feature_request",
} as const;

export const ISSUE_STATUS = {
  open: "open",
  in_progress: "in_progress",
  resolved: "resolved",
} as const;

export type ISSUE_TYPE = (typeof ISSUE_TYPE)[keyof typeof ISSUE_TYPE];
export type ISSUE_STATUS = (typeof ISSUE_STATUS)[keyof typeof ISSUE_STATUS];

export interface IIssue {
  id: number;
  title: string;
  description: string;
  type: ISSUE_TYPE;
  status: ISSUE_STATUS;
  reporter_id: number;
  created_at: string;
  updated_at: string;
}

export interface IGetAllIssuesQuery {
  sort?: SORT_OPTION | undefined;
  type?: ISSUE_TYPE | undefined;
  status?: ISSUE_STATUS | undefined;
}

export interface IReporterInfo {
  id: number;
  name: string;
  role: string;
}

export interface ICreateIssuePayload {
  title: string;
  description: string;
  type: ISSUE_TYPE;
  reporter_id: number;
}

export interface IIssueWithReporter extends Omit<IIssue, "reporter_id"> {
  reporter: IReporterInfo;
}
