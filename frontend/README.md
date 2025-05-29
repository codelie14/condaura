# Condaura Frontend

This is the frontend application for Condaura, a platform for access review campaigns.

## Overview

Condaura allows organizations to:
- Create and manage access review campaigns
- Assign reviewers to access rights
- Review and make decisions on access rights
- Generate reports on campaign progress and results
- Notify users about pending reviews and updates

## Technologies

- React 18+ with TypeScript
- TailwindCSS for styling
- React Router for navigation
- Formik and Yup for form handling and validation
- Axios for API communication
- React Query for data fetching and caching

## Getting Started

### Prerequisites

- Node.js 16+ and npm installed
- Backend API running (see backend documentation)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
Create a `.env` file in the root directory with:
```
REACT_APP_API_URL=http://localhost:8000/api
```

3. Start the development server:
```bash
npm start
```

The application will be available at http://localhost:3000.

## Project Structure

```
frontend/
├── public/                 # Static files
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── campaigns/      # Campaign management components
│   │   ├── common/         # Common components (layout, etc.)
│   │   ├── reviews/        # Review components
│   │   └── users/          # User management components
│   ├── contexts/           # React contexts
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   ├── utils/              # Utility functions
│   ├── App.tsx             # Application entry point
│   └── index.tsx           # React entry point
└── package.json            # Project dependencies
```

## Features

### Authentication
- Login with email/password
- Registration for new users
- Password reset

### Dashboard
- Overview of review progress
- Recent notifications
- Active campaigns

### Campaign Management
- Create and configure campaigns
- Assign reviewers to access reviews
- Track campaign progress

### Access Reviews
- Review assigned access rights
- Approve or revoke access with comments
- Bulk actions for multiple reviews

### Notifications
- In-app notifications
- Mark notifications as read
- Filter notifications by type

## Building for Production

To build the application for production:

```bash
npm run build
```

This will create optimized files in the `build` directory ready for deployment.

## Deployment

The application can be deployed to any static hosting service. Simply upload the contents of the `build` directory after running the build command.

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the proprietary license - see the LICENSE file for details.
