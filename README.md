# BibleHaus

BibleHaus is a Next.js app for browsing Bible translations publicly and managing content through an admin dashboard.

## Requirements

- Docker Desktop or Docker Engine with Docker Compose
- A `JWT_SECRET` value for the web container

## Docker Compose

The repository includes [`docker-compose.yml`](D:/Code/projects/biblehaus/docker-compose.yml) for running Postgres and the app together.

By default, the `web` service pulls the published app image from GHCR instead of building locally:

```text
ghcr.io/digitalwowro/biblehaus:latest
```

### Environment

Create a local `.env` file in the project root. At minimum, set:

```env
JWT_SECRET=replace-this-with-a-strong-secret
```

Optional values:

```env
POSTGRES_PASSWORD=biblehaus_dev
ADMIN_SEED_EMAIL=
ADMIN_SEED_PASSWORD=
TTS_ENABLED=false
OPENAI_API_KEY=
TTS_VOICE=nova
```

Notes:

- `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` are optional. If both are set, the web container seeds an admin user on startup.
- TTS is disabled by default. Set `TTS_ENABLED=true` and provide `OPENAI_API_KEY` if you want to enable it.

### Start

Pull and start the stack:

```bash
docker compose up
```

The app will be available at [http://localhost:3000](http://localhost:3000).

Services:

- `db`: Postgres 16 on `localhost:5432`
- `web`: Next.js app on `localhost:3000`

To force an image refresh before startup:

```bash
docker compose pull
docker compose up
```

To use a specific published image tag instead of `latest`, set `WEB_IMAGE` in your `.env` file:

```env
WEB_IMAGE=ghcr.io/digitalwowro/biblehaus:sha-abcdef1
```

### Publishing

GitHub Actions publishes the app image to GHCR on every push to `main` and on version tags matching `v*`.

Published tags include:

- `latest` for the default branch
- the branch or tag name where applicable
- a commit SHA tag

### Local Source Build

If you want to build the app image locally from source instead of pulling from GHCR:

```bash
docker build -t biblehaus:local .
docker run --rm -p 3000:3000 --env-file .env biblehaus:local
```

### Stop

Stop the containers:

```bash
docker compose stop
```

Stop and remove containers, networks, and anonymous resources created by the stack:

```bash
docker compose down
```

To also remove the named Postgres and TTS cache volumes:

```bash
docker compose down -v
```

### Persistence

Docker Compose uses named volumes:

- `pgdata` for Postgres data
- `tts_cache` for generated TTS audio cache

### Admin Seeding

If you want Docker startup to create an admin account, set both of these before running the stack:

```env
ADMIN_SEED_EMAIL=admin@example.com
ADMIN_SEED_PASSWORD=change-me
```

If either value is blank, admin seeding is skipped.
