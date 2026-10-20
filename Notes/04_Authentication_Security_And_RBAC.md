# 📕 Lecture 4: Authentication, Security & Role-Based Access Control (RBAC)

In this lesson, we cover one of the most critical aspects of any SaaS application: **keeping user accounts safe, preventing unauthorized access, and enforcing permissions**.

---

## 1. The Golden Rule of Passwords: Never Plaintext!

Imagine a database storing passwords in plain English:
```json
{
  "email": "user@example.com",
  "password": "Password123"  // ❌ NEVER DO THIS!
}
```
If a rogue employee or hacker breaches the database, every single user's password is stolen immediately.

### How Bcrypt Hashing Works (The One-Way Meat Grinder)
In our [`models/User.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/models/User.js), we use **Bcrypt**:
1. When you enter `"Password123"`, Bcrypt adds a random string of characters (called a **Salt**).
2. It runs the password through a complex mathematical grinder 10 times (`saltRounds = 10`).
3. It produces a one-way scrambled string:
   ```text
   $2a$10$7R0Z4iQ8j.FzGzO9bYvPwe4wK8X9wQc7rT1u6yI8vF5h4s3a2
   ```
4. **It is mathematically impossible to reverse-engineer the original password from the hash!**
5. When the user logs in later, Bcrypt hashes their entered password and checks if the two hashes match (`bcrypt.compare`).

---

## 2. What is a JWT (JSON Web Token)?

Once a user logs in successfully, how does the server know who they are on future requests? HTTP is "stateless"—by default, it forgets who you are after every request!

### The Concert Wristband Analogy
Think of a **JWT** like a waterproof VIP wristband given to you at a concert:

```
┌────────────────────────────────────────────────────────┐
│               JSON WEB TOKEN (JWT)                     │
│                                                        │
│  HEADER:    { "alg": "HS256", "typ": "JWT" }           │
│  PAYLOAD:   { "id": "123", "email": "alex@mail.com" }  │
│  SIGNATURE: HMACSHA256(header + payload, SECRET_KEY)   │
└────────────────────────────────────────────────────────┘
```

1. You show your ID and ticket at the entrance (Username + Password).
2. The security guard stamps a holographic wristband onto your arm (**JWT signed with `JWT_SECRET`**).
3. Every time you enter a room or order a drink, you don't show your ID again—you simply flash your wristband!
4. If an impostor tries to write their own wristband, the server checks the holographic signature using its private `JWT_SECRET`. Since the impostor doesn't know the secret, the fake wristband is rejected instantly!

---

## 3. The Token Lifecycle in WorkSpace

Here is how the authentication handshake works:

```
[ BROWSER ]                                                [ SERVER ]
     │                                                          │
     │ 1. POST /api/auth/login { email, password }              │
     ├─────────────────────────────────────────────────────────►│
     │                                                          │ 2. Verifies password
     │                                                          │ 3. Generates JWT
     │ 4. Receives JWT & saves to localStorage                  │
     │◄─────────────────────────────────────────────────────────┤
     │                                                          │
     │ 5. GET /api/workspaces (Header: Bearer <token>)          │
     ├─────────────────────────────────────────────────────────►│
     │                                                          │ 6. authMiddleware verifies token
     │                                                          │ 7. req.user = currentUser
     │ 8. Receives workspaces JSON                              │
     │◄─────────────────────────────────────────────────────────┤
```

---

## 4. Role-Based Access Control (RBAC)

In a professional SaaS, not all users have the same power. In WorkSpace, we defined three tiers:

| Action | Owner | Admin | Member |
| :--- | :---: | :---: | :---: |
| **Delete Workspace** | ✅ | ❌ | ❌ |
| **Change Workspace Name** | ✅ | ❌ | ❌ |
| **Invite Team Members** | ✅ | ✅ | ❌ |
| **Change Member Roles** | ✅ | ✅ (Cannot touch Owner) | ❌ |
| **Create & Manage Projects** | ✅ | ✅ | ✅ |
| **Create & Update Tasks** | ✅ | ✅ | ✅ |
| **Comment on Tasks** | ✅ | ✅ | ✅ |

### Server-Side Enforcement (The IDOR Guard)
A common beginner mistake is to hide the "Delete Workspace" button in React for non-owners, but forget to protect the backend route. A clever user could open DevTools or Postman and send `DELETE /api/workspaces/123`.

This is called an **IDOR** (*Insecure Direct Object Reference*).

In our [`middleware/rbacMiddleware.js`](file:///e:/antigravity-projects/WorkSpace%20%E2%80%94%20Project%20management%20SaaS/server/src/middleware/rbacMiddleware.js), we stop this:
```javascript
const requireWorkspaceMember = (allowedRoles) => {
  return async (req, res, next) => {
    // 1. Check if user is actually a member of this workspace
    const membership = await Membership.findOne({ workspace: workspaceId, user: req.user.id });
    if (!membership) {
      return res.status(403).json({ message: "Access denied: Not a member" });
    }

    // 2. Check if their role is permitted
    if (!allowedRoles.includes(membership.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};
```

---

## 💡 Teacher's Key Takeaways

1. **Hiding a button in React is NOT security**: Security must always be enforced on the backend Express routes.
2. **Never commit `JWT_SECRET` to GitHub**: Keep secrets strictly in `.env` files. If someone gets your `JWT_SECRET`, they can forge tokens for any user!
3. **Session Restoration**: When the user refreshes the page, our React app calls `GET /api/auth/me` to verify the stored token and restore their logged-in state without prompting for credentials again.
