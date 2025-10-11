# Task Collaboration App - Server

## Description

This is the backend API for the Task Collaboration App, built with Node.js, Express, and MongoDB.

## Technologies Used

- Node.js
- Express.js
- MongoDB with Mongoose
- JSON Web Tokens (JWT) for authentication
- Bcrypt.js for password hashing

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file:

- `MONGO_URI`: Your MongoDB connection string
- `JWT_SECRET`: Your secret key for JWT
- `PORT`: The port number for the server (default is 5000)

## Installation

1. Clone the repository
2. Navigate to the server directory: `cd server`
3. Install dependencies: `npm install`
4. Create a `.env` file and add your environment variables
5. Start the server: `npm start` or `npm run dev` for development

## Available Scripts

- `npm start`: Start the server in production mode
- `npm run dev`: Start the server in development mode with nodemon
- `npm test`: Run tests (if any)

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get a token
- `GET /api/auth/user`: Get authenticated user details

### Projects

- `POST /api/projects`: Create a new project
- `GET /api/projects`: Get all projects for the authenticated user
- `DELETE /api/projects/:id`: Delete a project

### Tasks

- `POST /api/projects/:project_id/tasks`: Create a new task for a project
- `GET /api/projects/:project_id/tasks`: Get all tasks for a project
- `GET /api/tasks/assigned`: Get all tasks assigned to the authenticated user
- `PUT /api/tasks/:id`: Update a task
- `DELETE /api/tasks/:id`: Delete a task
