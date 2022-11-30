import express from "express";
const router = express.Router();

import {
  createJob,
  updateJob,
  deleteJob,
  showStats,
  getAllJobs,
} from "../controllers/jobsController.js";

router.route("/").post(createJob).get(getAllJobs);
// remember about :id
router.route("/stats").get(showStats).get(getAllJobs);
router.route("/:id").delete(deleteJob).patch(updateJob);

export default router;
