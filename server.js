const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || "college_secret_key_123";

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "college_management_db",
  waitForConnections: true,
  connectionLimit: 10
});

// =========================
// AUTH ROUTES
// =========================

app.post("/api/auth/register", async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!["student", "teacher"].includes(role)) {
      return res.status(400).json({ error: "Invalid role selected" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO app_users (full_name, email, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      [full_name, email, password_hash, role]
    );

    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Email already exists" });
    }

    res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.query(
      "SELECT * FROM app_users WHERE email = ?",
      [email]
    );

    if (!users.length) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Login failed" });
  }
});

// =========================
// AUTH MIDDLEWARE
// =========================

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Access denied" });
    }

    next();
  };
}

// =========================
// ENTITY CONFIG
// =========================

const entityConfig = {
  colleges: {
    idField: "college_id",
    table: "college",
    selectAll: `SELECT college_id, college_name, location FROM college ORDER BY college_id ASC`,
    selectOne: `SELECT college_id, college_name, location FROM college WHERE college_id = ?`,
    insert: `INSERT INTO college (college_name, location) VALUES (?, ?)`,
    update: `UPDATE college SET college_name = ?, location = ? WHERE college_id = ?`,
    insertValues: (b) => [b.college_name, b.location],
    updateValues: (b, id) => [b.college_name, b.location, id]
  },

  departments: {
    idField: "department_id",
    table: "department",
    selectAll: `
      SELECT d.department_id, d.college_id, c.college_name, d.department_name
      FROM department d
      JOIN college c ON d.college_id = c.college_id
      ORDER BY d.department_id ASC
    `,
    selectOne: `
      SELECT d.department_id, d.college_id, c.college_name, d.department_name
      FROM department d
      JOIN college c ON d.college_id = c.college_id
      WHERE d.department_id = ?
    `,
    insert: `INSERT INTO department (college_id, department_name) VALUES (?, ?)`,
    update: `UPDATE department SET college_id = ?, department_name = ? WHERE department_id = ?`,
    insertValues: (b) => [b.college_id, b.department_name],
    updateValues: (b, id) => [b.college_id, b.department_name, id]
  },

  students: {
    idField: "student_id",
    table: "student",
    selectAll: `
      SELECT s.student_id, s.first_name, s.last_name, s.department_id, d.department_name, s.max_courses_allowed
      FROM student s
      JOIN department d ON s.department_id = d.department_id
      ORDER BY s.student_id ASC
    `,
    selectOne: `
      SELECT s.student_id, s.first_name, s.last_name, s.department_id, d.department_name, s.max_courses_allowed
      FROM student s
      JOIN department d ON s.department_id = d.department_id
      WHERE s.student_id = ?
    `,
    insert: `INSERT INTO student (department_id, first_name, last_name, max_courses_allowed) VALUES (?, ?, ?, ?)`,
    update: `UPDATE student SET department_id = ?, first_name = ?, last_name = ?, max_courses_allowed = ? WHERE student_id = ?`,
    insertValues: (b) => [b.department_id, b.first_name, b.last_name, b.max_courses_allowed],
    updateValues: (b, id) => [b.department_id, b.first_name, b.last_name, b.max_courses_allowed, id]
  },

  student_accounts: {
    idField: "account_id",
    table: "student_account",
    selectAll: `
      SELECT sa.account_id, sa.student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name, sa.username
      FROM student_account sa
      JOIN student s ON sa.student_id = s.student_id
      ORDER BY sa.account_id ASC
    `,
    selectOne: `
      SELECT sa.account_id, sa.student_id, CONCAT(s.first_name, ' ', s.last_name) AS student_name, sa.username
      FROM student_account sa
      JOIN student s ON sa.student_id = s.student_id
      WHERE sa.account_id = ?
    `,
    insert: `INSERT INTO student_account (student_id, username, password) VALUES (?, ?, ?)`,
    update: `UPDATE student_account SET student_id = ?, username = ?, password = ? WHERE account_id = ?`,
    insertValues: (b) => [b.student_id, b.username, b.password],
    updateValues: (b, id) => [b.student_id, b.username, b.password, id]
  },

  instructors: {
    idField: "instructor_id",
    table: "instructor",
    selectAll: `
      SELECT i.instructor_id, i.first_name, i.last_name, i.department_id, d.department_name
      FROM instructor i
      JOIN department d ON i.department_id = d.department_id
      ORDER BY i.instructor_id ASC
    `,
    selectOne: `
      SELECT i.instructor_id, i.first_name, i.last_name, i.department_id, d.department_name
      FROM instructor i
      JOIN department d ON i.department_id = d.department_id
      WHERE i.instructor_id = ?
    `,
    insert: `INSERT INTO instructor (department_id, first_name, last_name) VALUES (?, ?, ?)`,
    update: `UPDATE instructor SET department_id = ?, first_name = ?, last_name = ? WHERE instructor_id = ?`,
    insertValues: (b) => [b.department_id, b.first_name, b.last_name],
    updateValues: (b, id) => [b.department_id, b.first_name, b.last_name, id]
  },

  instructor_profiles: {
    idField: "profile_id",
    table: "instructor_profile",
    selectAll: `
      SELECT ip.profile_id, ip.instructor_id, CONCAT(i.first_name, ' ', i.last_name) AS instructor_name, ip.office, ip.rank_title
      FROM instructor_profile ip
      JOIN instructor i ON ip.instructor_id = i.instructor_id
      ORDER BY ip.profile_id ASC
    `,
    selectOne: `
      SELECT ip.profile_id, ip.instructor_id, CONCAT(i.first_name, ' ', i.last_name) AS instructor_name, ip.office, ip.rank_title
      FROM instructor_profile ip
      JOIN instructor i ON ip.instructor_id = i.instructor_id
      WHERE ip.profile_id = ?
    `,
    insert: `INSERT INTO instructor_profile (instructor_id, office, rank_title) VALUES (?, ?, ?)`,
    update: `UPDATE instructor_profile SET instructor_id = ?, office = ?, rank_title = ? WHERE profile_id = ?`,
    insertValues: (b) => [b.instructor_id, b.office || null, b.rank_title || null],
    updateValues: (b, id) => [b.instructor_id, b.office || null, b.rank_title || null, id]
  },

  courses: {
    idField: "course_id",
    table: "course",
    selectAll: `
      SELECT c.course_id, c.course_title, c.department_id, d.department_name, c.credit_hours
      FROM course c
      JOIN department d ON c.department_id = d.department_id
      ORDER BY c.course_id ASC
    `,
    selectOne: `
      SELECT c.course_id, c.course_title, c.department_id, d.department_name, c.credit_hours
      FROM course c
      JOIN department d ON c.department_id = d.department_id
      WHERE c.course_id = ?
    `,
    insert: `INSERT INTO course (department_id, course_title, credit_hours) VALUES (?, ?, ?)`,
    update: `UPDATE course SET department_id = ?, course_title = ?, credit_hours = ? WHERE course_id = ?`,
    insertValues: (b) => [b.department_id, b.course_title, b.credit_hours],
    updateValues: (b, id) => [b.department_id, b.course_title, b.credit_hours, id]
  },

  classrooms: {
    idField: "classroom_id",
    table: "classroom",
    selectAll: `SELECT classroom_id, building_name, room_number, capacity FROM classroom ORDER BY classroom_id ASC`,
    selectOne: `SELECT classroom_id, building_name, room_number, capacity FROM classroom WHERE classroom_id = ?`,
    insert: `INSERT INTO classroom (building_name, room_number, capacity) VALUES (?, ?, ?)`,
    update: `UPDATE classroom SET building_name = ?, room_number = ?, capacity = ? WHERE classroom_id = ?`,
    insertValues: (b) => [b.building_name, b.room_number, b.capacity],
    updateValues: (b, id) => [b.building_name, b.room_number, b.capacity, id]
  },

  sections: {
    idField: "section_id",
    table: "section",
    selectAll: `
      SELECT 
        s.section_id,
        s.course_id,
        c.course_title,
        s.instructor_id,
        CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
        s.classroom_id,
        CONCAT(cl.building_name, ' ', cl.room_number) AS classroom_label,
        s.semester,
        s.year
      FROM section s
      JOIN course c ON s.course_id = c.course_id
      JOIN instructor i ON s.instructor_id = i.instructor_id
      JOIN classroom cl ON s.classroom_id = cl.classroom_id
      ORDER BY s.section_id ASC
    `,
    selectOne: `
      SELECT 
        s.section_id,
        s.course_id,
        c.course_title,
        s.instructor_id,
        CONCAT(i.first_name, ' ', i.last_name) AS instructor_name,
        s.classroom_id,
        CONCAT(cl.building_name, ' ', cl.room_number) AS classroom_label,
        s.semester,
        s.year
      FROM section s
      JOIN course c ON s.course_id = c.course_id
      JOIN instructor i ON s.instructor_id = i.instructor_id
      JOIN classroom cl ON s.classroom_id = cl.classroom_id
      WHERE s.section_id = ?
    `,
    insert: `INSERT INTO section (course_id, instructor_id, classroom_id, semester, year) VALUES (?, ?, ?, ?, ?)`,
    update: `UPDATE section SET course_id = ?, instructor_id = ?, classroom_id = ?, semester = ?, year = ? WHERE section_id = ?`,
    insertValues: (b) => [b.course_id, b.instructor_id, b.classroom_id, b.semester, b.year],
    updateValues: (b, id) => [b.course_id, b.instructor_id, b.classroom_id, b.semester, b.year, id]
  },

  enrollments: {
    idField: "enrollment_id",
    table: "enrollment",
    selectAll: `
      SELECT 
        e.enrollment_id,
        e.student_id,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        e.section_id,
        CONCAT(c.course_title, ' - ', s.semester, ' ', s.year) AS section_label,
        IFNULL(e.grade, 'Incomplete') AS grade
      FROM enrollment e
      JOIN student st ON e.student_id = st.student_id
      JOIN section s ON e.section_id = s.section_id
      JOIN course c ON s.course_id = c.course_id
      ORDER BY e.enrollment_id ASC
    `,
    selectOne: `
      SELECT 
        e.enrollment_id,
        e.student_id,
        CONCAT(st.first_name, ' ', st.last_name) AS student_name,
        e.section_id,
        CONCAT(c.course_title, ' - ', s.semester, ' ', s.year) AS section_label,
        IFNULL(e.grade, 'Incomplete') AS grade
      FROM enrollment e
      JOIN student st ON e.student_id = st.student_id
      JOIN section s ON e.section_id = s.section_id
      JOIN course c ON s.course_id = c.course_id
      WHERE e.enrollment_id = ?
    `,
    insert: `INSERT INTO enrollment (student_id, section_id, grade) VALUES (?, ?, ?)`,
    update: `UPDATE enrollment SET student_id = ?, section_id = ?, grade = ? WHERE enrollment_id = ?`,
    insertValues: (b) => [b.student_id, b.section_id, b.grade || null],
    updateValues: (b, id) => [b.student_id, b.section_id, b.grade || null, id]
  }
};

