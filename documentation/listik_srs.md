# Lîstik - Software Requirements Specification

## System Design

- **Application Type**: Web application wrapped with Electron for desktop functionality
- **Deployment Model**: Local installation with potential for cloud synchronization
- **System Components**:
  - Frontend client (React)
  - Backend API server (Node.js/Express)
  - Database (MongoDB)
  - Authentication service
  - Hardware integration layer for POS peripherals

## Architecture Pattern

- **Primary Pattern**: MERN Stack (MongoDB, Express, React, Node.js)
- **Frontend Architecture**: Component-based architecture using React with custom hooks
- **Backend Architecture**: RESTful API with Express.js
- **Desktop Wrapper**: Electron to provide native desktop experience and hardware access
- **Offline Capability**: Service workers and local database synchronization

## State Management

- **Frontend**: React Context API for global state management with Redux for complex state
- **Persistence**: LocalStorage/IndexedDB for offline capabilities
- **Real-time Updates**: Socket.io for instant updates across POS terminals
- **Form State**: React Hook Form for complex form management
- **Query Management**: React Query for server state and caching

## Data Flow

- **Client-Server Communication**: RESTful API calls with JWT authentication
- **Real-time Updates**: WebSockets for inventory, sales, and notification updates
- **Offline Operation Flow**:
  - Local data storage when offline
  - Synchronization queue for pending operations
  - Conflict resolution strategy when reconnecting
- **Event-driven Architecture**: For real-time dashboard updates and notifications

## Technical Stack

- **Frontend**:
  - React.js for UI components
  - Tailwind CSS for styling with a dark theme preset
  - Shadcn UI components for consistent design
  - Lucide icons for visual elements
  - Chart.js/D3.js for data visualization
  - React Router for navigation
  - i18next for internationalization (English/Kurdish with RTL support)
- **Backend**:
  - Node.js with Express framework
  - MongoDB for primary database
  - Mongoose for data modeling
  - Passport.js for authentication
  - Node-thermal-printer for receipt printing
  - Multer for file uploads
- **Desktop Application**:
  - Electron for desktop wrapping
  - Electron Builder for packaging
  - Node-serialport for hardware integration
- **DevOps**:
  - ESLint/Prettier for code quality
  - Jest for testing
  - GitHub Actions for CI/CD

## Authentication Process

- **Authentication Method**: JWT-based authentication
- **User Roles**:
  - Admin: Full system access
  - Manager: Limited administrative access
  - Cashier: POS and basic operations access
- **Login Flow**:
  - Username/password authentication
  - Role-based redirection
  - Session management
  - Idle timeout handling
- **Security Measures**:
  - Password hashing with bcrypt
  - JWT token expiration and refresh mechanism
  - Role-based access control middleware
  - Input validation and sanitization

## Route Design

- **Frontend Routes**:
  - `/` - Dashboard
  - `/login` - Authentication
  - `/pos` - Point of Sale interface
  - `/inventory` - Inventory management
  - `/customers` - Customer management
  - `/staff` - Staff management
  - `/reports` - Reporting and analytics
  - `/settings` - System configuration
- **API Routes**:
  - `/api/auth` - Authentication endpoints
  - `/api/products` - Product/inventory management
  - `/api/transactions` - Sales and transaction processing
  - `/api/customers` - Customer data management
  - `/api/staff` - Staff management
  - `/api/reports` - Report generation
  - `/api/settings` - System configuration

## API Design

