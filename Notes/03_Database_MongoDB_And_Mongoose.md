# 📙 Lecture 3: Database & Data Modeling (MongoDB & Mongoose)

In this lesson, we will explore where our data actually lives, how documents are structured, and how we connect MongoDB Atlas with Mongoose.

---

## 1. What is a Database?

When you turn off your computer or server, variables stored in Node.js memory (`let users = []`) disappear instantly.

A **database** is specialized software designed to save data persistently to hard drives and SSDs, organize it, and allow lightning-fast searching across millions of records.

---

## 2. SQL vs. NoSQL (Why MongoDB?)

There are two major families of databases:

### Relational (SQL) — e.g. PostgreSQL, MySQL
* Data is stored in strict tables with fixed columns and rows (like a strict Excel spreadsheet).
* Great for banking and accounting systems.

### Document-Based (NoSQL) — e.g. MongoDB
* Data is stored as **Documents** formatted almost identically to **JSON objects**!
* Each document has curly braces `{ key: value }`, can contain arrays, and can nest sub-objects.
* **Why it's awesome for JavaScript developers**: You do not have to translate between SQL tables and JavaScript objects. A MongoDB document *is* a JavaScript object!

---

## 3. What is Mongoose? (The Architect's Blueprint)

By default, MongoDB is "schemaless"—it will allow you to save a document with a missing title or a misspelled field like `emial`.

In a production SaaS, that would cause chaos! That is why we use **Mongoose**:
* **Mongoose** is an **ODM (Object Data Modeling)** library for MongoDB.
* It lets us create strict **Schemas** (blueprints) that define:
  1. What fields are allowed (`title`, `dueDate`).
  2. What data types they must be (`String`, `Number`, `Date`, `ObjectId`).
  3. Which fields are required (`required: [true, 'Title is required']`).
  4. Default values (`default: 'todo'`).

---

## 4. The 6 Data Models in WorkSpace

Here are the 6 schemas we designed and how they relate to each other:

```
                  ┌──────────────┐
                  │     USER     │
                  └──────┬───────┘
                         │
           ┌─────────────┼─────────────┐
           │ (creator)   │ (member)    │ (author)
           ▼             ▼             ▼
    ┌─────────────┐┌────────────┐┌───────────┐
    │  WORKSPACE  ││ MEMBERSHIP ││  COMMENT  │
    └──────┬──────┘└────────────┘└─────▲─────┘
           │                           │
           ▼                           │ (on task)
    ┌─────────────┐                    │
    │   PROJECT   │                    │
    └──────┬──────┘                    │
           │                           │
           ▼                           │
    ┌─────────────┐                    │
    │    TASK     ├────────────────────┘
    └─────────────┘
```

### 1. `User` Model ([`models/User.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/models/User.js))
* Holds personal information: `name`, unique lowercase `email`, `passwordHash`, and `avatarUrl`.
* **Important Design Decision**: `passwordHash` has `{ select: false }`. This means if you query `User.findById(...)`, Mongoose **never** returns the password hash unless you explicitly request it with `.select('+passwordHash')`.

### 2. `Workspace` Model ([`models/Workspace.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/models/Workspace.js))
* The top-level container for a company or team: `name`, `description`, `owner` (ref to User).

### 3. `Membership` Model ([`models/Membership.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/models/Membership.js))
* Connects a `User` to a `Workspace` and records their `role` (`owner`, `admin`, `member`).
* **The Magic Compound Index**:
  ```javascript
  membershipSchema.index({ workspace: 1, user: 1 }, { unique: true });
  ```
  This single line guarantees at the database level that a user can never be added twice to the same workspace!

### 4. `Project` Model ([`models/Project.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/models/Project.js))
* Initiatives inside a workspace: `workspace`, `name`, `description`, `status` (`active`, `completed`, `archived`), and `creator`.

### 5. `Task` Model ([`models/Task.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/models/Task.js))
* Individual work cards: `project`, `workspace`, `title`, `description`, `status` (`todo`, `in_progress`, `in_review`, `done`), `priority` (`low`, `medium`, `high`, `urgent`), `assignee`, and `dueDate`.

### 6. `Comment` Model ([`models/Comment.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/models/Comment.js))
* Discussion items on a task: `task`, `author` (User ref), and `content`.

---

## 5. What is an ObjectId and `.populate()`?

In MongoDB, every document has a unique identifier called `_id` (e.g. `6715f62e8a1d0e1234567890`).

When a Task needs to know who it is assigned to, it stores the User's ID in `assignee`:
```json
{
  "title": "Fix Navbar",
  "assignee": "6715f62e8a1d0e1234567890"
}
```

When sending this to React, showing just `6715f62...` looks ugly. The frontend needs the user's name and initials!

Mongoose has a feature called **`.populate()`**:
```javascript
const tasks = await Task.find({ project: projectId })
  .populate('assignee', 'name email avatarUrl');
```
Mongoose automatically looks up the `User` collection and swaps the ID for the full user object:
```json
{
  "title": "Fix Navbar",
  "assignee": {
    "id": "6715f62e8a1d0e1234567890",
    "name": "Alex Designer",
    "email": "alex@company.com"
  }
}
```

---

## 6. What is a Database Index?

Imagine a 1,000-page book. If you want to find every mention of "Authorization", without an index you would have to read all 1,000 pages one by one (a **Full Collection Scan**).

An **Index** is like the index section at the back of the book: an alphabetically sorted list pointing directly to page numbers.
* In our schemas, we added indexes on fields we search frequently:
  ```javascript
  taskSchema.index({ project: 1, status: 1 });
  ```
* Even with 100,000 tasks, MongoDB finds tasks in **under 2 milliseconds**!

---

## 💡 Teacher's Key Takeaways

1. **Schema Validation Saves Lives**: Always enforce min/max lengths and required fields in Mongoose to prevent corrupted or empty data.
2. **Compound Unique Indexes**: Use compound unique indexes whenever two fields together must never repeat (like user + workspace).
3. **MongoDB Atlas in Production**: MongoDB Atlas takes care of automated backups, clustering, security, and cloud replication automatically.
