# Gaming Store POS System - Software Requirements Specification

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
    - username: String
    - password: String (hashed)
    - role: String (enum: admin, manager, cashier)
    - name: String
    - email: String
    - phone: String
    - active: Boolean
    - languagePreference: String (en/ku)
    - createdAt: Date
    - updatedAt: Date

  - **Products**:

    - \_id: ObjectId
    - sku: String
    - barcode: String
    - name: {en: String, ku: String}
    - description: {en: String, ku: String}
    - category: ObjectId (ref: Categories)
    - price: Number
    - cost: Number
    - quantity: Number
    - reorderLevel: Number
    - images: [String]
    - attributes: Object
    - active: Boolean
    - createdAt: Date
    - updatedAt: Date

  - **Categories**:
    - \_id: ObjectId
    - name: {en: String, ku: String}
    - parent: ObjectId (ref: Categories)
    - image: String
    - active: Boolean
  - **Customers**:

    - \_id: ObjectId
    - name: String
    - phone: String
    - email: String
    - address: String
    - loyaltyPoints: Number
    - languagePreference: String (en/ku)
    - createdAt: Date
    - updatedAt: Date

  - **Transactions**:
    - \_id: ObjectId
    - invoiceNumber: String
    - customer: ObjectId (ref: Customers)
    - items: [{
      product: ObjectId (ref: Products),
      quantity: Number,
      price: Number,
      discount: Number
      }]
    - subtotal: Number
    - tax: Number
    - discount: Number
    - total: Number
    - paymentMethod: String
    - paymentStatus: String
    - cashier: ObjectId (ref: Users)
    - refunded: Boolean
    - refundReason: String
    - createdAt: Date
  - **StaffActivity**:
    - \_id: ObjectId
    - staff: ObjectId (ref: Users)
    - action: String
    - details: Object
    - timestamp: Date
  - **StaffFinance**:
    - \_id: ObjectId
    - staff: ObjectId (ref: Users)
    - type: String (enum: expense, loan, repayment)
    - amount: Number
    - description: String
    - status: String (enum: pending, approved, rejected)
    - approvedBy: ObjectId (ref: Users)
    - createdAt: Date
    - updatedAt: Date
  - **Settings**:
    - \_id: ObjectId
    - key: String
    - value: Mixed
    - updatedBy: ObjectId (ref: Users)
    - updatedAt: Date
