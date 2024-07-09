import cloudinary from '../cloud/index.js';
import News from '../models/newsModel.js';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import { deleteOne, getAll, getOne, updateOne } from './handlerFactory.js';

export const createNews = catchAsync(async (req, res) => {
  const newsDetails = {
    title: req.body.title[0],
    summary: req.body.summary[0],
    tags: req.body.tags[0].split(' '),
    content: req.body.content[0],
  };

  const { coverImage } = req.files;

  if (coverImage) {
    // upload new photo file
    const { secure_url: url, public_id: publicId } =
      await cloudinary.uploader.upload(coverImage[0].filepath, {
        width: 1000,
        height: 420,
        crop: 'thumb',
        gravity: 'face',
      });

    newsDetails.coverImage = { url, publicId };
  }

  const news = await News.create({ ...newsDetails, author: req.user.id });

  const user = await User.findById(req.user.id);
  await User.findByIdAndUpdate(req.params.id, {
    posts: [...user.posts, news._id],
  });

  res.status(201).json({
    status: 'success',
    data: {
      news,
    },
  });
});

export const updateNews = catchAsync(async (req, res, next) => {
  const post = await News.findById(req.params.id);

  if (!post) {
    return next(new AppError('No post found with that ID', 404));
  }

  const authorId = post.author && post.author._id.toString();
  const userId = req.user && req.user._id.toString();

  // Check if the logged-in user is the author of the post post
  if (authorId !== userId) {
    return next(
      new AppError('You do not have permission to update this post post', 403),
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const postDetails = {
    title: req.body.title[0],
    summary: req.body.summary[0],
    tags: req.body.tags[0].split(' '),
    content: req.body.content[0],
  };

  const { coverImage } = req.files;

  if (coverImage) {
    // if there is already a coverImage file, we want to remove that.
    if (post.coverImage.publicId) {
      await cloudinary.uploader.destroy(post.coverImage.publicId);
    }

    // upload new CoverImage file
    const { secure_url: url, public_id: publicId } =
      await cloudinary.uploader.upload(coverImage[0].filepath, {
        width: 1000,
        height: 420,
        crop: 'thumb',
        gravity: 'face',
      });

    postDetails.coverImage = { url, publicId };
  }

  // 3) Update Post document
  const updatedPost = await News.findByIdAndUpdate(req.params.id, postDetails, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: updatedPost,
  });
});

export const deleteNews = deleteOne(News, { checkAuthor: true });

export const getAllNews = getAll(News);
export const getNews = getOne(News);
