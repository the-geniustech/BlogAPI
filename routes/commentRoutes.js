import express from 'express';
import { protect } from '../controllers/authController.js';
import {
  createComment,
  getComment,
  deleteComment,
  getAllComments,
  updateComment,
} from '../controllers/commentController.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getAllComments).post(createComment);

router.route('/:id').get(getComment).post(updateComment).delete(deleteComment);

export default router;
