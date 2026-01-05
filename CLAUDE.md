# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Snake game implemented as a single self-contained HTML file (`snake_game.html`). The game features:
- Classic snake gameplay with keyboard controls
- Top 5 ranking system with persistent storage
- Score tracking with high score display
- Game over state management

## Technical Architecture

### Data Storage
The game uses **PostgreSQL** for ranking storage via a Node.js backend:
- Library: `pg` (node-postgres)
- Database: `snake_game` on localhost:5432
- Table: `rankings` with columns `id` (SERIAL), `score`, `date`, `timestamp`
- API Server: Express.js running on port 3333
- Storage limit: Top 10 records maintained automatically via SQL DELETE

### Key Components

**State Management**
- `gameRunning`: Tracks whether game loop is active
- `isGameOver`: Prevents auto-restart after game over (must use "다시 시작" button)
- `snake`: Array of position objects `{x, y}`
- `velocity`: Current direction vector
- `rankings`: Array of ranking records from SQLite

**Critical Functions**
- `initDB()`: Initializes sql.js and creates/loads SQLite database
- `loadDBFromStorage()`: Loads SQLite binary from IndexedDB
- `saveDBToStorage()`: Persists SQLite binary to IndexedDB
- `loadRankings()`: Async function that loads rankings via SQL query
- `saveRanking(score)`: Async function that inserts score and maintains top 10 records
- `gameOver()`: Sets `isGameOver = true` to prevent keyboard restart
- `restartGame()`: Resets state including `isGameOver = false`

### Game Loop Flow
1. User presses arrow key → `startGame()` only if `!gameRunning && !isGameOver`
2. `setInterval(update, 100)` drives game loop
3. Collision detection happens in `update()`
4. Game over sets `isGameOver = true`, preventing restart until button click

## Development Commands

Open the game in browser:
```bash
open snake_game.html
```

## Important Implementation Notes

- **SQLite via sql.js** - Rankings are stored in SQLite database. The binary is persisted to IndexedDB.
- **Game restart prevention**: The `isGameOver` flag must be respected in `keyPress()` to prevent unwanted restarts
- **Ranking cleanup**: `saveRanking()` uses SQL DELETE to maintain only top 10 records
- **Canvas size**: 400x400px - do not change without adjusting scroll prevention in body styles
- **Grid system**: 20px grid size, 20x20 tiles

## Korean Language
All UI text is in Korean (ko). Maintain this language for any user-facing strings.
