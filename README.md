# checklist-admin

Локальная Next.js-админка для чек-листов. Она владеет Prisma schema/migrations и Docker Compose с PostgreSQL. Админка не имеет авторизации, поэтому Next.js и PostgreSQL настроены слушать только `127.0.0.1`.

```bash
docker compose up -d
npm run dev
```

Админка: `http://localhost:3000/admin`. Если порт 3000 занят сайтом: `npm run dev -- -p 3001`.

Переменные описаны в `.env.example`. `PUBLIC_SITE_DIR` указывает на `checklist-site`, куда сохраняются PNG, PDF и WebP. После изменения контента заново выполните `npm run build` в `checklist-site`.
