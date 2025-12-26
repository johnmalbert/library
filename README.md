# Family Library

A simple web app for managing your family's book collection. Books are stored in Google Sheets, with an Azure Functions backend and React frontend.

## Architecture

- **Backend**: Azure Functions (Node.js) that reads/writes to Google Sheets
- **Frontend**: React app built with Vite, hosted as Azure Static Web App
- **Data**: Google Sheets with two tabs:
  - **Inventory**: ISBN, Cover, Title, Authors, Reading Level, Location, Publishers, Pages, Genres, Language, Notes
  - **Locations**: isbn, location, checked_out_by, updated_at (optional - overrides default Location from Inventory)

## Prerequisites

- Node.js 18+ 
- Azure Functions Core Tools
- A Google Cloud project with a Service Account
- A Google Sheet with "Inventory" and "Locations" tabs

## Google Sheets Setup

1. Create a Google Sheet with two tabs:
   - **Inventory** with columns: `ISBN`, `Cover`, `Title`, `Authors`, `Reading Level`, `Location`, `Publishers`, `Pages`, `Genres`, `Language`, `Notes`
   - **Locations** (optional) with columns: `isbn`, `location`, `checked_out_by`, `updated_at` - this tracks current location and overrides the default Location from Inventory

2. Create a Service Account in Google Cloud Console:
   - Go to IAM & Admin > Service Accounts
   - Create a new service account
   - Create a JSON key and download it
   - Share your Google Sheet with the service account email

## Local Development Setup

### 1. Install Dependencies

```bash
# Backend
cd api
npm install

# Frontend
cd ../web
npm install
```

### 2. Configure Backend Environment Variables

Create `api/local.settings.json` (copy from `local.settings.json.example`):

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "GOOGLE_CLIENT_EMAIL": "your-service-account@project-id.iam.gserviceaccount.com",
    "GOOGLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
    "SHEET_ID": "your-google-sheet-id"
  },
  "Host": {
    "CORS": "*"
  }
}
```

**Note**: The `GOOGLE_PRIVATE_KEY` should include the full key with newlines (`\n`).

### 3. Run the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd api
npm start
# or: func start
```

The backend will run on `http://localhost:7071`

**Terminal 2 - Frontend:**
```bash
cd web
npm run dev
```

The frontend will run on `http://localhost:5173`

The Vite dev server automatically proxies `/api` requests to the Azure Functions backend.

## API Endpoints

### GET /api/getBooks

Returns all books with their current location info.

**Response:**
```json
[
  {
    "isbn": "978-0-545-01022-1",
    "title": "Harry Potter and the Deathly Hallows",
    "authors": "J.K. Rowling",
    "readingLevel": "Young Adult",
    "cover": "https://example.com/cover.jpg",
    "publishers": "Scholastic",
    "pages": "784",
    "genres": "Fantasy",
    "language": "English",
    "notes": "",
    "location": "Living Room",
    "checked_out_by": "Sarah",
    "updated_at": "2025-12-26T10:30:00.000Z"
  }
]
```

### POST /api/checkoutBook

Updates a book's location.

**Request Body:**
```json
{
  "isbn": "978-0-545-01022-1",
  "newLocation": "Sarah's Room",
  "user": "Sarah"
}
```

**Response:**
```json
{
  "success": true
}
```

## Deployment

### Backend (Azure Functions)

1. Create an Azure Function App (Node.js 18+)
2. Set environment variables in Azure Portal:
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `SHEET_ID`
3. Deploy:
   ```bash
   cd api
   func azure functionapp publish <your-function-app-name>
   ```

### Frontend (Azure Static Web Apps)

1. Create an Azure Static Web App
2. Link to your GitHub repository
3. Configure build settings:
   - App location: `/web`
   - Output location: `dist`
   - API location: `/api`
4. Build command: `npm run build`

The Static Web App automatically integrates the Azure Functions backend.

## Project Structure

```
/
├── api/                      # Azure Functions backend
│   ├── getBooks/
│   │   ├── index.js         # GET books endpoint
│   │   └── function.json
│   ├── checkoutBook/
│   │   ├── index.js         # POST checkout endpoint
│   │   └── function.json
│   ├── sheets.js            # Google Sheets helper functions
│   ├── host.json            # Functions runtime config
│   ├── package.json
│   └── local.settings.json.example
│
├── web/                      # React frontend
│   ├── src/
│   │   ├── api.js           # API client
│   │   ├── App.jsx          # Main app component
│   │   ├── BookList.jsx     # Book grid display
│   │   ├── BookCard.jsx     # Individual book card
│   │   ├── CheckoutModal.jsx # Checkout dialog
│   │   └── main.jsx         # Entry point
│   ├── index.html
│   ├── vite.config.js       # Vite config with API proxy
│   └── package.json
│
├── README.md
└── .gitignore
```

## Features

- View all books in a grid layout with cover images
- See current location and who has each book
- Move books to new locations
- Track check-out history with timestamps
- Real-time updates from Google Sheets

## Notes

- No authentication required (hobby project)
- All data stored in Google Sheets
- CORS enabled for local development
- Simple, minimal dependencies
