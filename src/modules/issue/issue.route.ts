import { Router } from "express";
import auth from "../../middleware/auth.js";
import { issueController } from "./issue.controller.js";
import { USER_ROLE } from "../../types/index.js";

const router = Router();

router.get("/", issueController.getAllIssues);
router.post("/", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.createIssue);

export const issueRoute = router;