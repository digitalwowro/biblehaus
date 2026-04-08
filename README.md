# BibleHaus

## Docker Compose

1. Copy [`.env.example`](D:/Code/projects/biblehaus/.env.example) to `.env`
2. Start the stack:

```bash
docker compose up
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Environment

Local development uses [`.env.dev`](D:/Code/projects/biblehaus/.env.dev).

Docker / production uses [`.env`](D:/Code/projects/biblehaus/.env), created from [`.env.example`](D:/Code/projects/biblehaus/.env.example).

Required:

```env
JWT_SECRET=replace-this-with-a-strong-secret
```

Optional:

```env
POSTGRES_PASSWORD=biblehaus_dev
TTS_ENABLED=false
OPENAI_API_KEY=
TTS_MODEL=gpt-4o-mini-tts
TTS_VOICE=ash
TTS_SPEED=0.85
TTS_INSTRUCTIONS=Speak slowly and clearly, with short pauses between sentences.
```

## Initial Credentials

On first container startup, the app creates this admin account if it does not already exist:

- email: `admin@bible.haus`
- password: `biblehaus`
