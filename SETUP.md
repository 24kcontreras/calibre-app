# 🚀 SETUP GUIDE - CALIBRE (Neural Garage OS)

This guide provides step-by-step instructions to set up the CALIBRE development environment from scratch.

## 📋 Prerequisites

Before starting, ensure you have the following installed:
- **Node.js** (v18.x or higher)
- **npm** or **yarn**
- A **Supabase** account (Free or Pro)
- A **Google AI Studio** account (for Gemini API Key)

---

## 🛠️ 1. Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd calibre-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

---

## 🔑 2. Environment Configuration

Create a `.env.local` file in the root directory and fill in the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Configuration
GEMINI_API_KEY=your_google_gemini_api_key
GOOGLE_API_KEY=your_google_api_key_optional

# Application Configuration
NEXT_PUBLIC_BASE_URL=https://calibreapp.cl
NEXT_PUBLIC_FLOW_URL=your_flow_url_if_applicable
FLOW_API_KEY=your_flow_api_key
FLOW_SECRET_KEY=your_flow_secret_key
```

---

## 🗄️ 3. Supabase Backend Setup

### 3.1 Database Schema
The project relies on a specific relational schema. You must create the following tables in your Supabase SQL Editor:

- **`talleres`**: B2B master table (Tenant).
- **`clientes`**: Customer data linked to `taller_id`.
- **`vehiculos`**: Vehicle data linked to `clientes`.
- **`ordenes_trabajo`**: Main operational engine.
- **`items_orden`**: Services and parts checklist.
- **`fotos_orden`**: Evidence photo references.
- **`comentarios_orden`**: Internal technical notes.
- **`alertas_desgaste`**: Predictive maintenance logs.

*Refer to `ARQUITECTURA.md` for the detailed field definitions and relationships.*

### 3.2 Storage Buckets
You must create two public buckets in **Supabase Storage**:

1.  **`evidencia`**: For storing vehicle condition photos.
    - *Policy*: Public read, Authenticated write.
2.  **`logos`**: For storing workshop logos.
    - *Policy*: Public read, Authenticated write.

### 3.3 Row Level Security (RLS)
Ensure RLS is enabled on all tables. The primary policy should be:
`auth.uid() = taller_id` (or the equivalent link to the authenticated user).

---

## 🤖 4. AI Setup (Google Gemini)

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create a new API Key.
3. Paste the key into the `GEMINI_API_KEY` field in your `.env.local`.
4. Ensure you are using the `gemini-2.5-flash` model (or the current stable version specified in the API routes).

---

## 🏃 5. Running the Application

1. **Start the development server:**
   ```bash
   npm run dev
   ```
2. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚀 6. Deployment (Vercel)

1. Push your code to GitHub/GitLab.
2. Connect your repository to **Vercel**.
3. Add all the variables from `.env.local` to the **Environment Variables** section in Vercel.
4. Set the build command to `npm run build`.
5. Deploy.

---

## 🧪 7. Testing

To run the automated test suite (Vitest):
```bash
npm run test
```
