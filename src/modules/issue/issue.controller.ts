import type { Request, Response } from "express";
import sendResponse from "../../utility/sendResponse.js";
import { issueService } from "./issue.service.js";
import type { ISSUE_TYPE, ISSUE_STATUS, SORT_OPTION } from "./issue.interface.js";

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
      sort: sort as SORT_OPTION | undefined,
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
    const statusCode = error.message.includes("Invalid") ? 400 : 500;
    sendResponse(res, {
      statusCode,
      success: false,
      message: error.message,
    });
  }
};

const getSingleIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issue = await issueService.getSingleIssueFromDB(Number(id));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue retrieved successfully",
      data: issue,
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 404,
      success: false,
      message: error.message,
    });
  }
};

const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user as { id: number; role: string };

    const issue = await issueService.updateIssueIntoDB(Number(id), req.body, user);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue updated successfully",
      data: issue,
    });
  } catch (error: any) {
    const statusCode = error.message === "Issue not found" ? 404 : 403;
    sendResponse(res, {
      statusCode,
      success: false,
      message: error.message,
    });
  }
};

const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await issueService.deleteIssueIntoDB(Number(id));

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Issue deleted successfully",
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: error.message === "Issue not found" ? 404 : 500,
      success: false,
      message: error.message,
    });
  }
};

export const issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue,
};