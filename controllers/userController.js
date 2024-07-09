import cloudinary from '../cloud/index.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import {
  createOne,
  deleteOne,
  getAll,
  getOne,
  updateOne,
} from './handlerFactory.js';

export const getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

export const updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword route.',
        400,
      ),
    );
  }
  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const userDetails = {
    name: req.body.name[0],
    about: req.body.about[0],
  };

  const { photo } = req.files;

  if (photo) {
    // if there is already an avatar file, we want to remove that publicId
    if (req.user.photo.publicId) {
      await cloudinary.uploader.destroy(req.user.photo.publicId);
    }

    // upload new photo file
    const { secure_url: url, public_id: publicId } =
      await cloudinary.uploader.upload(photo[0].filepath, {
        width: 300,
        height: 300,
        crop: 'thumb',
        gravity: 'face',
      });

    userDetails.photo = { url, publicId };
  }

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, userDetails, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

export const deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

export const getUser = catchAsync(async (req, res) => {
  const doc = await User.findById(req.params.id).populate(['posts']);

  if (!doc) {
    return res.status(404).json({
      status: 'fail',
      message: 'No User was found with that ID',
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
});

// Perfoming CRUD operations on user data (Only for Admins)
export const createUser = createOne(User);
export const getAllUsers = getAll(User);
export const updateUser = updateOne(User);
export const deleteUser = deleteOne(User);
