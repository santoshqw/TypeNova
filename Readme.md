# TypeNova

TypeNova is a typing platform where users can practice typing in multiple languages and compete with other players in real-time typing battles.

## Vision

- Real-time multiplayer typing battles (1v1 and rooms)
- Multi-language typing practice
- Different practice modes and text formats
- Personal profile, progress tracking, and rankings

## Current Project Structure

```text
TypeNova/
├── Backend/   # Express + MongoDB API
└── Frontend/  # React + Vite client
```

## Tech Stack

### Frontend
- React 19
- Vite
- React Router
- Tailwind CSS

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (cookie-based)
- bcryptjs for password hashing

## Current Features (Implemented)

- User signup
- User login
- User logout
- Protected user profile route
- Backend health/test endpoint

## Planned Features (Roadmap)

### Multiplayer Battle
- Real-time race with synchronized start countdown
- Live WPM/accuracy updates during match
- Match result screen (winner, WPM, accuracy, mistakes)

### Practice System
- Practice by language (e.g., English, Hindi, JavaScript snippets, etc.)
- Practice modes: time-based, word-count, custom text
- Formats: plain words, punctuation, numbers, code-style text

### User Growth
- Match history
- Global and weekly leaderboard
- Personal stats dashboard
- Streaks and achievements

## Getting Started

```bash
git clone <your-repo-url>
cd TypeNova
```

### Backend
```bash
cd Backend
npm install
npm run dev
```

### Frontend
Open a new terminal:
```bash
cd Frontend
npm install
npm run dev
```

## Project Goal

Build a fast, competitive typing platform where users can:

- Practice in multiple languages
- Play different typing modes and formats
- Compete with other players in real-time battles
- Improve speed and accuracy over time

## Contribution

Contributions are welcome. Feel free to open issues and pull requests for features, bug fixes, and improvements.
