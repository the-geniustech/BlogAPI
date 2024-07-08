import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import { config } from 'dotenv';

import cloudinary from '../cloud/index.js';
import catchAsync from '../utils/catchAsync.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import sendEmail from '../utils/email.js';

config({ path: './config.env' });

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Remove password from the output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

export const signup = catchAsync(async (req, res, next) => {
  const userDetails = {
    name: req.body.name[0],
    email: req.body.email[0],
    about: req.body?.about?.[0],
    password: req.body.password[0],
    passwordConfirm: req.body.passwordConfirm[0],
  };
  const { photo } = req.files;

  if (photo) {
    // upload new photo file
    const { secure_url: url, public_id: publicId } =
      await cloudinary.uploader.upload(photo[0].filepath, {
        width: 300,
        height: 300,
        crop: 'thumb',
        gravity: 'face',
      });

    userDetails.photo = { url, publicId };
  } else{
    userDetails.photo = { url: "/default-user.jpg", publicId: null };
  }

  const user = await User.create(userDetails);

  createSendToken(user, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // Check if email and password exist
  if (!email || !password)
    return next(new AppError('Please provide email and password!', 400));

  // Check if user exist and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password)))
    return next(new AppError('Incorrect email or password', 401));

  // If everything is ok then send token to client
  createSendToken(user, 200, res);
});

export const logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

export const protect = catchAsync(async (req, res, next) => {
  // Getting token if it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];

  if (!token)
    return next(
      new AppError('You are not logged in! Please login to get access', 401),
    );

  // Verification token
  const decodedToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET,
  );

  // Check if user still exist
  const currentUser = await User.findById(decodedToken.id);
  if (!currentUser)
    return next(
      new AppError('The user belonging to this token is no longer exist', 401),
    );

  // Check if user changed password after token was issued
  if (currentUser.changedPasswordAfter(decodedToken.iat))
    return next(
      new AppError('User recently changed password! Please login again', 401),
    );

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

// Middleware that Restricts access to certain routes based on user roles.
export const restrictTo =
  (...role) =>
  (req, res, next) => {
    // Roles ['admin', 'lead', 'lead-guide']
    if (!role.includes(req.user.role))
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );

    next();
  };

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the POSTed Email
  const user = await User.findOne({ email: req.body.email });
  if (!user)
    return next(new AppError('There is no user with this email address', 404));

  // 2) Generate random reset token createPasswordResetToken
  const resetToken = user.createPasswordResetToken();
  const userNew = await user.save({ validateBeforeSave: false });

  // 3) Sending an email to the user with instructions and a reset URL, and returning a success response to the client.
  const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10)',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
      resetToken,
      userNew,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    next(
      new AppError('There was an error sending the email. Try again later!'),
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token passwordResetExpires: { $gt: Date.now() }
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetTokenExpires: { $gt: Date.now() },
  });

  // 2) Check if token has not expired and user exist
  if (!user) return next(new AppError('Token is invalid or has expired', 400));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetTokenExpires = undefined;
  await user.save();

  // 3) Log the user in, send JWT
  createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');
  console.log(req.body);

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  // 3) If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  // User.findByIdAndUpdate will NOT work as intended!

  // 4) Log user in, send JWT
  createSendToken(user, 200, res);
});
