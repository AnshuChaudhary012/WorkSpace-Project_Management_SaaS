# 📗 Lecture 2: Backend Development (Node.js, Express & REST APIs)

In this lesson, we will explore the **Backend Engine** of our SaaS. You will learn what Node.js and Express are, how HTTP requests work, and how we write clean, professional APIs.

---

## 1. What is Node.js?

Before 2009, JavaScript could only run inside a web browser (like Chrome or Firefox).

**Node.js** took Google Chrome's fast V8 JavaScript engine and made it run directly on your computer's operating system!
* Now JavaScript can access files, connect to databases, handle network requests, and act as a complete server.
* You write JavaScript on both the frontend (React) and the backend (Node)—that is why it is called a **full-stack JavaScript application**.

---

## 2. What is Express.js?

While Node.js gives you the raw tools to listen to network traffic, writing a web server in plain Node requires dozens of lines of repetitive code.

**Express.js** is a lightweight framework that sits on top of Node.js. It gives us:
1. **Easy Routing**: Define what happens when a user visits `GET /api/workspaces`.
2. **Middleware Support**: Run security checks before reaching your main logic.
3. **JSON Handling**: Automatically turns raw incoming request strings into friendly JavaScript objects (`req.body`).

---

## 3. What is a REST API?

**API** stands for *Application Programming Interface*. It is a set of rules and URLs that allow different programs to talk to each other.

A **REST API** (Representational State Transfer) uses standard **HTTP Methods** (verbs) to perform actions on resources (nouns):

| HTTP Method | Real-Life Meaning | Example URL | What It Does in WorkSpace |
| :--- | :--- | :--- | :--- |
| **GET** | *"Read / Fetch"* | `GET /api/workspaces` | Retrieves all workspaces you belong to |
| **POST** | *"Create New"* | `POST /api/workspaces` | Creates a brand new workspace |
| **PATCH** | *"Update Part of It"* | `PATCH /api/tasks/123` | Changes just the status or due date of task 123 |
| **PUT** | *"Replace Completely"*| `PUT /api/profile` | Replaces an entire profile document |
| **DELETE** | *"Delete / Remove"* | `DELETE /api/tasks/123` | Deletes task 123 forever |

---

## 4. HTTP Status Codes Explained Like a Human

Every time our Express server answers a request, it sends a **3-digit status code**:

* **2xx = Success!**
  * `200 OK`: "Everything went great, here is your data."
  * `201 Created`: "Success! The new task or user was successfully created."
* **4xx = Client Error (The user made a mistake):**
  * `400 Bad Request`: "You forgot to provide a task title or email."
  * `401 Unauthorized`: "You are not logged in! Show me your token."
  * `403 Forbidden`: "You are logged in, but you don't belong to this private workspace. Access denied!"
  * `404 Not Found`: "That project ID does not exist."
  * `409 Conflict`: "An account with this email already exists."
* **5xx = Server Error (Something broke in our code):**
  * `500 Internal Server Error`: "Oops, a bug crashed the server."

---

## 5. What is Middleware? (The Security Guards)

In Express, **Middleware** is a function that sits between when a request arrives and when the final response is sent.

Think of it like entering an exclusive VIP building:

```
 Incoming Request ───► [ Guard 1: express.json() ]  (Checks: Is the bag clean JSON?)
                                │
                                ▼
                       [ Guard 2: authenticate ]    (Checks: Does the visitor have a valid badge/JWT?)
                                │
                                ▼
                       [ Guard 3: requireRole ]     (Checks: Is this visitor an Owner or Admin?)
                                │
                                ▼
                       [ Final Destination: Controller ] (Executes the actual task creation!)
```

### In Our Code:
Look at [`server/src/routes/workspaceRoutes.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/routes/workspaceRoutes.js):
```javascript
router.route('/:workspaceId')
  .get(requireWorkspaceMember(), getWorkspaceById)
  .delete(requireWorkspaceMember(['owner']), deleteWorkspace);
```
* Anyone can call `DELETE /api/workspaces/123`, but `requireWorkspaceMember(['owner'])` stops the request at the door unless the user has the **`owner`** role!

---

## 6. Controllers vs Routes: Keeping Code Clean

To keep our code organized as our app grows, we use the **MVC (Model-View-Controller)** pattern:

1. **Routes (`src/routes/`)**: Only define the URL path and which guards to apply.
   * *"When someone sends a POST to `/register`, send them to `authController.register`"*.
2. **Controllers (`src/controllers/`)**: The actual brain/logic.
   * Checks if user already exists, hashes the password, creates the record, and returns the response.
3. **Models (`src/models/`)**: Defines what the database documents look like.

---

## 💡 Teacher's Key Takeaways

1. **Never put business logic inside route files**: Routes should only be 10–20 lines long, simply routing traffic to controllers.
2. **Always send appropriate status codes**: Never return `200 OK` if something failed. If validation fails, return `400`. If someone is unauthenticated, return `401`.
3. **Graceful Error Handling**: Our centralized [`errorHandler.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/middleware/errorHandler.js) catches any unexpected crash and sends a safe JSON error to the user without crashing the server process.
