# Library REST API Design

A RESTful API design for managing a library's books resource, supporting full CRUD operations and query parameter filtering.

## Endpoints

### 1. List all books
* **Method:** `GET`
* **Path:** `/books`
* **Description:** Retrieve a complete list of all books available in the library catalog.
* **Request Body:** None
* **Success Status Code:** `200 OK`

### 2. Get a single book
* **Method:** `GET`
* **Path:** `/books/:id`
* **Description:** Retrieve detailed information for a specific book using its unique identifier.
* **Request Body:** None
* **Success Status Code:** `200 OK`

### 3. Create a new book
* **Method:** `POST`
* **Path:** `/books`
* **Description:** Add a new book resource to the library catalog.
* **Request Body:**
  ```json
  {
    "title": "The Hobbit",
    "author": "J.R.R. Tolkien",
    "publishedYear": 1937
  }