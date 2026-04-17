# signage

Reactive text-signage simulator built as a lightweight browser app.

## Files

- `index.html` - app shell
- `styles.css` - UI styling
- `app.js` - parser-driven runtime and presets
- `hampter-signage-design.md` - design note
- `signage-simulator-summary.md` - implementation summary

## Run

Open `index.html` in a browser, or serve this directory with a static file server.

Example:

```bash
python -m http.server 4173
```

Then open `http://127.0.0.1:4173/signage/` when serving from the repo root, or `http://127.0.0.1:4173/` when serving from inside the `signage` directory.
