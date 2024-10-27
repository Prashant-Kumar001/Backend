import express from "express";
import { getAllUsers } from '../controllers/Admin_Controller.js';

const router = express.Router();
router.get('/users', getAllUsers); // Get all users

export default router;