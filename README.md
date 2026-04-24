# College AMS (Academic Management System)

A full-stack academic management system built with Node.js, Express, and MySQL. This application implements secure authentication, role-based access control, and dynamic data management for student and teacher workflows.

## Overview

This project simulates a real-world academic system where users interact with structured data through a web interface. It demonstrates backend API development, database integration, and access control enforcement across different user roles.

## Key Features

- User authentication (login and registration)
- Role-based access control (student vs teacher)
- RESTful API built with Express
- MySQL database integration
- CRUD operations across academic entities
- Protected routes with role enforcement
- Student-restricted views with masked sensitive data (grades)
- Shared UI with dynamic behavior based on user role

## Tech Stack

Frontend:
- HTML
- CSS
- JavaScript

Backend:
- Node.js
- Express.js

Database:
- MySQL (phpMyAdmin)

Security:
- bcryptjs (password hashing)
- JSON Web Tokens (JWT)
- dotenv (environment configuration)

## System Design

- Frontend communicates with backend via HTTP requests
- Backend handles authentication, authorization, and database queries
- MySQL stores relational data (students, courses, enrollments, etc.)
- Role-based logic is enforced both on the frontend and backend

## Getting Started

### 1. Clone the Repository
git clone https://github.com/Samiyatf/School-DB.git
cd School-DB

### 2. Set Up the Database
- Start Apache and MySQL in XAMPP
- Open your browser and go to:
  http://localhost/phpmyadmin
- Create a database named:
  college_management_db
- Click Import and select:
  college_management_db.sql
- Click Go and wait for the success message

### 3. Configure Environment Variables
Create a .env file in the root directory and add:

DB_HOST=127.0.0.1  
DB_USER=root  
DB_PASSWORD=  
DB_NAME=college_management_db  
PORT=3000  

### 4. Install Dependencies
npm install

### 5. Run the Backend
node server.js

You should see:
Server running on http://localhost:3000

### 6. Run the Frontend
Open a second terminal and run:

python -m http.server 8000

or:

py -m http.server 8000

### 7. Open the Application
http://localhost:8000/login.html

### Student View
<p align="center">
  <img src="https://github.com/user-attachments/assets/42068054-2dc0-4617-8f32-46d56ede202d" width="700"/>
</p>

### Teacher View
<p align="center">
  <img src="https://github.com/user-attachments/assets/1a0d1d61-f02d-4730-a603-d94acf51f7dd" width="700"/>
</p>
