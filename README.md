# BibleHaus

1. Download the environment file:

```bash
curl -o .env https://raw.githubusercontent.com/digitalwowro/biblehaus/main/.env.example
```

2. Download the Docker Compose file:

```bash
curl -o docker-compose.yml https://raw.githubusercontent.com/digitalwowro/biblehaus/main/docker-compose.yml
```

3. Generate a JWT secret:

```bash
openssl rand -base64 48
```

4. Edit [`.env`](D:/Code/projects/biblehaus/.env) and set the mandatory values:
   - `JWT_SECRET`
   - `APP_PORT`

5. Start the containers:

```bash
docker compose up -d
```

To update later:

```bash
docker compose down
docker compose pull
docker compose up -d
```

The app runs at `http://localhost:<APP_PORT>`, which defaults to [http://localhost:3000](http://localhost:3000).

Postgres is kept on a private Docker network and is not exposed on the host.

Review the `biblehaus_external` network settings in [`docker-compose.yml`](D:/Code/projects/biblehaus/docker-compose.yml) before deploying. On some providers, especially Hetzner, you may need to set a custom driver and MTU:

```yml
  biblehaus_external:
    driver: bridge
    driver_opts:
      com.docker.network.driver.mtu: 1400
```

Default admin credentials:

- email: `admin@bible.haus`
- password: `biblehaus`
