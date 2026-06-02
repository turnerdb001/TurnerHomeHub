# UniFi Integration

Turner Home Hub can use UniFi OS as a device identity source. It imports active clients by MAC address, IP address, hostname/name, network, SSID, and wired/wireless hints.

## Supported Controller Pattern

- UniFi OS controllers such as UDM, UCG, Cloud Key Gen2+, and similar gateways.
- Local controller URL such as `https://192.168.1.1`.
- API key authentication is recommended.
- Username/password fallback is supported.
- Cloud access through `unifi.ui.com` is not used.

## Dashboard Setup

Open Admin, then the UniFi panel.

1. Enable UniFi integration.
2. Enter controller URL.
3. Enter API key, or username/password fallback.
4. Keep site ID as `default` unless your UniFi URL shows a different site ID.
5. Keep SSL verification off for self-signed LAN certificates.
6. Save, test, discover clients, then sync devices.

## Device Sync Behavior

- Existing devices are matched by MAC address.
- Existing device IP addresses are updated from UniFi.
- New devices are imported unassigned.
- Device owners are still managed in Home Hub as fluid User or Child profiles.
- Imported notes include UniFi network, SSID, and wired/wireless state.

## Security Notes

Use a least-privileged UniFi API key if your controller supports it. Do not expose your UniFi controller to the internet for this integration.
