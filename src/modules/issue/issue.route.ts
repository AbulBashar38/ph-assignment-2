import { Router } from "express";
import auth from "../../middleware/auth.js";
import { issueController } from "./issue.controller.js";
import { USER_ROLE } from "../../types/index.js";

const router = Router();

router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getSingleIssue);
router.patch("/:id", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.updateIssue);
router.delete("/:id", auth(USER_ROLE.maintainer), issueController.deleteIssue);
router.post("/", auth(USER_ROLE.contributor, USER_ROLE.maintainer), issueController.createIssue);

export const issueRoute = router;