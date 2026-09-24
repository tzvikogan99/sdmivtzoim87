{
  "name": "shiur-daled-mivtzoim",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "postinstall": "prisma generate"
  },
  "dependencies": {
    "@prisma/client": "^5.20.0",
    "bcryptjs": "^2.4.3",
    "next": "14.2.15",
    "next-auth": "^4.24.8",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "prisma": "^5.20.0",
    "tailwindcss": "^3.4.13",
    "tsx": "^4.19.1",
    "typescript": "^5"
  }
}
