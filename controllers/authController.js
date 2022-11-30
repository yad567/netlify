import User from "../models/User.js";
import { BadRequestError, UnAuthenticatedError } from "../errors/index.js";

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      next(new BadRequestError("Please provide all values"));
    }
    const userAlreadyExists = await User.findOne({ email }).select("+password");
    if (userAlreadyExists) {
      next(new BadRequestError("Email already in use"));
    }
    const user = await User.create({ name, email, password });
    const token = user.createJWT();
    res.status(201).json({
      user: {
        email: user.email,
        lastName: user.lastName,
        location: user.location,
        name: user.name,
      },
      token,
      location: user.location

    });
  } catch (error) {
    next(error);
  }
};
const login = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError("Please provide all values");
  }
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new UnAuthenticatedError("Invalid Credentials not user"));
  }
  const isPasswordCorrect = await user.comparePassword(password);
  if (!isPasswordCorrect) {
    return next(
      new UnAuthenticatedError("Invalid Credentials pass not correct")
    );
  }
  const token = user.createJWT();
  user.password = undefined;
  return res.status(200).json({ user, token, location: user.location });
};
const updateUser = async (req, res, next) => {
  const { email, name, lastName, location } = req.body;
  if (!email || !name || !lastName || !location) {
    return next(new BadRequestError("Please provide all values"));
  }

  const user = await User.findOne({ _id: req.user.userId });

  user.email = email;
  user.name = name;
  user.lastName = lastName;
  user.location = location;

  await user.save();

  const token = user.createJWT();

  return res.status(200).json({ user, token, location: user.location });

  // to run the pre function
  try {
    user.save();
  } catch (error) {
    console.log(error.message);
  }
};

export { register, login, updateUser };
