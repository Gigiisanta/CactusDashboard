🌵 Cactus Wealth — Unified Project Ruleset

Single source of truth for every contributor. Follow everything here — no exceptions.

⸻

1. Purpose & Scope
	•	Mission: Deliver a secure, production-ready fintech platform that feels seamless and human-centric.
	•	Applies to: All code, infrastructure, design, documentation, and automation touching Cactus Dashboard, CactusCRM, or any satellite repo.

⸻

2. Tech-Stack Snapshot

Layer	Primary Tech	Notes
Backend	FastAPI (Async)	SQLModel, Pydantic, Alembic
Frontend	Next.js 14 + TypeScript (strict)	Tailwind, shadcn/ui, Zustand
Database	PostgreSQL (prod) / SQLite (dev)	TimescaleDB optional
CI/CD & Infra	Docker, GitHub Actions, AWS (t4g Free Tier), nginx	cactus.sh orchestrates local + CI scripts
Automation	n8n (local), Cursor, Replit	AI-driven workflows


⸻

3. Architecture Principles
	1.	Layered flow: endpoints → services → crud → models (no business logic leaks).
	2.	Composition > inheritance; async everywhere.
	3.	Strict typing (Python + TS) — zero any, zero implicit types.
	4.	English-only identifiers & comments.
	5.	DRY & token-efficient: remove dead code, avoid repetition, centralise configs.
	6.	Source of truth: CactusDashboard.md for structure, this file for rules.

⸻

4. Output & Token Optimisation
	•	Eliminate fluff. One code block, production-ready, no verbose comments.
	•	Never repeat context already defined here.
	•	Maintain security & architecture fidelity while minimising tokens.

⸻

5. Security Doctrine (☑ must-pass before merge)

5.1 Data Protection
	•	AES-256 at rest, TLS 1.3 in transit, GDPR/CCPA compliant PII handling.
	•	Cross-border rules: respect data-sovereignty per jurisdiction.

5.2 AuthN & AuthZ
	•	MFA for advisors, short-lived JWT + refresh rotation.
	•	RBAC: ADMIN ▸ full, SENIOR_ADVISOR ▸ team, JUNIOR_ADVISOR ▸ own, COMPLIANCE ▸ read-only.

5.3 Infrastructure
	•	Scan Docker images, never hard-code secrets, env-vars + secret manager only.
	•	Network segmentation & firewalls; encrypted DB connections.

5.4 Audit & Compliance
	•	Immutable audit log, FINRA / SEC / MiFID II alignment, daily encrypted backups.

5.5 API Security
	•	Rate-limit, validate every input, strict CORS, semantic versioning.

Security checklist for every PR:
	•	[ ] Auth verified   - [ ] RBAC enforced   - [ ] Input validated   - [ ] Sensitive data encrypted   - [ ] Audit log   - [ ] No info-leak errors   - [ ] Rate-limit   - [ ] Security tests

⸻

6. API Design Patterns
	1.	RESTful URLs: plural nouns (/api/v1/clients).
	2.	Verbs: GET, POST, PUT, DELETE only.
	3.	Response shell:

{ "success": true/false, "data": …, "message"|"error": …, "pagination"?: … }

	4.	Status codes: 200/201/400/401/403/404/422/500.
	5.	No business logic in endpoints.

⸻

7. Core Coding Standards
	•	Async/await for all I/O; blocking calls prohibited.
	•	Depends() for DI in FastAPI.
	•	Zero magic numbers/strings — use Enum/const.
	•	TypeScript strict mode, ESLint + Prettier; Python ruff + mypy.
	•	Tests: pytest (back), Jest + Playwright (front) — 100 % coverage on new code.

⸻

8. Secure Coding Practices (OWASP Top-10 aligned)
	1.	Validate & sanitise every input (see ClientCreate example).
	2.	Parameterised SQL only; never log PII.
	3.	Safe CORS headers; content-security-policy where applicable.
	4.	Secrets via env, not code.
	5.	No SQL/command/string concatenation.

⸻

9. UI / UX Guidelines
	•	Brand palette: --primary-green #2E5339, --sage-green #587B7F, --cactus-bloom #D4AC0D, --desert-sand #F5F0E1, --charcoal #343a40.
	•	Financial data: always toLocaleString currency, red ↓, cactus-bloom ↑.
	•	Components: shadcn/ui; skeletons for loading; responsive & accessible by default.
	•	No raw numbers, no off-brand colours, no missing loading states.

⸻

10. Testing Requirements

Layer	Tooling	Minimum
Backend	pytest + httpx	Service & endpoint tests
Frontend	Jest + React Testing Library	Component tests
E2E	Playwright	Critical flows
Security	pytest-security, bandit	High-risk paths


⸻

11. Development Workflow (🚀 cactus.sh first)
	1.	Plan → atomic checklist.
	2.	Secure → apply §5.
	3.	Code → follow §3/7.
	4.	Test → run lints, type-checks, coverage.
	5.	Verify → CI GitHub Actions.
	6.	Deploy → Docker → AWS EC2 t4g via cactus.sh deploy.

⸻

12. RBAC Matrix (Quick View)

Role	Clients	Team	System	Audit
ADMIN	R/W	All	Full	Full
SENIOR_ADVISOR	R/W	Own team	Limited	View
JUNIOR_ADVISOR	R/W own	—	—	View own
COMPLIANCE	Read-only	—	—	Full


⸻

13. Critical File Index
	•	cactus.sh — command hub (build, test, deploy).
	•	app.py (FastAPI entry) | api.ts (client) | AuthContext.tsx | globals.css.
	•	data_collector.py, data_manager.py — DB ops.

⸻

14. Anti-Patterns (NEVER DO)
	•	Business logic in endpoints
	•	Direct DB access from endpoints
	•	Sync code in async context
	•	Hard-coded secrets / PII in logs
	•	Non-RESTful URLs, inconsistent responses
	•	Off-brand UI, missing tests, verbose output

⸻

15. Feature / PR Checklist
	•	Follows architecture & coding standards (§3, §7)
	•	Passes token-optimised output rule (§4)
	•	Completes security checklist (§5)
	•	API follows design pattern (§6)
	•	UI complies with brand (§9)
	•	Tests included (§10) & green
	•	cactus.sh commands updated if needed

Merge only when every box is ticked.

⸻

End of Ruleset

Keep this file up to date — it overrides any older individual rule files.