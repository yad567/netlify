import Job from "../models/Job.js";
import {
  BadRequestError,
  NotFoundError,
  UnAuthenticatedError,
} from "../errors/index.js";
import checkPermissions from "../utils/checkPermissions.js";
import mongoose from "mongoose";
import moment from "moment";

const createJob = async (req, res, next) => {
  const { position, company } = req.body;

  if (!position || !company) {
    return next(new BadRequestError("گەمژە provide all values"));
  }

  req.body.createdBy = req.user.userId;

  const job = await Job.create(req.body);
  res.status(200).json({ job });
};

const getAllJobs = async (req, res) => {
  const { status, jobType, sort, search } = req.query;

  const queryObject = {
    createdBy: req.user.userId,
  };

  // add stuff based on condition
  if (status && status !== "all") {
    queryObject.status = status;
  }

  if (jobType && jobType !== "all") {
    queryObject.jobType = jobType;
  }

  if (search) {
    queryObject.position = { $regex: search, $options: "i" };
  }

  // No await
  let result = Job.find(queryObject);

  //chain sot condition
  if (sort === "latest") {
    result = result.sort("-createdAt");
  }
  if (sort === "oldest") {
    result = result.sort("createdAt");
  }
  if (sort === "a-z") {
    result = result.sort("position");
  }
  if (sort === "z-a") {
    result = result.sort("-position");
  }

  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  result = result.skip(skip).limit(limit);

  const jobs = await result;

  const totalJobs = await Job.countDocuments(queryObject);
  const numOfPages = Math.ceil(totalJobs / limit);

  res.status(200).json({ jobs, totalJobs, numOfPages });
};
const updateJob = async (req, res, next) => {
  const { id: jobId } = req.params;
  const { company, position } = req.body;

  if (!position || !company) {
    return next(new BadRequestError("گەمژە provide all values"));
  }

  const job = await Job.findOne({ _id: jobId });
  if (!job) {
    return next(new NotFoundError(`No job with the ID : ${jobId}`));
  }

  // check permissions
  // console.log(req.user.userId);
  // console.log(job.createdBy);

  checkPermissions(req.user, job.createdBy, next);

  const updatedJob = await Job.findOneAndUpdate({ _id: jobId }, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ job });
};
const deleteJob = async (req, res, next) => {
  const { id: jobId } = req.params;

  const job = await Job.findOne({ _id: jobId });

  if (!job) {
    return next(new NotFoundError(`No job with id : ${jobId}`));
  }

  checkPermissions(req.user, job.createdBy, next);

  await job.remove();
  res.status(200).json({ msg: "Success! Job removed" });
};

const showStats = async (req, res) => {
  let stats = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  stats = stats.reduce((acc, curr) => {
    const { _id: title, count } = curr;
    acc[title] = count;
    return acc;
  }, {});

  const defaultStats = {
    pending: stats.pending || 0,
    interview: stats.interview || 0,
    declined: stats.declined || 0,
  };
  let monthlyApplications = await Job.aggregate([
    { $match: { createdBy: mongoose.Types.ObjectId(req.user.userId) } },
    {
      $group: {
        _id: {
          year: {
            $year: "$createdAt",
          },
          month: {
            $month: "$createdAt",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 6 },
  ]);

  monthlyApplications = monthlyApplications
    .map((item) => {
      const {
        _id: { year, month },
        count,
      } = item;
      // accepts 0-11
      const date = moment()
        .month(month - 1)
        .year(year)
        .format("MMM Y");
      return { date, count };
    })
    .reverse();

  res.status(200).json({ defaultStats, monthlyApplications });
};

export { createJob, updateJob, deleteJob, showStats, getAllJobs };
