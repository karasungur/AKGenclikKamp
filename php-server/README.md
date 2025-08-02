# PHP Server

This directory contains an initial PHP backend scaffold using [Slim](https://www.slimframework.com/) and MySQL.

## Setup

1. Copy `.env.example` to `.env` and adjust the database credentials.
2. Install dependencies:
   ```bash
   composer install
   ```
3. Start the server:
   ```bash
   php -S localhost:8080 -t public
   ```

The `/api/health` endpoint is available for a basic health check.

For quick scripts that need database access, `mysql.php` sets up a `$pdo`
connection using the environment settings:

```bash
php mysql.php
```
