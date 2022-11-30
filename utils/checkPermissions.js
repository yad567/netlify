import { UnAuthenticatedError } from "../errors/index.js";

const checkPermissions = (requestUser, resourceUserId, next) => {
  if (requestUser.userId === resourceUserId.toString()) return;
  next(new UnAuthenticatedError("Not authorized to access this route"));
};

export default checkPermissions;
