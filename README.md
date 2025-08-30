# ResuMate

A **guided chat-based resume builder** that uses AI to help users create professional resumes through an interactive conversation.

## 🚀 Features

- **Chatbot-driven resume creation** - AI guides users through each section
- **Real-time preview** - Resume updates live as you chat
- **AI suggestions** - Get polished content recommendations
- **Manual editing** - Edit any section directly when needed
- **Session-based chat history** - Track conversation for each resume

## 🛠 Tech Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- GraphQL (Apollo Server)

**Frontend:**
- Vue 3 + Vite
- TypeScript
- Tailwind CSS
- Pinia (State Management)

## 📁 Project Structure

```
ResuMate/
├── backend/          # Node.js GraphQL API
│   ├── database/     # MongoDB models & config
│   ├── graphql/      # Schema & resolvers
│   └── server.js     # Express server
├── frontend/         # Vue 3 SPA
│   └── src/
│       ├── components/
│       └── assets/
└── docs/             # Project documentation
```

## 🚀 Quick Start

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📝 How It Works

1. User starts a new resume creation session
2. AI chatbot asks guided questions (name, title, skills, etc.)
3. Backend stores responses in MongoDB
4. AI provides polished suggestions for each section
5. Resume preview updates in real-time
6. User can manually edit or continue with AI suggestions

## 🔗 API

GraphQL endpoint: `http://localhost:3000/graphql`

Main operations:
- `createResume` - Start new resume
- `addMessage` - Add chat message
- `updateResume` - Modify resume sections

---

Built with ❤️ for seamless resume creation experience.
