# School Database Design Document

## Table Explanations
* **`students`**: Stores unique profile records for each student in the school. The `id` column acts as the primary key, and the `email` column enforces a `UNIQUE` constraint to prevent duplicate accounts.
* **`courses`**: Stores available classes offered by the school, each identified by a primary key `id`, along with a title and description.
* **`enrolments`**: A junction (join) table that connects `students` and `courses`. Because a student can take multiple courses and a course can have many students, this bridge table resolves the many-to-many relationship while storing auxiliary information specific to the pairing (`grade` and timestamp).

## Relationships & Join Table
* **Many-to-Many Relationship**: Handled via the `enrolments` join table. Relational databases do not allow storing comma-separated lists inside columns (which violates normalisation rules). Instead, `enrolments` pairs `student_id` and `course_id`. 
* **Composite Primary Key**: By setting `PRIMARY KEY (student_id, course_id)`, the database mathematically guarantees that the exact same student cannot enrol in the same course more than once.

## Indexing Strategy
* **Index on Foreign Keys (`enrolments.student_id` and `enrolments.course_id`)**: While primary keys are indexed automatically, adding indexes to foreign key columns in join tables speeds up `JOIN` and lookup operations when filtering student schedules or course rosters across large datasets.

## SQL vs NoSQL Choice
For an academic school management system, **SQL (Relational)** is the definitive choice. School data is highly structured with strict inter-dependencies (e.g., grades must belong to valid students and courses), requiring ACID transaction guarantees and relational constraints. While NoSQL offers flexibility for unstructured data, a relational database ensures the uncompromising data integrity and precision required for official academic records.