- **RESTful Endpoints**:
  - Authentication:
    - `POST /api/auth/login` - User login
    - `POST /api/auth/logout` - User logout
    - `GET /api/auth/me` - Get current user
  - Products:
    - `GET /api/products` - List products
    - `POST /api/products` - Create product
    - `GET /api/products/:id` - Get product details
    - `PUT /api/products/:id` - Update product
    - `DELETE /api/products/:id` - Delete product
    - `GET /api/products/categories` - List categories
  - Transactions:
    - `POST /api/transactions` - Create new transaction
    - `GET /api/transactions` - List transactions
    - `GET /api/transactions/:id` - Get transaction details
    - `POST /api/transactions/:id/refund` - Process refund
  - Customers:
    - `GET /api/customers` - List customers
    - `POST /api/customers` - Create customer
    - `GET /api/customers/:id` - Get customer details
    - `PUT /api/customers/:id` - Update customer
    - `GET /api/customers/:id/transactions` - Customer history
  - Staff:
    - `GET /api/staff` - List staff
    - `POST /api/staff` - Create staff
    - `GET /api/staff/:id` - Get staff details
    - `PUT /api/staff/:id` - Update staff
    - `GET /api/staff/:id/activities` - Staff activity log
    - `POST /api/staff/:id/expenses` - Record staff expense
    - `POST /api/staff/:id/loans` - Record staff loan
  - Reports:
    - `GET /api/reports/sales` - Sales reports
    - `GET /api/reports/inventory` - Inventory reports
    - `GET /api/reports/staff` - Staff performance reports
    - `GET /api/reports/customers` - Customer engagement reports
- **Response Format**:
  - Standard JSON response structure
  - Consistent error handling format
  - Pagination for list endpoints

## Database Design ERD