// =========================
// LOOKUP ROUTES
// =========================

app.get("/api/lookups/colleges", authenticateUser, async (req, res) => {
  const [rows] = await pool.query(`SELECT college_id, college_name FROM college ORDER BY college_name`);
  res.json(rows);
});

app.get("/api/lookups/departments", authenticateUser, async (req, res) => {
  const [rows] = await pool.query(`SELECT department_id, department_name FROM department ORDER BY department_name`);
  res.json(rows);
});

app.get("/api/lookups/students", authenticateUser, async (req, res) => {
  const [rows] = await pool.query(`SELECT student_id, CONCAT(first_name, ' ', last_name) AS student_name FROM student ORDER BY first_name, last_name`);
  res.json(rows);
});

app.get("/api/lookups/instructors", authenticateUser, async (req, res) => {
  const [rows] = await pool.query(`SELECT instructor_id, CONCAT(first_name, ' ', last_name) AS instructor_name FROM instructor ORDER BY first_name, last_name`);
  res.json(rows);
});

app.get("/api/lookups/courses", authenticateUser, async (req, res) => {
  const [rows] = await pool.query(`SELECT course_id, course_title FROM course ORDER BY course_title`);
  res.json(rows);
});

app.get("/api/lookups/classrooms", authenticateUser, async (req, res) => {
  const [rows] = await pool.query(`SELECT classroom_id, CONCAT(building_name, ' ', room_number) AS classroom_label FROM classroom ORDER BY building_name, room_number`);
  res.json(rows);
});

