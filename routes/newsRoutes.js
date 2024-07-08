import express from 'express';
import {
  createNews,
  getAllNews,
  getNews,
  updateNews,
  deleteNews,
} from '../controllers/newsController.js';
import { protect } from '../controllers/authController.js';
import fileParser from '../middleware/fileParser.js';

const router = express.Router();

router.route('/').get(getAllNews).post(protect, fileParser, createNews);

router
  .route('/:id')
  .get(getNews)
  .patch(protect, fileParser, updateNews)
  .delete(protect, deleteNews);

export default router;
