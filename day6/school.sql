-- Enable foreign key enforcement in SQLite
PRAGMA foreign_keys = ON;

-- 1. STUDENTS TABLE
CREATE TABLE students (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 2. COURSES TABLE
CREATE TABLE courses (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  title       TEXT NOT NULL,
  description TEXT
);

-- 3. ENROLMENTS TABLE (Join Table for Many-to-Many Relationship)
CREATE TABLE enrolments (
  student_id  INTEGER NOT NULL,
  course_id   INTEGER NOT NULL,
  grade       TEXT,
  enrolled_at TEXT DEFAULT CURRENT_TIMESTAMP,
  -- Composite Primary Key: prevents the same student from enrolling in the same course twice
  PRIMARY KEY (student_id, course_id),
  -- Foreign keys with ON DELETE CASCADE to maintain data integrity
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ==========================================
-- INSERT SAMPLE DATA
-- ==========================================

-- Insert at least 3 students (plus one extra with no enrolments to test LEFT JOIN queries)
INSERT INTO students (name, email) VALUES ('Amina Otieno', 'amina@example.com');
INSERT INTO students (name, email) VALUES ('Brian Kamau', 'brian@example.com');
INSERT INTO students (name, email) VALUES ('Chloe Wanjiku', 'chloe@example.com');
INSERT INTO students (name, email) VALUES ('Daniel Ochieng', 'daniel@example.com');

-- Insert at least 3 courses
INSERT INTO courses (title, description) VALUES ('Software Engineering Foundations', 'Introduction to web and software development fundamentals.');
INSERT INTO courses (title, description) VALUES ('Database Systems & SQL', 'Relational databases, normalisation, and SQL queries.');
INSERT INTO courses (title, description) VALUES ('Web3 & Blockchain Architecture', 'Smart contracts, EUTxO models, and decentralized apps.');

-- Insert at least 5 enrolments
INSERT INTO enrolments (student_id, course_id, grade) VALUES (1, 1, 'A');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (1, 2, 'A');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (2, 1, 'B');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (2, 3, 'A');
INSERT INTO enrolments (student_id, course_id, grade) VALUES (3, 2, 'C');

-- ==========================================
-- FIVE REQUIRED QUERIES
-- ==========================================

-- Query 1: All courses for one student (by name, e.g., Amina Otieno)
SELECT students.name AS student_name, courses.title AS course_title, enrolments.grade
FROM students
JOIN enrolments ON students.id = enrolments.student_id
JOIN courses ON courses.id = enrolments.course_id
WHERE students.name = 'Amina Otieno';

-- Query 2: All students on one course (e.g., Software Engineering Foundations)
SELECT courses.title AS course_title, students.name AS student_name, enrolments.grade
FROM courses
JOIN enrolments ON courses.id = enrolments.course_id
JOIN students ON students.id = enrolments.student_id
WHERE courses.title = 'Software Engineering Foundations';

-- Query 3: The number of students per course (using LEFT JOIN and GROUP BY)
SELECT courses.title AS course_title, COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON courses.id = enrolments.course_id
GROUP BY courses.id;

-- Query 4: Students who have no enrolments (using LEFT JOIN)
SELECT students.id, students.name, students.email
FROM students
LEFT JOIN enrolments ON students.id = enrolments.student_id
WHERE enrolments.course_id IS NULL;

-- Query 5: Update of one enrolment's grade
UPDATE enrolments
SET grade = 'A+'
WHERE student_id = 1 AND course_id = 1;