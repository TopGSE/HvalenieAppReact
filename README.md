# Hvalenie App React

A modern web application for managing, searching, and organizing worship songs and playlists. Built with React, Node.js, and MongoDB, it supports user authentication, admin features, real-time notifications, and playlist management.

## Features

- **Song Management:** Add, edit, delete, and search worship songs.
- **Playlists:** Create, edit, and manage playlists. Add or remove songs from playlists.
- **User Authentication:** Register, login, reset password, and manage your profile.
- **Admin Tools:** Admins can add songs and view usage statistics.
- **Favorites & Recently Viewed:** Mark songs as favorites and quickly access recently viewed songs.
- **Real-Time Updates:** Get notifications for changes using Socket.IO.
- **Responsive Design:** Works well on both desktop and mobile devices.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v16+ recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Backend API (Node.js/Express server with MongoDB, not included here)

### Installation

1. **Clone the repository:**

   ```bash
   git clone <your-repo-url>
   cd hvalenie-app-react
   ```

2. **Install dependencies:**

   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment variables:**

   - Copy `.env.example` to `.env` and fill in your credentials (API URL, email, JWT secret, etc.).
   - **Important:** Never commit your real `.env` file to version control.

4. **Start the development server:**

   ```bash
   npm start
   # or
   yarn start
   ```

5. **Open the app:**
   - Visit [http://localhost:3000](http://localhost:3000) in your browser.

### Usage

- **Login/Register:** Create an account or log in.
- **Browse Songs:** Use the search bar and filters to find songs.
- **Manage Playlists:** Create playlists and add/remove songs.
- **Admin:** If you have admin rights, you can add new songs and view statistics.
- **Profile:** Update your user information and manage your playlists.

### Project Structure

- `src/` - Main React source code
- `src/components/` - UI components (songs, playlists, modals, auth, etc.)
- `src/utils/` - Utility functions and API helpers
- `.env` - Environment variables (not committed)
- `README.md` - This file

### Contributing

Pull requests and suggestions are welcome! Please open an issue first to discuss changes.

### License

This project is for personal/non-commercial use. For other uses, please contact the author.

---

**Enjoy organizing your worship songs!**
