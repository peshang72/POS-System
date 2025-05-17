# DigitalOcean App Platform Deployment

This directory contains configuration files and documentation for deploying this application on DigitalOcean App Platform.

## Configuration Files

- `app.yaml`: Main App Platform configuration file in the root of the project
- `.do/deploy.template.yaml`: Additional deployment configuration

## Environment Variables

The following environment variables need to be set in the DigitalOcean App Platform dashboard:

- `NODE_ENV`: Set to "production"
- `MONGO_URI`: MongoDB connection string (will be automatically populated if using managed MongoDB)
- `JWT_SECRET`: Secure string for JWT token generation
- `JWT_EXPIRE`: "1d" (1 day token expiration)
- `JWT_COOKIE_EXPIRE`: "1" (1 day cookie expiration)
