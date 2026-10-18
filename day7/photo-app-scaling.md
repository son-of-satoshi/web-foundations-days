# SnapShare Photo-Sharing App Scaling Plan

## 1. Assumptions & Daily Active Users
* **Registered Users**: 10,000,000[cite: 14]
* **Activity Rate**: 10% of registered users use the app daily, yielding **1,000,000 Daily Active Users (DAU)**[cite: 14].
* **User Actions**: Each active user uploads 1 photo and views 50 feed pages per day[cite: 14].
* **File Sizes**: Average raw photo size is 2 MB, accompanied by a 50 KB thumbnail[cite: 14].

## 2. Back-of-the-Envelope Estimates
Using the standard engineering estimate of **100,000 seconds per day**:
* **Uploads (Writes)**: 
  * Total: 1,000,000 uploads/day
  * Average: 10 uploads/s
  * Peak ($5\times$): **50 uploads/s**[cite: 14]
* **Feed Views (Reads)**: 
  * Total: 50,000,000 feed views/day (1M users × 50 views)[cite: 14]
  * Average: 500 reads/s
  * Peak ($5\times$): **2,500 reads/s**[cite: 14]
* **Storage per Year**: 
  * 1,000,000 photos/day × 2.05 MB = 2.05 TB/day
  * Yearly total: $2.05\text{ TB} \times 365 \approx \mathbf{748\text{ TB per year}}$[cite: 14]

## 3. Read-Heavy vs. Write-Heavy Analysis
SnapShare is **heavily read-heavy** (with ~50 million reads vs. 1 million writes per day, roughly a 50:1 ratio)[cite: 14]. 
* **Design Implications**: Because users scroll through feeds much more often than they post photos, our architecture must prioritize high-speed read operations. We will heavily utilize database read replicas, caching layers (Redis) for user feeds, and a CDN for static image delivery to handle the 2,500 peak reads per second effortlessly.

## 4. Why Object Storage Instead of the Database?
Databases are optimized for structured relational data, ACID transactions, and fast indexing—not for storing massive binary blobs of multi-megabyte image files. Storing hundreds of terabytes of photos inside a relational database would bloat backups, severely slow down queries, and dramatically increase costs. Instead, image files are stored in **Object Storage** (such as AWS S3), which is infinitely scalable, highly durable, cost-effective for raw files, and returns a direct URL that the database can reference lightweight pointers to.

## 5. Architecture Diagram

```text
               ┌─────────┐
     ┌────────>│   DNS   │ (SnapShare.com → IP addresses)
     │         └─────────┘
┌────┴──────┐ static assets ┌────────────────────────┐
│  Browser  │─────────────>│ CDN (Images/Thumbnails)│
│  Client   │              └────────────────────────┘
└────┬──────┘
     │ API requests (HTTPS, JSON)
     v
┌───────────────┐
│ Load Balancer │
└──────┬────────┘
  ┌────┴─────┬──────────┐
  v          v          v
┌───────┐  ┌───────┐  ┌───────┐          ┌──────────────┐
│ App 1 │  │ App 2 │  │ App 3 │─────────>│ Cache (Redis)│
└───┬───┘  └───┬───┘  └───┬───┘          └──────────────┘
    │ writes   │ reads    │ async jobs
    v          v          v
┌─────────┐ ┌──────────┐ ┌──────────────┐
│ Primary │>│ Read     │ │ Message Queue│──> [ Worker ] ──> Generates Thumbnail
│   DB    │ │ Replicas │ └──────────────┘                  & Saves to Object Storage
└─────────┘ └──────────┘                                        (S3)
     │                     ┌──────────────────────┐
     └────────────────────>│ Object Storage (S3)  │ (Raw Photos & Thumbnails)
                           └──────────────────────┘