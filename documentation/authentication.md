# Authentication and Authorization in Listik POS

This document outlines the authentication and authorization system implemented in the Listik POS application.

## Overview

The application uses JWT (JSON Web Tokens) for authentication with role-based access control for authorization. The system supports three user roles:

1. **Admin** - Has full access to all system features
2. **Manager** - Has access to most features except certain administrative functions
3. **Cashier** - Has limited access focused on POS operations

## Initial Setup

To create the initial admin user, run the following command from the server directory:

```bash
node src/scripts/create-admin.js
```

This will create an admin user with the following credentials:

- Username: `admin`
- Password: `admin123`

**Important**: For security reasons, change the admin password after the first login.

## Authentication Flow

1. **Login**: Users authenticate by sending credentials to `/api/auth/login`
2. **Token**: Upon successful authentication, the server returns a JWT token
3. **Authorization**: The client includes this token in the Authorization header for subsequent requests
4. **Verification**: The server verifies the token for all protected routes

## Role-Based Authorization

The application uses middleware to enforce role-based access:

- **protect**: Ensures the user is authenticated
- **authorize**: Checks if the authenticated user has the required role(s)

Example usage:

```javascript
// All authenticated users can access this route
router.get("/resource", resourceController.getResource);

// Only admin and manager roles can access this route
router.post(
  "/resource",
  authorize("admin", "manager"),
  resourceController.createResource
);

// Only admin can access this route
router.delete(
  "/resource/:id",
  authorize("admin"),
  resourceController.deleteResource
);
```

## Security Best Practices

1. Always use HTTPS in production
2. Tokens expire after a set time period (configured in config.js)
3. Passwords are hashed using bcrypt before storage
4. Sensitive operations require re-authentication
5. Failed login attempts are logged for security monitoring

## Troubleshooting

- **401 Unauthorized**: The user is not authenticated or the token has expired
- **403 Forbidden**: The user does not have the required role to access the resource
- **Token Expiration**: If users report being unexpectedly logged out, check the token expiration time in config.js
