import APIFeatures from '../utils/apiFeature.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

export const getAll = (Model) => async (req, res) => {
  const features = new APIFeatures(Model.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const docs = await features.query;

  res.status(200).json({
    status: 'success',
    results: docs.length,
    data: {
      docs,
    },
  });
};

export const getOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({
        status: 'fail',
        message: 'No document found with that ID',
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

export const createOne = (Model) =>
  catchAsync(async (req, res) => {
    const doc = await Model.create(req.body);

    res.status(201).json({
      status: 'success',
      data: {
        doc,
      },
    });
  });

export const updateOne = (Model, { checkAuthor } = { checkAuthor: false }) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    const author = doc.author && doc.author._id.toString();
    const user = req.user && req.user._id.toString();

    // Check if the logged-in user is the author of the doc post
    if (checkAuthor && author !== user) {
      return next(
        new AppError('You do not have permission to update this doc post', 403),
      );
    }

    const updatedDoc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      status: 'success',
      data: updatedDoc,
    });
  });

export const deleteOne = (Model, { checkAuthor } = { checkAuthor: false }) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findById(req.params.id);

    if (!doc) {
      return next(new AppError('No doc found with that ID', 404));
    }

    const authorId = doc.author && doc.author._id.toString();
    const userId = req.user._id && req.user._id.toString();

    // Check if the logged-in user is the author of the doc post
    if (checkAuthor && authorId !== userId) {
      return next(
        new AppError('You do not have permission to delete this doc post', 403),
      );
    }

    await Model.findByIdAndDelete(req.params.id);

    res.status(200).json({
      status: 'success',
      data: null,
    });
  });
