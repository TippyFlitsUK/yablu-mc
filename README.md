# YABLU-MC - Weekly Task Planner

YABLU-MC (Yablu Mission Control) is a responsive weekly task planner application built with React and PostgreSQL. It allows users to organize their tasks into projects and schedule them across the days of the week, providing a clear overview of upcoming work with real-time synchronization across all devices.

## ✨ Key Features

* **Project-Based Organization**: Create and manage projects, each with a distinct color for easy visual identification.
* **Task Management**: Add, edit, and delete tasks within projects.
* **Weekly View**: A clear layout with a "Master Tasks" list for unscheduled items and dedicated columns for Monday, Tuesday, Wednesday, Thursday, Friday, and Weekend.
* **Context Menus**: Right-click on projects or tasks for quick actions like editing, deleting, or marking tasks as complete.
* **Modal Dialogs**: Intuitive modals for adding/editing projects and tasks, confirming deletions, and viewing special lists.
* **Recycle Bin**: Deleted tasks are moved to a recycle bin, allowing for restoration or permanent deletion. Tasks are automatically removed from the bin after 30 days.
* **Completed Tasks List**: A dedicated view to see all completed tasks, along with statistics on completion rates (total, last 24 hours, this week).
* **PostgreSQL Database**: All data is stored in PostgreSQL for reliable persistence and real-time synchronization across all devices on your network.
* **Responsive Design**: The layout adapts to different screen sizes, ensuring usability on desktop and mobile devices.
* **Customizable Project Colors**: Choose from a palette of 11 distinct colors for your projects.

## 🛠️ Tech Stack

* **Frontend**: React (using Hooks and functional components)
* **Backend**: Node.js with Express
* **Database**: PostgreSQL
* **Build Tool**: Vite
* **State Management**: `useReducer` for core application data
* **Styling**: Custom CSS with CSS variables for theming
* **Icons**: Lucide React
* **API**: RESTful API with CRUD operations

## 📂 Project Structure

The project is organized as follows:


yablu-mc/
├── public/                 # Static assets
├── server/                 # Backend API server
│   ├── database/           # Database schema and connection
│   ├── routes/             # API route handlers
│   ├── scripts/            # Database migration scripts
│   └── index.js            # Server entry point
├── src/
│   ├── components/         # React components (Modals, Columns, Cards, etc.)
│   ├── reducers/           # Reducer logic for state management (appReducer.js)
│   ├── services/           # API service layer (dataService.js, api.js)
│   ├── utils/              # Utility functions (constants.js, helpers.js)
│   ├── App.css             # Main application styles
│   ├── App.jsx             # Main application component
│   ├── index.css           # Global styles
│   └── main.jsx            # Application entry point
├── .eslintrc.cjs           # ESLint configuration
├── index.html              # Main HTML file
├── package.json            # Project dependencies and scripts
├── vite.config.js          # Vite configuration
├── DATABASE_SETUP.md       # Database setup instructions
└── README.md               # This file


## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

* Node.js (v18.x or later recommended)
* npm (comes with Node.js)
* PostgreSQL (v12 or later)
* Network access to your server (for multi-device sync)

### Installation & Running

1.  **Clone the repository (if applicable):**
    ```bash
    git clone <your-repository-url>
    cd yablu-mc
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    npm run setup:server
    ```

3.  **Set up PostgreSQL:**
    See `DATABASE_SETUP.md` for detailed database setup instructions.

4.  **Configure environment:**
    ```bash
    cp .env.example .env
    cp server/.env.example server/.env
    # Edit server/.env with your DATABASE_URL
    ```

5.  **Run database migration:**
    ```bash
    npm run migrate
    ```

6.  **Start the application:**
    ```bash
    # Terminal 1: Start API server
    npm run dev:server
    
    # Terminal 2: Start frontend
    npm run dev
    ```
    Frontend: `http://your-server-ip:5173`
    API: `http://your-server-ip:3001`

7.  **Build for production:**
    ```bash
    npm run build
    ```

## ⚙️ How It Works

* **Data Initialization**: On first load, the application connects to PostgreSQL and loads all data from the database. If no data exists, it starts with an empty state.
* **State Management**: The core application state (projects, tasks, deleted/completed items) is managed by `appReducer.js`. Actions are dispatched from components to update the state.
* **Data Persistence**: All changes are immediately saved to PostgreSQL via REST API calls, ensuring real-time synchronization across devices.
* **Master Task List**: The "Master Tasks" column serves as a backlog or an area for tasks not yet assigned to a specific day. Projects are also listed here to allow for project-level actions.
* **Daily Columns**: Tasks can be (conceptually, as drag-and-drop is not implemented in this version) moved or assigned to specific days of the week.
* **Task Lifecycle**:
    * Tasks are created within projects.
    * They can be edited (title, assigned project).
    * Marking a task "Complete" moves it to the "Completed Tasks" list.
    * Deleting a task moves it to the "Recycle Bin".
    * Tasks in the Recycle Bin can be restored to their original location or permanently deleted.
    * Tasks in the Completed list can be marked as "Incomplete", moving them back to their original location.

## 🎨 Styling

The application uses custom CSS located in `src/App.css` and `src/index.css`.
* **CSS Variables**: Key theme colors and layout values are defined as CSS variables in `App.css` for easy customization.
* **Responsive Breakpoints**: Media queries are used to adjust the layout for tablet and mobile devices, ensuring a good user experience across different screen sizes.

---

This README provides a good overview of the YABLU-MC application.