app.get("/api/lookups/sections", authenticateUser, async (req, res) => {
  const [rows] = await pool.query(`
    SELECT s.section_id, CONCAT(c.course_title, ' - ', s.semester, ' ', s.year) AS section_label
    FROM section s
    JOIN course c ON s.course_id = c.course_id
    ORDER BY c.course_title, s.year
  `);
  res.json(rows);
});

// =========================
// GENERIC CRUD ROUTES
// =========================

for (const [entity, cfg] of Object.entries(entityConfig)) {
  app.get(`/api/${entity}`, authenticateUser, async (req, res) => {
    try {
      const [rows] = await pool.query(cfg.selectAll);
      res.json(rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to fetch ${entity}` });
    }
  });

  app.post(`/api/${entity}`, authenticateUser, authorizeRoles("teacher"), async (req, res) => {
    try {
      const [result] = await pool.query(cfg.insert, cfg.insertValues(req.body));
      const [rows] = await pool.query(cfg.selectOne, [result.insertId]);
      res.status(201).json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to create ${entity.slice(0, -1)}` });
    }
  });

  app.put(`/api/${entity}/:id`, authenticateUser, authorizeRoles("teacher"), async (req, res) => {
    try {
      const id = req.params.id;
      const [result] = await pool.query(cfg.update, cfg.updateValues(req.body, id));

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Record not found" });
      }

      const [rows] = await pool.query(cfg.selectOne, [id]);
      res.json(rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: `Failed to update ${entity.slice(0, -1)}` });
    }
  });

  app.delete(`/api/${entity}/:id`, authenticateUser, authorizeRoles("teacher"), async (req, res) => {
    try {
      const id = req.params.id;
      const [result] = await pool.query(
        `DELETE FROM ${cfg.table} WHERE ${cfg.idField} = ?`,
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Record not found" });
      }

      res.json({ message: "Deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        error: "Delete failed. This record may be referenced by another table."
      });
    }
  });
}

// =========================
// EXPORT ROUTES
// =========================

app.get("/api/export/:entity", authenticateUser, async (req, res) => {
  try {
    const cfg = entityConfig[req.params.entity];

    if (!cfg) {
      return res.status(404).json({ error: "Invalid export entity" });
    }

    const [rows] = await pool.query(cfg.selectAll);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Export failed" });
  }
});

app.get("/api/export/all", authenticateUser, async (req, res) => {
  try {
    const result = {};

    for (const [entity, cfg] of Object.entries(entityConfig)) {
      const [rows] = await pool.query(cfg.selectAll);
      result[entity] = rows;
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Full export failed" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});