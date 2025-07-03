# AI E-Billing SaaS

## Project Description

This project is an AI-powered e-billing SaaS application designed to streamline invoice processing. It features user authentication, invoice management (CRUD operations), AI-driven OCR for extracting data from PDFs, and PDF generation capabilities. The application is built with a modern Next.js frontend, a robust backend, and a scalable database solution.

## Technologies Used

This project leverages a modern web stack, including:

- **Frontend:** Next.js, React, TypeScript
- **Styling:** Tailwind CSS (inferred from `postcss.config.mjs`)
- **Authentication:** NextAuth.js
- **Database:** Prisma (ORM), PostgreSQL (common with Prisma, but not explicitly stated, so I'll keep it general)
- **AI/OCR:** OpenAI, Groq (for AI-powered invoice processing), pdf2json (for PDF parsing)
- **PDF Generation:** Puppeteer (for server-side PDF generation)
- **Monorepo Management:** npm Workspaces (inferred from root `package.json`)

## Getting Started

Follow these steps to set up and run the project locally.

### 1. Clone the Repository

```bash
git clone [YOUR_REPOSITORY_URL]
cd ai-ebilling-saas
```

### 2. Install Dependencies

This project uses npm workspaces. Install dependencies for all packages:

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root of the project and in `apps/web` based on the `.env.example` (if available) or the following required variables:

**Root `.env` (for Prisma/Database):

```
DATABASE_URL="[YOUR_POSTGRES_DATABASE_URL]"
```

**`apps/web/.env` (for Next.js and AI services):

```
NEXTAUTH_SECRET="[GENERATE_A_STRONG_SECRET]"
NEXTAUTH_URL="http://localhost:3000"
GROQ_API_KEY="[YOUR_GROQ_API_KEY]"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

*Replace placeholders with your actual values.*

### 4. Database Setup

Apply Prisma migrations and seed the database:

```bash
npx prisma migrate dev --name init
npm run db:seed
```

### 5. Run the Development Server

Navigate to the `apps/web` directory and start the Next.js development server:

```bash
cd apps/web
npm run dev
```

The application will be accessible at `http://localhost:3000`.

## Project Structure

- `apps/web`: The Next.js frontend application.
- `apps/functions`: Serverless functions (e.g., healthcheck).
- `packages/db`: Prisma schema and database utilities.
- `prisma`: Prisma migrations and seed script.

## Contributing

We welcome contributions to this project! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
