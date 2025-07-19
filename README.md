# Dhaka Food Cart - Khawa Dawa

This project can be run locally using Docker. The repository provides a
`Dockerfile` and a `docker-compose.yml` that set up the application and a
PostgreSQL database.

## Running with Docker Compose

1. Copy `.env.example` to `.env` and adjust values for your environment.
   The `DATABASE_URL` should point to the `db` service as shown below.

   ```env
   DATABASE_URL=postgresql://postgres:U6w$UE_X-F$B7hC@db:5432/postgres
   ```

2. Build and start the containers:

   ```bash
   docker-compose up --build
   ```

The web service will be available at `http://localhost:5000`.

### Environment variables

Place your `.env` file in the repository root. The compose file loads this
file automatically and passes the variables to the `web` container. Refer to
`.env.example` for the list of variables that can be configured.
