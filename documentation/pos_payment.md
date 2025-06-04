# POS Payment System

This document outlines the payment functionality implemented in the Lîstik Store POS system.

## Cash Payment

Cash payments are currently supported, allowing cashiers to:

1. Process sales with cash payment
2. Enter the amount tendered by the customer
3. Calculate and display change automatically
4. Complete the transaction, which:
   - Creates a transaction record
   - Updates product inventory
   - Awards loyalty points (if applicable)
   - Generates a receipt

### Implementation Details

The cash payment system is implemented with the following components:

#### Frontend (React)

- **Receipt Preview Component**: Updated to include cash payment input fields

  - Displays total amount due
  - Provides input for amount tendered
  - Calculates and displays change
  - Enables transaction confirmation only when a valid amount is entered

- **POS Component**:

  - Prepares transaction data including payment method and details
  - Sends transaction to server via API
  - Displays success/error notifications
  - Resets cart after successful transaction

- **UI Animations with Tailwind**:
  - Custom animations defined in `tailwind.config.js`
  - Smooth fade-in and slide-up transitions for notifications
  - Animated shadows for buttons and product cards
  - Responsive design with transition effects

#### Backend (Node.js/MongoDB)

- **Transaction Controller**:

  - Creates transaction records in database
  - Updates inventory quantities for sold products
  - Handles loyalty point calculations and awards
  - Generates invoice numbers

- **Inventory Management**:
  - Automatically decreases product quantities based on sales
  - Creates inventory records for tracking purposes
  - Handles product stock updates

### Payment Flow

1. Customer items are added to cart
2. Cashier clicks "Checkout"
3. Customer is selected (or guest option)
4. Receipt preview is shown with payment options
5. Cashier enters cash amount received
6. System calculates change
7. Cashier confirms the transaction
8. Server processes transaction and updates inventory
9. Receipt is displayed with transaction details
10. Cashier can print receipt or start a new sale

### Future Payment Methods

The system is designed to easily accommodate additional payment methods in the future:

- Credit/Debit Card
- Mobile Payment
- Store Credit
- Mixed Payment (multiple payment methods)

## Security Considerations

- All transactions are logged with cashier information
- Transaction history is maintained for auditing
- Receipts include unique transaction IDs for reference
- Session-based authentication ensures only authorized users can process transactions

## Troubleshooting

If a transaction fails:

1. Check server connection
2. Verify product availability in inventory
3. Confirm customer information if a customer was selected
4. Check transaction logs for specific error messages
