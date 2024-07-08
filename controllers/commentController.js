import Comment from '../models/commentModel.js';
import catchAsync from '../utils/catchAsync.js';
import { deleteOne, getAll, getOne, updateOne } from './handlerFactory.js';

export const createComment = catchAsync(async (req, res, next) => {
  const newComment = await Comment.create({
    text: req.body.text,
    news: req.params.id,
    user: req.user.id,
  });

  res.status(201).json({
    status: 'success',
    data: {
      comment: newComment,
    },
  });
});

export const getAllComments = getAll(Comment);

export const getComment = getOne(Comment);

export const updateComment = updateOne(Comment, { checkAuthor: true });

export const deleteComment = deleteOne(Comment, { checkAuthor: true });
