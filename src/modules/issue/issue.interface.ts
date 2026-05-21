export type ISSUE_TYPE = "bug" | "feature_request";
export type ISSUE_STATUS = "open" | "in_progress" | "resolved";

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
  sort?: "newest" | "oldest" | undefined;
  type?: ISSUE_TYPE | undefined;
  status?: ISSUE_STATUS | undefined;
}

export interface IReporterInfo {
  id: number;
  name: string;
  role: string;
}

export interface IIssueWithReporter extends Omit<IIssue, "reporter_id"> {
  reporter: IReporterInfo;
}