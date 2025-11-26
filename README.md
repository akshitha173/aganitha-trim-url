# URL Shortener (TinyLink)

A simple URL shortener web application built with Node.js, Express, and MongoDB.

## Features

- ✅ Create short URLs with auto-generated or custom codes
- ✅ Track click count and last clicked timestamp
- ✅ Delete short links
- ✅ Search/filter links by code or URL
- ✅ Responsive UI with Bootstrap styling
- ✅ JSON API endpoints
- ✅ Health check endpoints

## Setup & Installation

### Prerequisites
- Node.js (v12+)
- MongoDB connection string (Cloud Atlas or local)
- npm or yarn

### Installation

1. Clone or download the project.

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (optional, but recommended):
Create a `.env` file in the project root:
```
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/db?appName=app
BASE_URL=http://localhost:5000
PORT=5000
```

**Current default**: Uses hardcoded MongoDB URI in `server.js` (for dev). For production, move to `.env`.

4. Start the server:
```bash
npm run devStart
```

The app will run on `http://localhost:5000` (or your configured `PORT`).

## API Endpoints

### Health Checks
- **GET `/health`** — Returns `{ status: "ok" }`
- **GET `/healthz`** — Returns `{ status: "ok", timestamp: "2025-11-25T..." }` (explicit 200 status)

### Short URL Management
- **GET `/`** — View all short URLs (HTML UI)
- **GET `/api/shortUrls`** — List all short URLs as JSON
- **POST `/api/shortUrls`** — Create a short URL
  ```json
  { "full": "https://example.com", "short": "optional-code" }
  ```
  Returns `201` on success, `409` if custom code already exists, `400` if `full` missing.

- **DELETE `/api/shortUrls/:id`** — Delete a short URL by ID
  Returns `204` on success, `404` if not found.

- **POST `/shortUrls`** — Create via HTML form (with optional custom code)
- **POST `/shortUrls/:id/delete`** — Delete via HTML form
- **GET `/:shortCode`** — Redirect to target URL (increments clicks, updates last clicked)

## Requirements Met

1. ✅ **`/healthz` returns 200**: Explicit endpoint at `/healthz`
2. ✅ **Creating a link works; duplicate codes return 409**: `POST /api/shortUrls` creates or returns 409
3. ✅ **Redirect works and increments click count**: `GET /:shortCode` updates clicks and `lastClicked`
4. ✅ **Deletion stops redirect (404)**: Deleting removes the link; subsequent access returns 404
5. ✅ **UI meets expectations**:
   - Clean, responsive Bootstrap layout
   - Add form with custom code option (toggleable)
   - Search/filter by code or URL
   - Table shows: Short Code, Target URL, Total Clicks, Last Clicked, Delete button
   - Light background card style
   - Error alerts for duplicate codes

## Testing

### Manual Testing

1. **Create a short link** (UI):
   - Open http://localhost:5000
   - Enter a URL and optional custom code
   - Click "Add"

2. **Test redirect and clicks**:
   - Click on a short code in the table
   - Verify redirect to target URL
   - Refresh the table; clicks should increment, Last Clicked should update

3. **Test deletion**:
   - Click "Delete" on a row
   - Verify the link is removed
   - Try to access the deleted short code — should return 404

4. **Test API**:
   ```powershell
   # Create
   Invoke-RestMethod -Method POST -ContentType 'application/json' `
     -Body '{"full":"https://example.com","short":"mycode"}' `
     http://localhost:5000/api/shortUrls

   # List
   Invoke-RestMethod http://localhost:5000/api/shortUrls

   # Delete (replace ID)
   Invoke-RestMethod -Method DELETE http://localhost:5000/api/shortUrls/<id>

   # Health
   Invoke-RestMethod http://localhost:5000/healthz
   ```

### Automated Test Endpoint

Run the test suite:
```bash
curl http://localhost:5000/test
```

Expected output:
```json
{
  "summary": "6 passed, 0 failed",
  "results": {
    "passed": [
      "✓ /healthz returns 200",
      "✓ Creating a link returns 201",
      "✓ Duplicate codes return 409",
      "✓ Redirect works and increments click count",
      "✓ Deletion returns 204",
      "✓ Deleted link returns 404"
    ],
    "failed": []
  }
}
```

## Project Structure

```
url-shortener-master/
├── server.js                 # Express server & routes
├── models/
│   └── shortUrl.js          # Mongoose schema
├── views/
│   └── index.ejs            # HTML UI template
├── package.json             # Dependencies
└── README.md                # This file
```

## Database Schema

**ShortUrl Collection:**
```javascript
{
  _id: ObjectId,
  full: String,               // Target URL
  short: String,              // Short code (unique, indexed)
  clicks: Number,             // Click count
  lastClicked: Date,          // Last click timestamp
  createdAt: Date,            // Created timestamp
  updatedAt: Date             // Last updated timestamp
}
```

## Environment Variables

| Variable   | Default | Description |
|----------|---------|-------------|
| `MONGO_URI` | (hardcoded) | MongoDB connection string |
| `BASE_URL` | '' | Base URL for absolute short links |
| `PORT` | 5000 | Server port |

## Notes

- **Security**: The MongoDB connection string is currently hardcoded. For production, move credentials to `.env` and add `.env.example`.
- **Validation**: URLs are normalized to include `http://` if missing.
- **Uniqueness**: Short codes are unique and indexed; duplicates return 409.
- **Atomicity**: Click updates use MongoDB `$inc` operator for reliability.
- **UI**: Responsive Bootstrap 4 layout with client-side search/filter (no server-side pagination).

## Future Enhancements

- [ ] Add password protection for deletion
- [ ] Add QR code generation for short links
- [ ] Analytics dashboard (charts, top links, etc.)
- [ ] Custom domain support
- [ ] Link expiration / TTL
- [ ] Rate limiting
- [ ] Unit & integration tests

## License

ISC
