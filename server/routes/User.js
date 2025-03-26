import express from "express";
import {
  UserLogin,
  UserRegister,
  addWorkout,
  getUserDashboard,
  getWorkoutsByDate,
} from "../controllers/User.js";
import { verifyToken } from "../middleware/verifyToken.js";

const router = express.Router();

router.post("/signup", UserRegister);
router.post("/signin", UserLogin);
// router.put("/:id", verifyToken, updateUser);

router.use(verifyToken);
router.get("/dashboard", getUserDashboard);
router.route("/workout").get(getWorkoutsByDate).post(addWorkout);

export default router;
