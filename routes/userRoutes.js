import express from 'express';
import {
  getAllUsers,
  getUser,
  updateMe,
  deleteMe,
  getMe,
  updateUser,
  deleteUser,
  createUser,
} from '../controllers/userController.js';
import {
  forgotPassword,
  login,
  logout,
  protect,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
} from '../controllers/authController.js';
import fileParser from '../middleware/fileParser.js';

const router = express.Router();

router.post('/signup', fileParser, signup);
router.post('/login', login);
router.get('/logout', logout);
router.post('/forgotPassword', forgotPassword);
router.patch('/resetPassword/:token', resetPassword);

// Protect all routes after this midleware
router.use(protect);

router.get('/me', getMe, getUser);
router.patch('/updateMyPassword', updatePassword);
router.patch('/updateMe', fileParser, updateMe);
router.delete('/deleteMe', deleteMe);

// Restrict all routes after this midleware to Admin user only
router.use(restrictTo('admin'));

router.route('/').get(getAllUsers).post(createUser);
router.route('/:id').get(getUser).patch(updateUser).delete(deleteUser);

export default router;
