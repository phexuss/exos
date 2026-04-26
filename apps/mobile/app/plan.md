# EXØS Auth Integration Plan

## Контекст

Бэкенд (NestJS) уже готов:

- POST /auth/register — регистрация
- POST /auth/login — логин → { accessToken, refreshToken, tokenType, accessExpiresIn }
- POST /auth/refresh — обновление токенов
- POST /auth/logout — выход
- GET /auth/status — проверка токена
- POST /auth/verify — верификация email по 6-значному коду
- POST /auth/verify/resend — повторная отправка кода

Resend отправляет письмо с 6-значным кодом на email при регистрации.
Prisma хранит User + Session.
JWT: accessToken (15m) + refreshToken (30d).

## Что нужно сделать на фронте (Expo)

### 1. Установить зависимости

```bash
npx expo install expo-secure-store
```

### 2. Token Storage — services/auth/tokenStorage.ts

Создать сервис для хранения токенов в expo-secure-store:

- saveTokens(access, refresh)
- getAccessToken()
- getRefreshToken()
- clearTokens()

### 3. Auth API — services/auth/authApi.ts

Функции для работы с бэком:

- register(name, username, email, password) → POST /auth/register
- login(username, password) → POST /auth/login → сохранить токены через tokenStorage
- logout() → POST /auth/logout → clearTokens
- verifyEmail(userId, code) → POST /auth/verify
- resendCode(userId, email) → POST /auth/verify/resend
- refreshTokens() → POST /auth/refresh → сохранить новые токены

### 4. API клиент обновить — services/api/client.ts

Добавить автоматический refresh при 401:

- к каждому запросу добавлять Authorization: Bearer accessToken
- если 401 → вызвать refreshTokens()
- если refresh тоже упал → clearTokens() + редирект на логин

### 5. Auth Store — store/useAuthStore.ts

Zustand стор:

- user: { id, username, email, isVerified } | null
- isLoading: boolean
- login(username, password)
- register(name, username, email, password)
- logout()
- checkAuth() — проверить токен при старте приложения через GET /auth/status

### 6. Экраны

#### app/(auth)/_layout.tsx

Stack layout для auth экранов с animation: 'fade'

#### app/(auth)/welcome.tsx — Welcome экран

- Логотип EXØS по центру (большой, с accent цветом)
- Subtitle: "Your music, your way"
- Кнопка "Get Started" → /auth/register
- Кнопка "Sign In" → /auth/login
- Минималистичный дизайн, тёмный фон

#### app/(auth)/register.tsx — Регистрация

Поля:

- Name (имя)
- Username
- Email
- Password
  Кнопка "Create Account"
  После успеха → /auth/verify с передачей userId и email через params

#### app/(auth)/login.tsx — Логин

Поля:

- Username
- Password
  Кнопка "Sign In"
  Ссылка "Don't have an account? Register"
  После успеха → router.replace('/(tabs)')

#### app/(auth)/verify.tsx — Верификация email

- Показать email на который отправлен код
- 6 отдельных инпутов для каждой цифры кода (как в банковских приложениях)
- Кнопка "Verify"
- Кнопка "Resend code" (с таймером 60 секунд)
- После успеха → router.replace('/(tabs)')

### 7. Защита роутов — app/_layout.tsx

В корневом layout добавить checkAuth при старте:

- если нет токена → router.replace('/(auth)/welcome')
- если токен есть и валидный → router.replace('/(tabs)')
- показывать SplashScreen пока идёт проверка

### 8. Logout

В профиле/настройках вызвать useAuthStore.logout()
После → router.replace('/(auth)/welcome')

## Дизайн

Использовать существующие COLORS, компоненты AppText, AppIcon, AnimatedPressable.
Стиль как у остального приложения — тёмный, минималистичный, accent #818CF8.
Инпуты: тёмный фон #1A1A1A, border rgba(255,255,255,0.12), border-radius 12.
Кнопки: основная белая (#FFFFFF) с тёмным текстом, вторичная прозрачная.

## Важно

- НЕ трогать существующие экраны (tabs, player, etc)
- НЕ трогать audioService, playerStore, downloadStore
- userId который приходит после register передавать в verify через router params
- Все ошибки показывать пользователю (неверный пароль, код истёк и т.д.)
