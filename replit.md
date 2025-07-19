# Street Food Ordering Application

## Overview

This is a full-stack street food ordering application built with React, Express.js, and PostgreSQL. The application serves as a digital ordering system for a street food cart, featuring role-based access for customers, admins, and owners. It includes a complete ordering workflow with real-time queue management, payment processing, and business analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React Context API with useReducer pattern
- **Routing**: React Router for client-side navigation
- **Data Fetching**: TanStack Query for server state management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
 - **Database**: PostgreSQL with Supabase serverless database
- **ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: Connect-pg-simple for PostgreSQL session storage

### UI/UX Design
- **Component System**: Radix UI primitives with custom styling
- **Theme**: Light/dark mode support with CSS variables
- **Responsive Design**: Mobile-first approach with Tailwind breakpoints
- **Icons**: Lucide React icon library

## Key Components

### Role-Based Access System
The application supports three distinct user roles:
- **Customer**: Browse menu, place orders, track order status
- **Admin**: Manage kitchen operations, update order statuses
- **Owner**: View business analytics, manage customer issues

### Menu Management
- Static menu data with categorized items (snacks, beverages)
- Real-time availability tracking
- Image assets for visual appeal
- Price management and special instructions support

### Order Processing Workflow
1. **Cart Management**: Add/remove items with quantity tracking
2. **Customer Information**: Name and phone number collection
3. **Payment Processing**: Sandbox payment processing via Square
4. **Queue Management**: Real-time order tracking with queue numbers
5. **Status Updates**: Pending → Preparing → Ready → Served workflow

### Authentication System
- Phone-based OTP authentication
- Test user support for development
- Session management with local storage fallback
- Role switching for demonstration purposes

## Data Flow

### Order Lifecycle
1. Customer adds items to cart through MenuCard components
2. CartFloat component manages cart state and checkout process
3. PaymentModal handles payment information collection
4. Order creation generates queue number and estimated time
5. AdminPanel allows kitchen staff to update order status
6. OrderQueue displays real-time status to customers
7. Completed orders feed into analytics dashboard

### State Management
- Global application state managed through AppContext
- Cart state synchronized across components
- Order status updates propagate through context
- Theme preferences persisted in local storage

### Real-time Updates
- Order status changes reflect immediately in UI
- Queue display updates automatically
- Toast notifications for user feedback
- Live time tracking for order estimates

## External Dependencies

### Core Framework Dependencies
- **React ecosystem**: React, React DOM, React Router
- **State management**: TanStack Query for server state
- **UI components**: Radix UI primitives, shadcn/ui components
- **Styling**: Tailwind CSS, class-variance-authority for component variants

### Database and Backend
- **Database**: Supabase PostgreSQL serverless database
- **ORM**: Drizzle ORM with TypeScript support
- **Validation**: Zod for schema validation
- **Session storage**: connect-pg-simple for PostgreSQL sessions

### Development Tools
- **Build tools**: Vite, esbuild for production builds
- **Type checking**: TypeScript with strict configuration
- **Code quality**: ESLint configuration (implied)
- **Development server**: Vite dev server with HMR

### Utility Libraries
- **Date handling**: date-fns for date manipulation
- **Styling utilities**: clsx, tailwind-merge for conditional classes
- **Icons**: Lucide React for consistent iconography
- **Form handling**: React Hook Form with resolvers

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- TypeScript compilation with strict type checking
- Environment variable configuration for database URL
- Replit-specific integrations for cloud development

### Production Build Process
1. **Frontend**: Vite builds optimized static assets to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations handle schema updates
4. **Assets**: Static assets served from build directory

-### Environment Configuration
- Supabase connection string required for PostgreSQL access
- NODE_ENV differentiation for development/production
- Build scripts handle both frontend and backend compilation
- Database schema managed through Drizzle migrations
- Square API credentials stored in `.env` (SQUARE_ACCESS_TOKEN, SQUARE_APPLICATION_ID, SQUARE_ENVIRONMENT)

### Hosting Considerations
- Express server serves both API routes and static frontend
- PostgreSQL database requires connection string configuration
- Session storage requires database table setup
- Error handling middleware for production stability