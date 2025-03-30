import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createError } from "../error.js";
import User from "../models/User.js";
import Workout from "../models/Workout.js";

dotenv.config();

export const UserRegister = async (req, res, next) => {
  try {
    const { email, password, name} = req.body;

    // Check if the email is in use
    const existingUser = await User.findOne({ email }).exec();
    if (existingUser) {
      return next(createError(409, "Email is already in use."));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    const createdUser = await user.save();
    const token = jwt.sign({ id: createdUser._id }, process.env.JWT, {
      expiresIn: "1h",
    });
    return res.status(200).json({ token, user });
  } catch (error) {
    return next(error);
  }
};

export const UserLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });
    
    if (!user) {
      return next(createError(404, "User not found"));
    }
    console.log(user);
    
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return next(createError(403, "Incorrect password"));
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT, {
      expiresIn: "1h",
    });

    return res.status(200).json({ token, user });
  } catch (error) {
    return next(error);
  }
};
export const getUserDashboard = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const currentDateFormatted = new Date();
    const startToday = new Date(
      currentDateFormatted.getFullYear(),
      currentDateFormatted.getMonth(),
      currentDateFormatted.getDate()
    );
    const endToday = new Date(
      currentDateFormatted.getFullYear(),
      currentDateFormatted.getMonth(),
      currentDateFormatted.getDate() + 1
    );

    //calculte total calories burnt
    const totalCaloriesBurnt = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: startToday, $lt: endToday } } },
      {
        $group: {
          _id: null,
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    //Calculate total no of workouts
    const totalWorkouts = await Workout.countDocuments({
      user: userId,
      date: { $gte: startToday, $lt: endToday },
    });

    //Calculate average calories burnt per workout
    const avgCaloriesBurntPerWorkout =
      totalCaloriesBurnt.length > 0
        ? totalCaloriesBurnt[0].totalCaloriesBurnt / totalWorkouts
        : 0;

    // Fetch category of workouts
    const categoryCalories = await Workout.aggregate([
      { $match: { user: user._id, date: { $gte: startToday, $lt: endToday } } },
      {
        $group: {
          _id: "$category",
          totalCaloriesBurnt: { $sum: "$caloriesBurned" },
        },
      },
    ]);

    //Format category data for pie chart

    const pieChartData = categoryCalories.map((category, index) => ({
      id: index,
      value: category.totalCaloriesBurnt,
      label: category._id,
    }));

    const weeks = [];
    const caloriesBurnt = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(
        currentDateFormatted.getTime() - i * 24 * 60 * 60 * 1000
      );
      weeks.push(`${date.getDate()}th`);

      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      const endOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1
      );

      const weekData = await Workout.aggregate([
        {
          $match: {
            user: user._id,
            date: { $gte: startOfDay, $lt: endOfDay },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            totalCaloriesBurnt: { $sum: "$caloriesBurned" },
          },
        },
        {
          $sort: { _id: 1 }, // Sort by date in ascending order
        },
      ]);

      caloriesBurnt.push(
        weekData[0]?.totalCaloriesBurnt ? weekData[0]?.totalCaloriesBurnt : 0
      );
    }

    return res.status(200).json({
      totalCaloriesBurnt:
        totalCaloriesBurnt.length > 0
          ? totalCaloriesBurnt[0].totalCaloriesBurnt
          : 0,
      totalWorkouts: totalWorkouts,
      avgCaloriesBurntPerWorkout: avgCaloriesBurntPerWorkout,
      totalWeeksCaloriesBurnt: {
        weeks: weeks,
        caloriesBurned: caloriesBurnt,
      },
      pieChartData: pieChartData,
    });
  } catch (err) {
    next(err);
  }
};

export const getWorkoutsByDate = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    let date = req.query.date ? new Date(req.query.date) : new Date();
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    const endOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate() + 1
    );

    const todaysWorkouts = await Workout.find({
      user: userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });
    console.log("Fetched workouts:", todaysWorkouts);
    const totalCaloriesBurnt = todaysWorkouts.reduce(
      (total, workout) => total + workout.caloriesBurned,
      0
    );

    return res.status(200).json({ todaysWorkouts, totalCaloriesBurnt });
  } catch (err) {
    next(err);
  }
};

