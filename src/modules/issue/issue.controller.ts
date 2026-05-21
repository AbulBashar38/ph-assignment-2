import type { Request, Response } from "express";
import sendResponse from "../../utility/sendResponse.js";
import { issueService } from "./issue.service.js";
import type { ISSUE_TYPE, ISSUE_STATUS } from "./issue.interface.js";

const createIssue = async (req: Request, res: Response) => {
  try {
    const { title, description, type } = req.body;
    const reporter_id = req.user!.id!;

    const issue = await issueService.createIssueIntoDB({
      title,
      description,
      type: type as ISSUE_TYPE,
      reporter_id,
    });

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Issue created successfully",
      data: issue,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

const getAllIssues = async (req: Request, res: Response) => {
  try {
    const { sort, type, status } = req.query;

    const issues = await issueService.getAllIssuesFromDB({
      sort: sort as "newest" | "oldest" | undefined,
      type: type as ISSUE_TYPE | undefined,
      status: status as ISSUE_STATUS | undefined,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issues retrieved successfully",
      data: issues,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
};