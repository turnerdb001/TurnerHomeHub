# AdGuard Setup Helper

Turner Home Hub works best when AdGuard redirects blocked destinations to the dashboard host and the block page receives the original domain as context where possible.

## DNS Rewrites

Add DNS rewrites in AdGuard Home:

```text
blocked.home.arpa -> 192.168.1.164
youtube.com -> 192.168.1.164
tiktok.com -> 192.168.1.164
character.ai -> 192.168.1.164
```

Then point browser/device block experiences at:

```text
http://192.168.1.164:8090/block?domain=example.com
```

## HTTPS Limitations

DNS redirects for HTTPS sites commonly show certificate or privacy warnings. The browser requested `https://youtube.com`, but Turner Home Hub cannot present a valid certificate for that domain. Solving this requires SSL inspection, a managed local CA installed on devices, or accepting that HTTPS block flows may stop at the browser warning before the block page.

## Recommended LAN Pattern

- Use AdGuard to block domains and keep audit history.
- Use Turner Home Hub for bypass approvals, family dashboarding, and notifications.
- Prefer per-client AdGuard allow rules when the blocked client IP is known.
- Keep PostgreSQL internal to Docker and expose only frontend/backend ports to the LAN.
