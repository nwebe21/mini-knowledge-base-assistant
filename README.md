# Mini Knowledge-Base Assistant

## 1. Overview

This project is a **mini knowledge-base assistant** that allows users to query travel information from selected ShermansTravel pages. It leverages **OpenAI embeddings**, **Pinecone**, and **Supabase** to provide fast, accurate answers with traceable sources.  

The assistant is built as a **full-stack Next.js application** with authentication and persistent chat storage.

---

## 2. Features

- **Manual scraping** of four ShermansTravel pages via a `/scrape` API endpoint:

  | URL | Label |
  | --- | --- |
  | https://www.shermanstravel.com/cruise-destinations/alaska-itineraries | Alaska |
  | https://www.shermanstravel.com/cruise-destinations/caribbean-and-bahamas | Caribbean & Bahamas |
  | https://www.shermanstravel.com/cruise-destinations/hawaiian-islands | Hawaiian Islands |
  | https://www.shermanstravel.com/cruise-destinations/northern-europe | Northern Europe |

- **RAG (Retrieval-Augmented Generation)**
  - Chunks of scraped content are embedded using **OpenAI embeddings**.
  - Stored in **Pinecone vector index**.
  - User queries are converted to embeddings and matched to the top relevant chunks to generate accurate AI responses.

- **Chat API (`/api/chat`)**
  - Accepts user questions and returns AI-generated answers.
  - Persists each chat exchange per session in **Supabase**
  - Supports continuing previous chat sessions or starting new sessions.

- **Authentication**
  - Uses **Supabase Authentication** to protect user data.
  - Users only see their own chat history.

- **Responsive Frontend**
  - Built with **Next.js**.
  - Mobile-friendly UI.
  - Chat interface with session history sidebar.
  - Allows logout and session switching.

- **Deployment**
  - Fully deployable to **Railway** or other cloud platforms.
  - Environment variables used for OpenAI, Pinecone, and Supabase credentials.

---

## 3. Tech Stack

- **Frontend:** Next.js (React + TypeScript), Tailwind CSS  
- **Backend:** Next.js API routes, Node.js  
- **Database:** Supabase (PostgreSQL)  
- **Vector Search:** Pinecone  
- **AI:** OpenAI GPT models (Chat Completions / Response API)  
- **Authentication:** Supabase Auth  

---

## 4. Supabase Schema

### `chat_sessions` table

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | uuid | Primary key |
| user_id | uuid | Foreign key → `users.id` |
| title | text | Session title |
| created_at | timestamp | Default `now()` |

### `chat_messages` table

| Column | Type | Notes |
| ------ | ---- | ----- |
| id | uuid | Primary key |
| session_id | uuid | Foreign key → `chat_sessions.id` |
| user_id | uuid | Foreign key → `users.id` |
| content | text | Question or answer |
| role | text | `user` or `assistant` |
| sources | jsonb | Array of source URLs used for the answer |
| created_at | timestamp | Default `now()` |

---

## 5. Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=<your_supabase_url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
NEXT_PUBLIC_APP_EMAIL_DOMAIN=<public-app-email-domain>
OPENAI_API_KEY=<your_openai_api_key>
PINECONE_API_KEY=<your_pinecone_api_key>
PINECONE_ENVIRONMENT=<pinecone_env>
PINECONE_INDEX_NAME=<pinecone_index>
NEXT_PUBLIC_APP_URL=<public_app_url>
```

---

## 6. Running Locally
- First, run the development server:
      ```bash
      npm run dev
      # or
      yarn dev
      # or
      pnpm dev
      # or
      bun dev
      ```
- Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
- You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

---

## 7. Usage

- **Scrape Data:** `POST /api/scrape` → populates Pinecone index with content embeddings.  
- **Store Chat:** `POST /api/chat` → send a question, get a response and store messages.
- **Retrieve Chat:** `GET /api/chat?userId=${userId}&sessionId=${sessionId}` → retrieve chat of the current session.
- **View Sessions:** `GET /api/session?userId=<user_id>` → retrieve all chat session of user.
- **Create Session:** `POST /api/session` → create and store the session.
- **Delete Session:** `DELETE /api/history?userId=<user_id>` → delete the current session.
- **Authentication:** Login or register via Supabase Auth.  

---

## 8. Deployment

- Deploy both frontend and backend to **Railway**.  
- Configure environment variables in Railway dashboard.  
- Ensure Supabase, Pinecone, and OpenAI credentials are correct.  

---

## 9. Notes

- All answers are grounded in the scraped ShermansTravel pages via Pinecone retrieval.
- If no relevant content is found from the sources, the assistant will respond that the answer could not be found in the available resources.
- Each user can only access their own chat history.  
- Source URLs for AI answers are saved in `chat_messages.sources`.
