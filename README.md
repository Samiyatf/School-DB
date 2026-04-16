# Secure Database Semester Project (Frontend UI)

This is a professional, interactive frontend-only web UI for a secure database application. It operates purely on mock JSON data for now, making it easy for future developers to plug into a real MySQL backend API.

## Features

- **View, search, filter** records (mocked in data.json)
- **Add, edit, delete** records interactively in the UI
- **Export** current records view as JSON file
- **Responsive, clean design**
- **Well-commented, modular codebase**

## Tech Stack

- HTML5
- CSS3 (no frameworks)
- Vanilla JavaScript (no frameworks)
- Mock data (see `data.json`)

## Folder Structure

```
.
├── index.html
├── styles.css
├── script.js
├── data.json
└── README.md
```

## Getting Started

1. **Clone or download all files into a single folder.**
2. Open `index.html` directly in your web browser.
   - For file system security reasons, you may need to serve this directory with a simple HTTP server for `fetch("data.json")` to work. For example:

   ```
   python3 -m http.server
   ```

   Then visit [http://localhost:8000](http://localhost:8000).

3. **Enjoy and modify the project as needed!**

## Transitioning to a Backend

- All data interactions (loading, adding, editing, deleting, exporting) are implemented in `script.js` using the `records` array, initially populated from `data.json`.
- To plug in a real backend API, simply:
  - Replace the fetch for `data.json` in `loadMockData()` with API calls.
  - Update the CRUD handler functions to make requests to your backend server, then update the UI according to API responses.

## Security Note

- This frontend UI is for demonstration/development only—real security controls and input validation must be implemented server-side when connecting to the real (MySQL) backend!

---

© 2026 Secure Database Project Team
