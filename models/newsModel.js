import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'A news article must have a title'],
    trim: true,
    maxlength: [
      120,
      'A news article title must have less or equal than 120 characters',
    ],
    minlength: [
      10,
      'A news article title must have more or equal than 10 characters',
    ],
  },
  content: {
    type: String,
    required: [true, 'A news article must have content'],
    minlength: [
      100,
      'A news article content must have more than 500 characters',
    ],
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'A news article must have an author'],
  },
  publicationDate: {
    type: Date,
    default: Date.now,
  },
  categories: {
    type: [String],
    enum: ['Finance', 'Government', 'Sports', 'Education', 'Other'],
    required: [true, 'A news article must have at least one category'],
  },
  tags: {
    type: [String],
    default: [],
  },
  coverImage: {
    type: Object,
    url: String,
    publicId: String,
  },
  summary: {
    type: String,
    trim: true,
    maxlength: [
      200,
      'A news article summary must have less or equal than 200 characters',
    ],
  },
  source: {
    type: String,
    trim: true,
    maxlength: [
      100,
      'A news article source must have less or equal than 100 characters',
    ],
  },
  likes: {
    type: Number,
    default: 0,
  },
  comments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
  ],
});

// Adding virtual fields
newsSchema.virtual('commentsCount').get(function () {
  return this.comments.length;
});

// Pre hook to automatically populate comments on find
newsSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'comments',
    select: 'text user createdAt',
  }).populate({
    path: 'author',
    select: 'name photo about _id',
  });
  next();
});

// Post hook to remove comments if a news article is deleted
newsSchema.post('findOneAndDelete', async (doc, next) => {
  if (doc) {
    await mongoose.model('Comment').deleteMany({ news: doc._id });
  }
  next();
});

const News = mongoose.model('News', newsSchema);

export default News;
