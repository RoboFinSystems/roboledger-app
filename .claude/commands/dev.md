Start the RoboLedger frontend development server.

## Prerequisites

Ensure the RoboSystems backend API is running at the configured API URL.

## Steps

1. Check if dependencies need to be installed
2. Start the Next.js development server on port 3001

## Commands

Install dependencies if node_modules is missing:

```bash
test -d node_modules || npm install
```

Start the development server in the background:

```bash
npm run dev &
```

## Access

- **App**: http://localhost:3001
- **API**: Configured via environment variables

## Related

Run `/dev` in the robosystems (backend) repository first to start the API.
