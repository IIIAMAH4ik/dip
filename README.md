# AI-powered Online Learning — Frontend Prototype

This is a vanilla HTML/CSS/JS starter prototype for a thesis project. It includes multiple pages, mock data, a mini-quiz, progress tracking, and a mock AI Assistant that can be swapped for a real API.

Run instructions
- Install a simple static server such as `live-server` (npm):

```bash
npm install -g live-server
live-server --port=8080
```

Open `http://127.0.0.1:8080/pages/index.html` (or the root served page).

Where to replace mock AI with real API
- Edit `js/api.js` and replace the `sendToAI` mock implementation with a `fetch()` call to your AI endpoint. There's a `TODO: replace mock with real AI API` note in the file and an example commented showing how to call a POST endpoint.

Project structure
- /pages: index.html, courses.html, course.html, lesson.html, profile.html, auth.html
- /styles: base.css, components.css, pages/
- /js: main.js, ui.js, storage.js, api.js
- /data: courses.json, lessons.json, quizzes.json
- /assets: icons/

Notes
- The UI is intentionally minimal and accessible-focused. All data loads from `/data/*.json` via `fetch()`.
- The AI assistant currently returns a delayed mocked reply; swapping to a real API only requires editing `sendToAI` in `js/api.js`.
