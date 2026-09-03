# support-wipa

Live Chat Agent Command Center for Women in IP Alliance (WIPA) Global Support.

Configured for `supportglobal.womensipalliance.com`.

## Features
- Real-time live chat session queue with active, pending, and resolved ticket management.
- Live bi-directional chat with WIPA members using Supabase Realtime websockets.
- Canned macros & quick response snippets.
- Internal staff whisper notes (visible only to support agents).
- Member dossier panel with practice area, location, and membership tier details.

## Setup
1. Copy `.env.example` to `.env.local` and provide your Supabase URL and keys.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3001](http://localhost:3001) in your browser.
