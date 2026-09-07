# /devops — DevOps, Environment & Deployment Command

## Purpose
Manage environment configurations, deployment scripts, CI/CD pipelines, Docker containers, web server setups (Nginx/Apache), queue workers, and database migrations.

## Phase
**Implement** (Part of the Implementation Phase)

## When to Use
- Managing VPS deployment scripts and server configurations.
- Setting up Node/Vite build scripts, PHP-FPM, Supervisor workers, and Cron jobs.
- Troubleshooting deployment failures, environment variables (`.env`), SSL, or database connectivity.

## Workflow & Guidelines
1. **Environment Configuration**:
   - Manage `.env.example` and ensure all required environment variables are documented.
   - Never commit sensitive production secrets, API keys, or database credentials to git.
2. **Build & Asset Compilation**:
   - Verify `npm run build` generates production assets cleanly without warnings or errors.
   - Optimize bundle size and chunking in `vite.config.js`.
3. **Server & Process Management**:
   - Configure queue workers (Laravel Horizon or `queue:work` via Supervisor).
   - Configure cron schedulers (`php artisan schedule:run`).
   - Configure Nginx reverse proxy, gzip/Brotli compression, security headers, and HTTPS.
4. **Database & Migrations**:
   - Run safe database migrations (`php artisan migrate --force` in deployment scripts).
   - Set up automated database backups and recovery plans.
