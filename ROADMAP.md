# Product Roadmap

## Vision

SaroopHai will become a professional LINE operations intelligence platform for companies that need isolated LINE chat data, searchable context, daily AI summaries, action tracking, and management visibility.

## Current Status

- [x] Core production foundation is in place.
- [x] Company data is separated so each company works with its own LINE groups, chats, summaries, settings, and operational data.
- [x] Authentication and protected dashboard access are in place.
- [x] System status, webhook health, error logs, and daily summary foundation are in place.

## Recommended Next Focus

The next priority should be turning the current foundation into a real team workflow loop:

1. Capture LINE chat activity reliably by company and group.
2. Generate daily summaries automatically.
3. Send useful summaries and reminders back to LINE.
4. Let teams manage action items until completion.
5. Give managers exportable reports and visibility.

## Phase 1: Production Ready Foundation

- [x] Roadmap document
- [x] Google login with NextAuth/Auth.js
- [x] LINE login with NextAuth/Auth.js
- [x] Protected dashboard route
- [x] Protected dashboard server actions
- [x] Company-level data separation
- [x] Webhook health page
- [x] Environment/setup status page
- [x] Error log viewer for LINE webhook and AI summary failures
- [x] Daily summary job foundation

## Phase 2: Team Workflow

Build the operational loop that teams will use every day.

- [ ] Make LINE webhook ingestion company-aware end to end
- [ ] Auto daily summaries by company and group
- [ ] Save daily summary history instead of only overwriting the latest summary
- [ ] Send summary back to the correct LINE groups
- [ ] Add action item owner, due date, priority, and completion workflow
- [ ] Add LINE reminders for overdue and due-soon action items
- [ ] Export company/group reports as PDF, Excel, and CSV
- [ ] Add admin controls for mapping LINE groups to the right company

## Phase 3: AI Knowledge Platform

Turn company chat history into a secure AI knowledge layer.

- [ ] Ask questions across historical LINE chats within the current company only
- [ ] Add vector/search indexing for summaries, topics, action items, and raw chat excerpts
- [ ] Topic and sentiment trend analytics by company, group, and time range
- [ ] Executive dashboard for company-level risks, workload, open actions, and key topics
- [ ] Role-based group access inside each company
- [ ] Audit log for sensitive admin and AI search activity
- [ ] Data retention controls per company

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

For the production domain, add this authorized redirect URI in Google Cloud Console:

```text
https://saroophai.tradingchill.com/api/auth/callback/google
```

For local development, create a separate LINE Login channel and add this callback URL in LINE Developers:

```text
http://localhost:4010/api/auth/callback/line
```

For the production domain, add this callback URL in LINE Developers:

```text
https://saroophai.tradingchill.com/api/auth/callback/line
```
