# Sreez The Dress Maker: shop website

A static site on Firebase Hosting. Firestore holds the catalogue, uploaded photos and orders. The owner signs in with Google at `/#manage`.

## Files
- `public/index.html`: page shell and the starting catalogue (`#data`), used until the owner publishes from the manager.
- `public/app.js`: the shop and the manager. `public/style.css`: styles. `public/img/`: photos (`img/t/` holds small copies).
- `public/backend.js`: all Firebase calls. Customers use plain web requests; the Firebase library loads only for the owner.
- `public/firebase-config.js`: the Firebase web app settings (safe to publish).
- `firestore.rules`: who may read and write. The published copy in the Firebase console has the owner's Google address in place of `OWNER_EMAIL`; this repository is public, so the address is kept out of it.
- `.github/workflows/deploy.yml`: publishes `public/` to Firebase Hosting on every push to `main`.

## One-time setup
1. Firebase console: create the project (Spark plan), add a Web app, copy its settings into `public/firebase-config.js`.
2. Build, Firestore Database: create the database (production mode), then paste `firestore.rules` into the Rules tab and publish.
3. Build, Authentication: turn on the Google sign-in provider. Under Settings, Authorized domains, add the shop's domain.
4. Project settings, Service accounts: generate a new private key. In GitHub, add its whole content as the repository secret `FIREBASE_SERVICE_ACCOUNT`.
5. Put the project id in `.firebaserc`: `{"projects":{"default":"PROJECT_ID"}}`.
6. Hosting, Add custom domain: follow the DNS records it shows at the domain registrar.

## Data
- `site/catalogue`: `{json, updatedAt}`, the whole catalogue as one JSON string.
- `images/{id}`: `{data (base64 JPEG), type, createdAt}`, referenced in the catalogue as `a:<id>`.
- `orders/{id}`: customer orders. Website orders arrive with `status: New`, `channel: Website`; the manager gives them a number.
