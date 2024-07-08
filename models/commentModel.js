import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Comment cannot be empty'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    news: {
      type: mongoose.Schema.ObjectId,
      ref: 'News',
      required: [true, 'Comment must belong to a news post'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Comment must belong to a user'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Populate user details when fetching comments
commentSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });
  next();
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;
