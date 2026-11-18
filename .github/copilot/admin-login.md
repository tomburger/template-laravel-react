# Local development user roles

Snapshot checked on 2026-11-18. Recheck `src/database/database.sqlite` before using an account because roles and activation status can change.

| Account | Role | Status |
| --- | --- | --- |
| `prazeli1@burger.software` | Admin, pricing manager | Active |
| `prazeli4@burger.software` | Admin, community manager | Active |
| `prazeli2@burger.software`, `prazeli5@burger.software` | Content manager, community manager | Active |
| `prazeli6@burger.software`–`prazeli9@burger.software` | Regular user | Active |
| `admin@prazelenina.burger.software` | Regular user | Deactivated |
| `prazeli3@burger.software` | Regular user | Deactivated |

Do not store passwords here. When asked to log in as an admin, choose an active admin account and verify its current status first.

For the local seeded test password, check `src/database/migrations/2026_07_05_000000_seed_initial_admin_user.php`. Do not copy the password into this note.
