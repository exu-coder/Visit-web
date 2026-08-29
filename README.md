# Visit-web

Visit-web is a React + Vite web application with a standalone Node.js API backed by MongoDB Atlas.

## Stack

- React + TypeScript
- Vite
- Tailwind CSS
- Express
- MongoDB Atlas

## Local development

1. Install Node.js 20+.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI`, `MONGODB_DB`, and `AUTH_SECRET`.
4. Install dependencies with `npm install`.
5. Run the frontend with `npm run dev`.
6. Run the API with `npm run server`.

The frontend uses `/api` for application data and authentication. Set `VITE_API_URL` when the API is hosted separately.

## MongoDB

The application database is `visit_web`. Core collections include profiles, user roles, orders, packages, coupons, payments, announcements, and site settings.

## Deployment

Deploy the Vite frontend and Node API using your preferred hosting provider. Configure the MongoDB connection string and authentication secret as server environment variables; never commit them to Git.
