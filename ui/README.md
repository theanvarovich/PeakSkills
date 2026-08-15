# PeakSkills UI
Next.js 15 App Router standard architecture for the PeakSkills talent matching platform.

## Architecture
This project implements the PeakSkills Phase 2 architecture:
- Design Tokens mapping to PeakSkills branding
- Strict Domain Types overriding explicit `any`
- Abstracted Database interfaces ready for Supabase

## Requirements
Node.js engine >= 20.18.1 is strictly required due to the underlying dependency structure of functional primitives (e.g., shadcn). Ensure your environment is upgraded before running `npm install`.

## Commands
- `npm run dev` - Starts development server.
- `npm run build` - Full production compilation with type checks.
