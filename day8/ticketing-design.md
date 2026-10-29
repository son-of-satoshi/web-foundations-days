# TicketHub - System Design Document

## 1. Requirements

### Functional Requirements
* **Browse Events**: Users can view a list of upcoming concerts, theatrical performances, and events, filtered by category, date, and venue.
* **View Seat Map**: Users can inspect real-time seat availability (available, held, booked) for any selected event.
* **Hold Seats**: Users can temporarily lock/hold specific seats during checkout for a limited time (10 minutes) before payment.
* **Process Payments**: Users can securely submit payment information to complete ticket purchases and generate verifiable orders.
* **View Tickets**: Users can view their purchase history and active tickets with unique QR codes for event entry.

### Non-Functional Requirements
* **High Concurrency & Availability**: The system must support massive flash sales (200,000 concurrent users during peak drops) with 99.99% availability.
* **Low Latency**: Event browsing and seat map loading must occur in under 200 ms globally using CDNs and caching.
* **Strict Correctness (Zero Double-Booking)**: Under no circumstances can two users successfully book the exact same seat simultaneously.
* **Fairness**: Implement virtual waiting rooms or rate-limiting during high-demand sales to prevent bot manipulation and ensure fair access.

---

## 2. Traffic Estimates and Scaling Calculations

### Normal Day Traffic
* **Registered Users**: 2,000,000
* **Daily Active Visitors**: 50,000 visitors per day.
* **Page Views**: 10 pages per visitor $\rightarrow$ 500,000 page views per day.
* **Average Read RPS (Requests Per Second)**: 
  $$\frac{500,000 \text{ views}}{86,400 \text{ seconds}} \approx 5.8 \text{ requests/sec}$$
* **Normal Ticket Sales**: 5,000 tickets sold per day $\rightarrow \approx 0.058$ orders/sec.

### Big Sale (Flash Sale) Peak Traffic
* **Scenario**: A massively popular concert goes on sale, attracting **200,000 users** trying to purchase **20,000 seats** within the **first 10 minutes** (600 seconds).
* **Peak Read/Browse Load**: 200,000 concurrent users browsing event pages and seat maps $\rightarrow$ estimated at **2,000 to 5,000 reads/sec**.
* **Peak Write/Checkout Load**: 
  $$\frac{20,000 \text{ seats}}{600 \text{ seconds}} \approx 33.3 \text{ checkouts/sec (average over window)}$$
  *Note:* Due to user clustering at the exact start time, burst write traffic to the checkout and payment endpoints can spike up to **1,000+ writes/sec**.

---

## 3. API Design

The TicketHub REST API exposes the following core endpoints:

1. **`GET /api/events`**
   * **Description**: Retrieve a paginated list of upcoming events with filtering options.
   * **Response (200 OK)**: JSON array of event summaries (id, title, date, venue, starting price).

2. **`GET /api/events/{event_id}/seats`**
   * **Description**: Retrieve real-time seat availability map for a specific event.
   * **Response (200 OK)**: JSON object containing seat grid with statuses (`available`, `held`, `booked`).

3. **`POST /api/seats/hold`**
   * **Description**: Temporarily lock selected seats for a user during checkout.
   * **Request Body**: `{"user_id": "uuid", "event_id": "uuid", "seat_ids": ["seat_1", "seat_2"]}`
   * **Response (201 Created)**: `{"hold_token": "token_abc123", "expires_in": 600}` or `409 Conflict` if already taken.

4. **`POST /api/orders`**
   * **Description**: Process payment and finalize ticket purchases using a valid hold token.
   * **Request Body**: `{"user_id": "uuid", "hold_token": "token_abc123", "payment_details": {...}}`
   * **Response (201 Created)**: `{"order_id": "ord_9876", "status": "confirmed", "tickets": [...]}`

5. **`GET /api/users/{user_id}/tickets`**
   * **Description**: Retrieve all active tickets and purchase history for a registered user.
   * **Response (200 OK)**: JSON array of confirmed user orders and ticket QR codes.

---

## 4. Data Model

