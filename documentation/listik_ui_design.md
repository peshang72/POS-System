# Lîstik - User Interface Design Document

## Layout Structure

- **Primary Layout**: Modular gaming console-inspired interface with a persistent sidebar navigation
- **Sidebar**: Fixed left-side vertical navigation with icon-based quick access, adaptive frequent actions section, and user profile at bottom
- **Main Content Area**: Dynamic, modular tile/card-based layout that changes based on the selected function
- **Modal System**: Overlay modals for focused tasks (e.g., checkout, advanced settings)
- **Header Bar**: Minimal top bar with context-aware title, search function, and global actions (language toggle, notifications)

## Core Components

### Sidebar Navigation

- **Quick Access Icons**: Large, recognizable icons for primary functions (POS, Inventory, Customers, Reports, Staff)
- **Adaptive Section**: Middle section that displays and reorders based on frequently used actions
- **User Profile**: Bottom-positioned user avatar with role indicator, quick access to profile settings and logout
- **Collapsible Design**: Can be collapsed to icon-only view to maximize screen space

### Dashboard

- **Modular Tiles**: Resizable and repositionable information cards
- **Role-Based Defaults**: Preconfigured dashboard layouts based on user role
- **Key Metrics**: Visual representations of daily sales, inventory alerts, and staff performance
- **Quick Actions**: One-click access to common tasks (new sale, add inventory, daily reports)

### POS Interface

- **Dual-Panel Layout**: Product browsing/search on left, cart contents on right
- **Category Navigation**: Horizontally scrollable product categories with visual icons
- **Product Grid**: Card-based product display with image, name, price and stock indicator
- **Cart Panel**: Real-time calculation display, customer selection, payment method options
- **Checkout Flow**: Step-based process with clear visual progression indicators

### Inventory Management

- **Grid/List Toggle Views**: Switch between visual grid and detailed list of inventory
- **Filter Panel**: Collapsible side panel with comprehensive filtering options
- **Batch Actions**: Multi-select capability with batch operations menu
- **Stock Alerts**: Color-coded visual indicators for stock levels
- **Quick Edit**: Inline editing capabilities for quick modifications

### Reports Interface

- **Template Gallery**: Visual selection of report types with preview thumbnails
- **Interactive Charts**: Dynamic, clickable data visualizations with drill-down capability
- **Parameter Controls**: Intuitive date range and filter controls
- **Export Options**: Prominent, clearly labeled export functionality

## Interaction Patterns

- **Touch Optimization**: Large touch targets for tablet/touchscreen use
- **Keyboard Shortcuts**: Comprehensive shortcut system for power users (with visual reference)
- **Drag-and-Drop**: Intuitive drag-and-drop for dashboard customization and cart management
- **Gesture Support**: Swipe actions for common tasks on touch devices
- **Progressive Disclosure**: Complex functions revealed progressively to reduce cognitive load
- **Contextual Actions**: Right-click or long-press menus for context-specific options
- **Real-time Feedback**: Immediate visual feedback for all user actions
- **Error Prevention**: Confirmation for destructive actions with clear recovery paths

## Visual Design Elements & Color Scheme

- **Primary Background**: Dark gray/black gradient (#121212 to #1E1E1E)
- **Secondary Background**: Slightly lighter dark gray for cards/containers (#262626)
- **Primary Accent**: RGB customizable accent color (default: #7E3FF2 purple)
- **Secondary Accents**: Complementary neon colors for status indicators and highlights
  - Success/Positive: #36F2A3 (neon green)
  - Warning/Alert: #F2B705 (amber)
  - Error/Negative: #F23557 (neon red)
  - Info/Neutral: #3D9CF2 (neon blue)
- **Subtle RGB Effects**: Light border glow effects on active elements
- **Iconography**: Outlined icon style with consistent stroke weight
- **Visual Hierarchy**: Distinct elevation levels through subtle shadows and highlights

## Mobile, Web App, Desktop Considerations

### Desktop Application

- **Multi-monitor Support**: Detachable panels for dual-screen setups
- **Window Management**: Restore state and layout between sessions
- **Hardware Integration**: Direct communication with POS peripherals
- **Offline Capability**: Full functionality when internet connection is limited

### Web Application

- **Responsive Breakpoints**: Fluid adaptation to various screen sizes
- **Progressive Web App**: Installable with offline capabilities
- **Cross-browser Compatibility**: Consistent experience across modern browsers
- **Session Management**: Secure timeout and authentication handling

### Mobile/Tablet Adaptations

- **Touch-First Design**: Reorganized layouts optimized for touch interaction
- **Simplified Views**: Focused functionality for mobile contexts
- **Barcode Scanning**: Native camera integration for product lookup
- **Compact Navigation**: Bottom navigation bar replacing sidebar on small screens

## Typography

- **Primary Font**: Rajdhani - a geometric sans-serif with gaming aesthetics
- **Secondary Font**: Inter - clean, highly readable sans-serif for detailed information
- **Font Hierarchy**:
  - Page Titles: Rajdhani Bold, 24px
  - Section Headers: Rajdhani Medium, 18px
  - Body Text: Inter Regular, 14px
  - Small Text/Labels: Inter Medium, 12px
- **Line Height**: 1.5 for optimal readability on dark backgrounds
- **Font Weight Usage**: Strategic use of weights to create hierarchy without color dependence
- **RTL Support**: Full support for Kurdish with appropriate font substitution

## Accessibility

- **Color Contrast**: Minimum 4.5:1 contrast ratio for all text elements
- **Non-color Indicators**: Additional visual cues beyond color for status indication
- **Keyboard Navigation**: Complete keyboard accessibility with visible focus states
- **Screen Reader Support**: Semantic markup and ARIA labels throughout
- **Text Scaling**: Proper handling of text resizing up to 200%
- **Focus Management**: Clear visual indicators of focused elements
- **Reduced Motion Option**: Alternative transitions for users with motion sensitivity
- **Language Switching**: Seamless toggling between English and Kurdish with RTL support
- **Error Identification**: Multiple cues for identifying and resolving errors