- **Collections**:

  - **Users**:

    - \_id: ObjectId
    - username: String (required, unique, indexed)
    - password: String (hashed, required)
    - role: String (enum: ["admin", "manager", "cashier"], required, indexed)
    - firstName: String (required)
    - lastName: String (required)
    - email: String (required, unique, indexed)
    - phone: String (validated format)
    - active: Boolean (default: true, indexed)
    - languagePreference: String (enum: ["en", "ku"], default: "en")
    - lastLogin: Date
    - createdAt: Date (default: Date.now)
    - updatedAt: Date (default: Date.now)

  - **Products**:

    - \_id: ObjectId
    - sku: String (required, unique, indexed)
    - barcode: String (unique, indexed, sparse)
    - name: {
      en: String (required),
      ku: String
      }
    - description: {
      en: String,
      ku: String
      }
    - category: ObjectId (ref: "Categories", required, indexed)
    - price: Number (required, min: 0)
    - cost: Number (required, min: 0)
    - quantity: Number (required, min: 0, default: 0)
    - reorderLevel: Number (min: 0)
    - images: [String] (URLs, validated)
    - attributes: {
      weight: Number,
      color: String,
      size: String,
      // Other standardized attributes
      }
    - active: Boolean (default: true, indexed)
    - tags: [String] (indexed)
    - createdAt: Date (default: Date.now)
    - updatedAt: Date (default: Date.now)

  - **Categories**:
    - \_id: ObjectId
    - name: {
      en: String (required),
      ku: String
      }
    - parent: ObjectId (ref: "Categories", indexed, sparse)
    - level: Number (required, indexed)
    - path: [ObjectId] (array of ancestor categories)
    - image: String (URL, validated)
    - active: Boolean (default: true, indexed)
    - createdAt: Date (default: Date.now)
    - updatedAt: Date (default: Date.now)
  - **Customers**:

    - \_id: ObjectId
    - firstName: String (required)
    - lastName: String (required)
    - phone: String (required, unique, indexed, validated format)
    - email: String (unique, indexed, sparse, validated format)
    - address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String (default: "Iraq")
      }
    - loyaltyPoints: Number (default: 0, min: 0)
    - memberSince: Date (default: Date.now)
    - lastPurchase: Date
    - totalSpent: Number (default: 0, min: 0)
    - purchaseCount: Number (default: 0, min: 0)
    - languagePreference: String (enum: ["en", "ku"], default: "en")
    - active: Boolean (default: true, indexed)
    - tags: [String] (indexed)
    - createdAt: Date (default: Date.now)
    - updatedAt: Date (default: Date.now)

  - **Transactions**:

    - \_id: ObjectId
    - invoiceNumber: String (required, unique, indexed)
    - transactionDate: Date (required, default: Date.now, indexed)
    - customer: ObjectId (ref: "Customers", indexed, sparse)
    - items: [{
      product: ObjectId (ref: "Products", required),
      productSnapshot: {
      name: {en: String, ku: String},
      sku: String,
      price: Number
      },
      quantity: Number (required, min: 0.01),
      unitPrice: Number (required, min: 0),
      discount: Number (default: 0, min: 0),
      discountType: String (enum: ["percentage", "fixed"], default: "fixed"),
      subtotal: Number (required, min: 0)
      }]
    - subtotal: Number (required, min: 0)
    - taxRate: Number (default: 0, min: 0)
    - taxAmount: Number (default: 0, min: 0)
    - discountAmount: Number (default: 0, min: 0)
    - discountReason: String
    - total: Number (required, min: 0)
    - paymentMethod: String (enum: ["cash", "card", "transfer", "credit", "mixed"], required)
    - paymentDetails: {
      amountTendered: Number,
      change: Number,
      cardType: String,
      cardLast4: String,
      authorizationCode: String
      }
    - paymentStatus: String (enum: ["paid", "partial", "pending", "failed"], required, indexed)
    - cashier: ObjectId (ref: "Users", required, indexed)
    - register: String (required)
    - refunded: Boolean (default: false, indexed)
    - refundReason: String
    - refundDate: Date
    - refundedBy: ObjectId (ref: "Users")
    - notes: String
    - createdAt: Date (default: Date.now)

  - **Inventory**:
    - \_id: ObjectId
    - product: ObjectId (ref: "Products", required, indexed)
    - type: String (enum: ["purchase", "sale", "adjustment", "return", "transfer"], required, indexed)
    - quantity: Number (required)
    - remainingQuantity: Number (required)
    - unitCost: Number (for purchases)
    - reference: {
      type: String (enum: ["transaction", "purchase", "adjustment"]),
      id: ObjectId
      }
    - notes: String
    - performedBy: ObjectId (ref: "Users", required)
    - timestamp: Date (default: Date.now, indexed)
  - **StaffActivity**:

    - \_id: ObjectId
    - staff: ObjectId (ref: "Users", required, indexed)
    - actionType: String (enum: ["login", "logout", "create", "update", "delete", "void", "refund"], required, indexed)
    - resourceType: String (enum: ["product", "transaction", "customer", "user", "setting"], indexed)
    - resourceId: ObjectId (indexed, sparse)
    - details: {
      before: Mixed,
      after: Mixed,
      reason: String
      }
    - ipAddress: String
    - timestamp: Date (default: Date.now, indexed)

  - **StaffFinance**:
    - \_id: ObjectId
    - staff: ObjectId (ref: "Users", required, indexed)
    - type: String (enum: ["expense", "loan", "repayment", "salary", "bonus"], required, indexed)
    - amount: Number (required, min: 0)
    - description: String (required)
    - date: Date (required, default: Date.now, indexed)
    - status: String (enum: ["pending", "approved", "rejected"], default: "pending", indexed)
    - approvedBy: ObjectId (ref: "Users", indexed, sparse)
    - approvedAt: Date
    - createdAt: Date (default: Date.now)
    - updatedAt: Date (default: Date.now)
  - **Settings**:

    - \_id: ObjectId
    - category: String (required, indexed)
    - key: String (required, indexed)
    - value: Mixed (required)
    - dataType: String (enum: ["string", "number", "boolean", "object", "array"], required)
    - description: String
    - updatedBy: ObjectId (ref: "Users")
    - updatedAt: Date (default: Date.now)

  - **Audit**:
    - \_id: ObjectId
    - user: ObjectId (ref: "Users", required, indexed)
    - action: String (required, indexed)
    - collection: String (required, indexed)
    - documentId: ObjectId (indexed)
    - changes: {
      before: Mixed,
      after: Mixed
      }
    - timestamp: Date (default: Date.now, indexed)
    - ipAddress: String