The relational database schema is structured across four core tables:

### 1. `users`
* `id` (UUID, Primary Key)
* `email` (TEXT, Unique, Not Null)
* `password_hash` (TEXT, Not Null)
* `created_at` (TIMESTAMP)

### 2. `events`
* `id` (UUID, Primary Key)
* `title` (TEXT, Not Null)
* `description` (TEXT)
* `venue` (TEXT, Not Null)
* `date` (TIMESTAMP, Not Null)
* `total_seats` (INTEGER, Not Null)

### 3. `seats`
* `id` (UUID, Primary Key)
* `event_id` (UUID, Foreign Key referencing `events.id`, Indexed)
* `seat_number` (TEXT, Not Null, e.g., "A12")
* `status` (TEXT, Not Null: `'available'`, `'held'`, `'booked'`)
* `version` (INTEGER, Default 0 - used for optimistic locking)

### 4. `orders`
* `id` (UUID, Primary Key)
* `user_id` (UUID, Foreign Key referencing `users.id`)
* `event_id` (UUID, Foreign Key referencing `events.id`)
* `seat_id` (UUID, Foreign Key referencing `seats.id`, Unique)
* `total_amount` (DECIMAL, Not Null)
* `status` (TEXT: `'pending'`, `'completed'`, `'refunded'`)
* `created_at` (TIMESTAMP)

*Relationships*: One event has many seats; one event has many orders; one user has many orders; one seat maps to exactly one active order via unique constraint.

---

## 5. Architecture, Scaling, and Preventing Double-Booking

### High-Level Architecture
1. **Edge Layer (CDN / WAF)**: Cloudflare caches static assets, event catalog pages, and blocks malicious DDoS traffic.
2. **Load Balancer (Nginx / ALB)**: Distributes incoming user traffic across a cluster of stateless API application servers.
3. **Stateless App Servers (Node.js / Express)**: Handle business logic, API requests, and authentication without storing local session state.
4. **Distributed Cache / Queue (Redis)**: Manages virtual waiting room queues during flash sales, caches active seat maps, and holds temporary 10-minute seat locks with automatic TTL expiration.
5. **Database Tier (PostgreSQL)**: 
   * **Primary Database**: Handles high-integrity write transactions (seat bookings, order creation).
   * **Read Replicas**: Multiple read-only replicas scale out read traffic for event browsing and catalog queries.

### Preventing Double-Booking (Concurrency Control)
To guarantee that two users can never successfully purchase the same seat simultaneously, TicketHub enforces strict database-level safety mechanisms:
* **Atomic Conditional Updates**: When finalizing an order, the database executes an atomic update query:
  `UPDATE seats SET status = 'booked', version = version + 1 WHERE id = ? AND status = 'held';`
* **Transactions & Row-Level Locking**: This query runs inside an isolated database transaction (`SERIALIZABLE` or `READ COMMITTED` with `SELECT ... FOR UPDATE`). If two concurrent transactions attempt to book the same seat, only the first transaction modifies the row; the second transaction finds 0 affected rows (`status` is no longer `'held'`), causing the transaction to abort and roll back gracefully.
* **Unique Constraints**: The `orders` table enforces a `UNIQUE` constraint on `seat_id`, making it physically impossible in the database engine to create two active completed orders for the same seat.

---

## 6. Trade-offs

1. **Strict Consistency (SQL Transactions) vs. Eventual Consistency (NoSQL/Caching)**:
   * *Trade-off*: We chose PostgreSQL relational transactions and ACID compliance for bookings to guarantee zero double-bookings. This sacrifices some raw write throughput speed compared to a distributed NoSQL key-value store, which is acceptable because inventory correctness is non-negotiable for ticketing.
2. **Temporary Seat Holds (UX vs. Inventory Utilization)**:
   * *Trade-off*: Allowing users to hold seats for 10 minutes during checkout provides a stress-free user experience, but it temporarily ties up inventory if users abandon their carts. We mitigate this by using Redis TTLs to automatically release expired holds back to `available` status after 10 minutes.