export const addWorkout = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const { workoutString } = req.body;

    if (!workoutString) {
      console.error("❌ Missing workout string in request body");
      return next(createError(400, "Workout string is missing"));
    }

    // Split workoutString into lines
    const eachworkout = workoutString.split(";").map((line) => line.trim());
    console.log("🔹 Parsed workout lines:", eachworkout);

    // Check if any workouts start with "#" to indicate categories
    if (!eachworkout.some((line) => line.startsWith("#"))) {
      console.error("❌ No categories found in workout string");
      return next(createError(400, "No categories found in workout string"));
    }

    const parsedWorkouts = [];
    let currentCategory = "";
    let count = 0;

    for (const line of eachworkout) {
      count++;

      if (line.startsWith("#")) {
        console.log(`🔹 Found category at line ${count}:`, line);

        const parts = line.split("\n").map((part) => part.trim());
        console.log(`🔹 Workout details at line ${count}:`, parts);

        if (parts.length < 2) {
          console.error(`❌ Workout string is incomplete at line ${count}`);
          return next(
            createError(400, `Workout string is missing for ${count}th workout`)
          );
        }

        // Set category
        currentCategory = parts[0].substring(1).trim();
        console.log(`✅ Current Category: ${currentCategory}`);

        // Parse workout details
        const workoutDetails = parseWorkoutLine(parts);
        console.log("✅ Parsed Workout Details:", workoutDetails);

        if (!workoutDetails) {
          console.error("❌ Workout details parsing failed");
          return next(createError(400, "Please enter a valid workout format"));
        }

        workoutDetails.category = currentCategory;
        parsedWorkouts.push(workoutDetails);
      } else {
        console.error(`❌ Workout string is missing at line ${count}`);
        return next(
          createError(400, `Workout string is missing for ${count}th workout`)
        );
      }
    }

    // Insert workouts into MongoDB without checking for duplicates
    for (const workout of parsedWorkouts) {
      try {
        console.log("🔥 Calculating calories for:", workout);
        workout.caloriesBurned = parseFloat(calculateCaloriesBurnt(workout));
        console.log("✅ Calories Burned:", workout.caloriesBurned);

        console.log("🛠 Inserting workout into MongoDB:", workout);
        await Workout.create({ ...workout, user: userId });
        console.log("✅ Workout inserted successfully!");
      } catch (mongoErr) {
        console.error("❌ MongoDB Insert Error:", mongoErr);
        return next(createError(500, "Database error while inserting workout"));
      }
    }

    return res.status(201).json({
      message: "Workouts added successfully",
      workouts: parsedWorkouts,
    });

  } catch (err) {
    console.error("🔥 Unexpected Error:", err);
    next(err);
  }
};


// Function to parse workout details from a line
const parseWorkoutLine = (parts) => {
  try {
    if (parts.length >= 5) {
      return {
        workoutName: parts[1]?.substring(1).trim() || "Unnamed Workout",
        sets: parseInt(parts[2]?.split("sets")[0]?.substring(1).trim()) || 0,
        reps: parseInt(parts[2]?.split("sets")[1]?.split("reps")[0]?.substring(1).trim()) || 0,
        weight: parseFloat(parts[3]?.split("kg")[0]?.substring(1).trim()) || 0,
        duration: parseFloat(parts[4]?.split("min")[0]?.substring(1).trim()) || 0,
      };
    }
    return null;
  } catch (error) {
    console.error("Error parsing workout:", error);
    return null;
  }
};

// Function to calculate calories burnt for a workout
const calculateCaloriesBurnt = (workoutDetails) => {
  const durationInMinutes = parseInt(workoutDetails.duration);
  const weightInKg = parseInt(workoutDetails.weight);
  const caloriesBurntPerMinute = 5; // Sample value, actual calculation may vary
  return durationInMinutes * caloriesBurntPerMinute * weightInKg;
};
