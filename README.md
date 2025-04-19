# Fitness Tracker
A comprehensive fitness tracking application to monitor workouts, track calories burned, and visualize fitness progress.
## Overview
Fitness Tracker is a full-stack web application designed to help users track their workouts and monitor their fitness progress. The application provides an intuitive interface for logging workouts, visualizing calorie burn data, and tracking fitness metrics over time. Users can add workouts, view their statistics on a dashboard, and filter workouts by date.

## Features

- **User Authentication**: Secure signup and login functionality
- **Dashboard**: Overview of fitness metrics and statistics
- **Workout Tracking**: Add and view workouts with detailed information
- **Calendar View**: Filter workouts by date
- **Data Visualization**: Visual representation of calories burned and workout categories
- **Responsive Design**: Optimized for both desktop and mobile experiences

## Tech Stack

### Frontend
- **React**: JavaScript library for building user interfaces
- **Redux & Redux Persist**: State management with local storage persistence
- **React Router**: Navigation and routing
- **Styled Components**: CSS-in-JS styling solution
- **Material UI Components**: UI components and data visualization (Charts)
- **Axios**: HTTP client for API requests

### Backend
- **Node.js**: JavaScript runtime environment
- **Express**: Web application framework
- **MongoDB**: NoSQL database
- **Mongoose**: ODM for MongoDB
- **JWT (JSON Web Tokens)**: Authentication mechanism
- **Bcrypt**: Password hashing for security

## Application Flow

1. **Authentication**:
   - User signs up or logs in
   - JWT token is generated and stored in localStorage
   - User is redirected to dashboard

2. **Dashboard**:
   - Displays today's statistics (calories burned, workouts completed)
   - Shows weekly calorie burn chart and category distribution
   - Provides a form to add new workouts

3. **Add Workout**:
   - User enters workout details in a specific format:
     ```
     #Category
     -Workout Name
     -Sets X Reps
     -Weight (kg)
     -Duration (min)
     ```
   - Backend parses the input and calculates calories burned
   - Workout is saved to the database

4. **View Workouts**:
   - User can select a date from the calendar
   - Application displays workouts for the selected date
   - Workout details are shown in cards with category, name, and metrics

5. **Data Aggregation**:
   - Backend aggregates workout data for dashboard statistics
   - Calculates total and average calories burned
   - Generates data for visualization charts

## API Endpoints

- **POST** `/api/user/signup`: Register a new user
- **POST** `/api/user/signin`: Authenticate user and get token
- **GET** `/api/user/dashboard`: Get dashboard statistics
- **GET** `/api/user/workout`: Get workouts by date
- **POST** `/api/user/workout`: Add a new workout

## Installation and Setup

### Prerequisites
- Node.js (v14+)
- MongoDB
- npm or yarn

### Backend Setup
1. Clone the repository
2. Navigate to the server directory: `cd server`
3. Install dependencies: `npm install`
4. Create a `.env` file with the following variables:
   ```
   MONGODB_URL=your_mongodb_connection_string
   JWT=your_jwt_secret
   ```
5. Start the server: `npm run dev`

### Frontend Setup
1. Navigate to the client directory: `cd client`
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Deployment

- Backend: Deployed on Render
- Frontend: Deployed on Vercel
- Live Demo: [https://fittrack-mu.vercel.app](https://fittrack-mu.vercel.app)

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

![Fitrack](https://github.com/user-attachments/assets/0f78eeaa-26fb-4450-8f9d-11cf898b6c89)

