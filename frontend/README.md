# Condaura Frontend

This is the frontend application for Condaura, a platform for access review campaigns.

## Technologies Used

- React 19.1 with TypeScript
- React Router 6.30 for navigation
- Tailwind CSS for styling
- Axios for API requests
- React Toastify for notifications
- Chart.js and React-Chartjs-2 for data visualization
- Formik and Yup for form validation

## Features Implemented

The frontend application includes the following features:

- **Authentication**: Login, registration, and password recovery
- **Dashboard**: Overview of access review campaigns and activities
- **Campaigns**: List, create, and manage access review campaigns
- **Reviews**: List and process access reviews (approve/reject)
- **Reports**: View statistics and export reports in Excel/PDF
- **Import**: Import users and access data from CSV files
- **User Profile**: Manage user profile and change password
- **Notifications**: Receive and manage notifications

## Project Structure

- **src/components**: Reusable UI components
  - **common**: Common components like Layout, Button, etc.
  - **auth**: Authentication-related components
  - **campaigns**: Campaign-related components
  - **reviews**: Review-related components
  - **users**: User-related components
- **src/contexts**: React context providers (Auth, etc.)
- **src/pages**: Page components for different routes
- **src/services**: API service modules
- **src/types**: TypeScript type definitions
- **src/utils**: Utility functions

## Recent Improvements

- Added missing pages: Profile, ForgotPassword, CampaignCreate, Import, Reports
- Implemented a responsive sidebar navigation
- Added loading indicators for better UX
- Improved error handling and user feedback
- Added data visualization for reports
- Implemented export functionality
- Improved mobile responsiveness

## Future Work

The following items are planned for future development:

- **Accessibility Improvements**: Ensure all components are accessible
- **Unit Tests**: Add comprehensive unit tests
- **Internationalization**: Add support for multiple languages
- **Themes**: Add support for light/dark themes
- **Offline Mode**: Add support for offline operation
- **Performance Optimization**: Improve performance with memoization and code splitting
- **Progressive Web App**: Convert to a PWA for better mobile experience
- **Real-time Updates**: Add WebSocket for real-time notifications
- **User Settings**: Add more user settings and preferences
- **Advanced Filtering**: Enhance filtering capabilities for campaigns and reviews

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm start
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_URL=http://localhost:8000/api
```

## Build for Production

```
npm run build
```

This will create a `build` directory with the production-ready application.

## Acknowledgements

- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Chart.js](https://www.chartjs.org/)
- [React Router](https://reactrouter.com/)
- [Axios](https://axios-http.com/)
- [React Toastify](https://fkhadra.github.io/react-toastify/)
