# StreamSeries

A modern, full-stack series tracking and discovery platform built with **Next.js 15**, **Neo4j**, and **TailwindCSS**.

## 🚀 Features

*   **Graph-Powered Recommendations**: Personalized "For You" feeds and "Similar Tastes" using Neo4j graph algorithms.
*   **Series Tracking**: Track what you've watched, add to specific lists (Favorites, Watchlist), and view your history.
*   **Modern UI/UX**: sleek, dark-themed interface with glassmorphism, smooth animations (Framer Motion/Tailwind), and responsive design.
*   **Authentication**: Secure JWT-based auth stored in HTTP-only cookies.
*   **TMDB Integration**: Rich metadata, posters, and details from The Movie Database API.

## 🛠️ Tech Stack

*   **Frontend**: Next.js 15 (App Router), React, TailwindCSS, Lucide Icons.
*   **Backend**: Next.js API Routes (Serverless functions).
*   **Database**: Neo4j (Graph Database) for users, interactions, and relationships.
*   **External API**: TMDB (The Movie Database).
*   **Auth**: JWT (JSON Web Tokens) + Bcrypt.

## 📦 Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/iro9ik/series4j.git
    cd series4j
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory:
    ```env
    # Database (Neo4j Aura or Local)
    NEO4J_URI=neo4j+s://your-db-instance.databases.neo4j.io
    NEO4J_USER=neo4j
    NEO4J_PASSWORD=your-password

    # Security
    JWT_SECRET=your-super-secret-key-change-me

    # APIs
    TMDB_API_KEY=your-tmdb-api-key
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🗄️ Database Schema (Neo4j)

*   **Nodes**: `User`, `Series`, `Genre`
*   **Relationships**:
    *   `(:User)-[:LIKES]->(:Genre)`
    *   `(:User)-[:LIKES_SERIES]->(:Series)` (Favorites)
    *   `(:User)-[:ON_WATCHLIST]->(:Series)` (My List)
    *   `(:User)-[:VIEWED {at: datetime()}]->(:Series)`
    *   `(:Series)-[:HAS_GENRE]->(:Genre)`

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📝 License

[MIT](https://choosealicense.com/licenses/mit/)
