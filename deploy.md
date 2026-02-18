# Work Time Tracker - Deployment Guide 🚀

This guide will help you deploy the Work Time Tracker app using Docker. This is the **easiest and most reliable way** to run the app in production, as it bundles everything (the app + the database) into self-contained "containers" that work identically on any machine.

## Prerequisites

Before starting, make sure you have installed:

1.  **Docker Desktop** (or Docker Engine on Linux)
    *   Mac/Windows: Download from [Run Docker locally](https://www.docker.com/products/docker-desktop/)
    *   Linux: `sudo apt-get install docker.io docker-compose`

2.  **Git** (optional, but recommended to pull the code)

---

## Quick Start (The "Easy Button")

We've created a helper script to automate the entire process for you.

1.  Open your terminal in the project folder.
2.  Make the script executable (only needed once):
    ```bash
    chmod +x scripts/deploy.sh
    ```
3.  **Run the deployment script:**
    ```bash
    ./scripts/deploy.sh
    ```

That's it! The script will:
*   Build the application container.
*   Start the database and app containers.
*   Wait for the database to be ready.
*   Run the database migrations (set up the tables).
*   Tell you when it's ready at **http://localhost:3000**.

---

## Manual Deployment (Step-by-Step)

If you prefer to understand what's happening under the hood, here are the manual steps:

### 1. Build and Start Containers
Run the following command to build the images and start the containers in the background (`-d`):

```bash
docker-compose up -d --build
```

You should see output indicating that `worktracker-db` and `worktracker-web` are "Started".

### 2. Verify Database Status
Wait about 10 seconds for the database to initialize. You can check the logs to be sure:

```bash
docker-compose logs -f db
```
(Press `Ctrl+C` to exit logs)

### 3. Run Database Migrations
The app container has the Prisma tool installed. You need to tell it to create the database tables:

```bash
docker-compose exec app npx prisma migrate deploy
```

If you see "The following migration(s) have been applied", you're golden! ✨

### 4. Open the App
Visit **http://localhost:3000** in your browser.

---

## Common Commands

| Goal | Command |
| :--- | :--- |
| **Stop everything** | `docker-compose down` |
| **View app logs** | `docker-compose logs -f app` |
| **Rebuild app** (after code changes) | `docker-compose up -d --build` |
| **Reset Database** (WARNING: Deletes Data) | `docker-compose down -v` |

---

## Troubleshooting

### "Bind for 0.0.0.0:3000 failed: port is already allocated"
*   **Cause**: Another service (or a lingering Node process) is using port 3000.
*   **Fix**: Stop the other process or change the port in `docker-compose.yml` (e.g., change `"3000:3000"` to `"8080:3000"` to run on port 8080).

### "Database connection error"
*   **Cause**: The database container might not be ready yet.
*   **Fix**: Wait 10-20 seconds and the app usually reconnects. Check logs with `docker-compose logs app`.

### "Permissions denied"
*   **Cause**: On Linux/Mac, you might need `sudo`.
*   **Fix**: Prefix commands with `sudo` (e.g., `sudo docker-compose up -d`). On Mac, ensure Docker Desktop has file sharing permissions for the project folder.
