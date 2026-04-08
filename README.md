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

4. Edit [`.env`](D:/Code/projects/biblehaus/.env), set `JWT_SECRET` to the generated value, and adjust the ports if needed.

5. Start the containers:

```bash
docker compose up -d
```

The app runs at `http://localhost:<APP_PORT>`, which defaults to [http://localhost:3000](http://localhost:3000).

Default admin credentials:

- email: `admin@bible.haus`
- password: `biblehaus`
