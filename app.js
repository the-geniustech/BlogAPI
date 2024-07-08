import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
// import rateLimit from 'express-rate-limit';
import userRouter from './routes/userRoutes.js';
import newsRouter from './routes/newsRoutes.js';
import commentsRouter from './routes/commentRoutes.js';
import globalErrorHandler from './controllers/errorController.js';
import AppError from './utils/appError.js';

dotenv.config({ path: './config.env' });

const app = express();

// 1) GLOBAL MIDDLEWARES
// Setting security HTTP headers
app.use(cors());
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
// const limiter = rateLimit({
//   max: 100,
//   windowMs: 60 * 60 * 1000, // 1 hour
//   message: 'Too many requests from this IP, please try again in an hour!',
// });
// app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(express.json({ extended: false }));

// Data sanitization against NoSQL query injection
// app.use(mongoSanitize());
//
// Data sanitization against XSS
// app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      // properties that are allowed to be duplicated in the query string
    ],
  }),
);

// 2) ROUTES
app.use('/api/v1/users', userRouter);
app.use('/api/v1/news', newsRouter);
app.use('/api/v1/comments', commentsRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(globalErrorHandler);

export default app;
