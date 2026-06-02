# AdGuard Setup Helper

Turner Home Hub uses AdGuard as the network-level blocker. Home Hub adds profiles, device ownership, Discord notifications, logs, and PIN-based temporary bypasses.

Do not put Home Hub in AdGuard's upstream DNS settings. Keep upstream DNS pointed at Quad9, AdGuard DNS, Cloudflare, or your preferred resolver.

## Recommended Pattern

- Use AdGuard custom filtering rules to block domains.
- Use Home Hub to manage devices, profiles, notifications, and bypasses.
- Use the Home Hub block page for manual/test bypass flows.
- Accept that public HTTPS sites may show certificate/privacy warnings if you DNS-rewrite them to Home Hub.

## Filtering Rules

Add blocked domains as AdGuard custom filtering rules:

```text
||youtube.com^
||tiktok.com^
||character.ai^
```

Home Hub creates temporary allow rules during bypasses:

```text
@@||youtube.com^$client=192.168.1.55
```

## HTTPS Limitations

DNS redirects for HTTPS sites commonly show certificate or privacy warnings. The browser requested `https://youtube.com`, but Turner Home Hub cannot present a valid certificate for that domain. Solving this requires SSL inspection, a managed local CA installed on devices, or accepting that HTTPS block flows may stop at the browser warning before the block page.

For this deployment, prefer network-level blocking plus Home Hub logging/notifications instead of TLS interception.

## Optional Local DNS Rewrites

Local rewrites are useful for easy access to Home Hub and manual block-page tests:

```text
blocked.home.arpa -> 192.168.1.164
homehub.home.arpa -> 192.168.1.164
```

Manual block-page test:

```text
http://blocked.home.arpa:8090/block?domain=youtube.com
```

Do not rely on DNS rewrites from public HTTPS domains to Home Hub for a polished custom block page. The browser certificate warning is expected.
