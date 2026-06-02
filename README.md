# Turner Home Hub

Turner Home Hub is a Dockerized family command center and parental-control platform designed to sit beside an existing AdGuard Home deployment. Phase 1 includes a FastAPI backend, Next.js dashboard, PostgreSQL persistence, profile/device tracking, PIN-based temporary bypasses, activity logging, Discord notifications, and a custom block page.

> Screenshots: add tablet/wall-dashboard screenshots here after first deployment.

## Architecture

- Frontend: Next.js, TypeScript, Tailwind CSS, shadcn/ui-compatible components, The Gridcn registry configuration, Tron-inspired theme.
- Backend: FastAPI, SQLAlchemy, Alembic, PostgreSQL.
- Worker: background expiration loop for temporary bypass rules.
- Database: PostgreSQL, internal Docker network only.
- Integrations: AdGuard Home API and Discord webhooks.
- Network identity: optional UniFi OS integration for device discovery and sync.

## Prerequisites

- Docker and Docker Compose.
- Existing AdGuard Home at `http://192.168.1.164:8080`.
- LAN DNS control for redirecting blocked hosts to the Docker host.
- Optional Discord webhook URL.

## Setup

```bash
git clone https://github.com/turnerdb001/turner-home-hub.git
cd turner-home-hub
cp .env.example .env
nano .env
docker compose up -d --build
```

Frontend: `http://192.168.1.164:8090`  
Backend API: `http://192.168.1.164:8095`  
Adminer, optional: `docker compose --profile tools up -d adminer`, then open `http://192.168.1.164:8091`.

## First Login

The backend creates the first admin from:

```env
FIRST_ADMIN_USERNAME=admin
FIRST_ADMIN_PASSWORD=changeme
```

Change these before first deployment. Passwords and PINs are hashed with bcrypt and are never stored in plaintext.

## AdGuard Integration

Set these values in `.env`:

```env
ADGUARD_BASE_URL=http://192.168.1.164:8080
ADGUARD_USERNAME=
ADGUARD_PASSWORD=
```

Temporary bypass rules are created as AdGuard custom filtering rules:

```text
@@||example.com^
@@||example.com^$client=192.168.1.55
```

Per-client bypasses are preferred when a client IP is available. Expired bypasses are removed by the worker and during backend startup validation.

## UniFi Integration

Turner Home Hub can discover active UniFi clients and sync them into the Devices table by MAC address. Configure this from the Admin dashboard under `UniFi`.

Recommended settings:

```env
UNIFI_CONTROLLER_URL=https://192.168.1.1
UNIFI_API_KEY=
UNIFI_SITE_ID=default
UNIFI_VERIFY_SSL=false
```

API key authentication is preferred. Username/password fallback is supported for UniFi OS controllers. The integration uses the local UniFi OS Network API, not cloud access through `unifi.ui.com`.

After saving settings:

1. Click `Test` to confirm controller access.
2. Click `Discover` to preview visible clients.
3. Click `Sync devices` to import/update Home Hub devices.
4. Assign synced devices to whichever User or Child profiles you create in the Devices panel.

This gives the block page better profile/device matching when AdGuard redirects a blocked device by client IP.

## Profiles

Profiles are created from the Admin dashboard and are not hardcoded. Supported profile roles are:

- `User`: a regular profile that can optionally have a 6-digit PIN for bypass approval.
- `Child`: a restricted profile without PIN approval ability.

Admin login accounts are separate from family profiles.

## Block Page Routing

The frontend exposes `/block` and `/blocked` for manual/test bypass flows. Pass the blocked domain as a query string:

```text
http://192.168.1.164:8090/block?domain=youtube.com
```

Direct visits to `/` show the normal Home Hub status page. AdGuard should block domains at the DNS/filtering layer; Home Hub provides logging, Discord notifications, device/profile ownership, and temporary bypass approvals. HTTPS sites may show certificate/privacy warnings if DNS-rewritten to Home Hub. See [docs/adguard-setup.md](docs/adguard-setup.md).

## Backups And Restores

Create a backup:

```bash
./scripts/backup.sh
```

Restore a backup:

```bash
./scripts/restore.sh backups/turnerhomehub-YYYYmmdd-HHMMSS.sql.gz
```

## Updates

```bash
./scripts/update.sh
```

This pulls the latest code, rebuilds containers, restarts services, and prunes old Docker images.

## Testing

Backend tests:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
```

Frontend checks:

```bash
cd frontend
npm install
npm run lint
```

## Troubleshooting

- Backend cannot reach AdGuard: verify `ADGUARD_BASE_URL`, credentials, and LAN firewall rules.
- Bypass does not work: check AdGuard custom filtering rules and whether the device IP matches the client.
- Block page on HTTPS domain shows a privacy warning: this is expected for DNS redirects without trusted TLS interception.
- Login fails after changing `.env`: first admin is created only when no admin exists; update the database or create a new admin through the API.
- Database connection errors: run `docker compose ps` and confirm the `database` health check is passing.

## Future Modules

The codebase includes placeholders for library, books, borrowers, checkouts, family calendar, chores, request approvals, device schedules, inventory, media catalog, and check-in/check-out workflows.
