# Biyo Dhawr — Mobile (USSD simulator)

A small Expo / React Native app that **simulates the `*999#` USSD line** of Biyo Dhawr. Rural community members without a smartphone or internet can dial the code on any phone and report a broken or dry water point in Somali; the report lands in the government dashboard for verification and repair. This app reproduces that flow on a phone screen for demos and testing, and talks to the same public API a real USSD gateway would.

Part of the [biyo-dhawr](https://github.com/biyo-dhawr) organisation together with [`backend`](https://github.com/biyo-dhawr/backend) and [`web`](https://github.com/biyo-dhawr/web).

## How it works

1. **Dialer screen** — a feature-phone keypad. Type `*999#` and tap **WAC (Call)**. Any other code shows *"Koodh Khaldan"* (wrong code).
2. **USSD session** (modal styled like a carrier dialog), all in Somali:

   | Step | Title | Options |
   |---|---|---|
   | 1 | **Degmada** — *Dooro Degmadaada* | Districts of Awdal (from `GET /api/districts?regionId=`) |
   | 2 | **Tuulada** — *Dooro Tuuladaada* | Villages of the district (`GET /api/villages?districtId=`) |
   | 3 | **Dooro Ceelka** — *Ceelka aad ku sheegi doonto* | Water sources of the village (`GET /api/water-sources?villageId=&limit=100`) |
   | 4 | **Nooca Cillada** — *Maxaa ceelka ka haya?* | `1` ceelka ma shaqaynayo waa jaban yahay (broken) · `2` ceelka waa maran yahay waa biyo la'aan (dry) |
   | 5 | **✓ Guul!** | *Waa la gudbiyey cabashadaada, mahadsanid* |

3. The choice is posted to `POST /api/reports/submit/public` (no account needed):

   ```json
   { "villageId": 59, "waterSourceId": 1000, "content": "ceelka ma shaqaynayo waa jaban yahay", "reporterType": "App" }
   ```

   Staff then see it under **Field Reports** in the web dashboard.

`← Dib u noqo` goes one step back, `✕ Xir` ends the session.

## Project layout

```
App.js                    # dial handling, opens/closes the USSD session
screens/DialerScreen.js   # keypad UI
screens/USSDMenuScreen.js # menu tree, API calls, success/error states
api.js                    # API_URL + fetch helpers (regions, districts, villages, water sources, submit report)
app.json                  # Expo config (name "Biyo Dhowr", android package com.ogaal.ussdapp)
assets/icon.png
```

## Running locally

Prerequisites: Node 18+, Expo Go on a phone (or an emulator), and the [backend](https://github.com/biyo-dhawr/backend) running and reachable from the phone.

```bash
npm install
# edit api.js → API_URL = "http://<your-computer-LAN-IP>:4000/api"
npm start          # scan the QR code with Expo Go
```

The phone and the computer running the backend must be on the same network. Use `npm run android` / `npm run ios` for emulators.

## Notes

- The app currently scopes itself to the **Awdal** region.
- `API_URL` in `api.js` is a plain string; change it to your backend address before running.
- `copy_icon.js` and `install.bat` are one-off helper scripts and are not needed.
- Expo SDK 54, React Native 0.81, no native modules (works in Expo Go).

## Team

Built by the Biyo Dhawr team for the Amoud University competition (1st place):
[@AyoubKilwe](https://github.com/AyoubKilwe), [@Ibrahim-Abdirashid](https://github.com/Ibrahim-Abdirashid), [@abdilahi-fullstack-dev](https://github.com/abdilahi-fullstack-dev), [@Abdulahia-39](https://github.com/Abdulahia-39).

## License

MIT — see [LICENSE](LICENSE).
