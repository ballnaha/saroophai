# Product Roadmap

## Vision

SaroopHai will become a professional LINE operations intelligence platform for teams that need searchable chat context, daily AI summaries, action tracking, and management visibility.

## Phase 1: Production Ready Foundation

- [x] Roadmap document
- [x] Google login with NextAuth/Auth.js
- [x] LINE login with NextAuth/Auth.js
- [x] Protected dashboard route
- [x] Protected dashboard server actions
- [ ] Webhook health page
- [ ] Environment/setup status page
- [ ] Error log viewer for LINE webhook and AI summary failures
- [ ] Daily summary job foundation

## Phase 2: Team Workflow

- [ ] Auto daily summaries by group
- [ ] Send summary back to LINE groups
- [ ] Action item owner, due date, priority, and completion workflow
- [ ] LINE reminders for overdue action items
- [ ] Export reports as PDF, Excel, and CSV

## Phase 3: AI Knowledge Platform

- [ ] Ask questions across historical LINE chats
- [ ] Topic and sentiment trend analytics
- [ ] Executive dashboard
- [ ] Multi-workspace SaaS structure
- [ ] Role-based group access

## Phase 1 Notes

Google OAuth and LINE Login require these environment variables:

```env
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_LINE_ID=
AUTH_LINE_SECRET=
NEXTAUTH_URL=http://localhost:4010
```

For local development, add this authorized redirect URI in Google Cloud Console:

```text
http://localhost:4010/api/auth/callback/google
```

For local development, create a separate LINE Login channel and add this callback URL in LINE Developers:

```text
http://localhost:4010/api/auth/callback/line
```
