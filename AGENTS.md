<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## EcoTrack architecture
- Roles live only in `user_roles` (checked via `has_role`); never on profiles — prevents privilege escalation.
- Admins read data only through security-definer aggregate functions (`admin_dashboard`, `leaderboard_*`) that suppress groups under 5 people — individual trips must never reach admins.
- CO2e is computed in the database trigger from the editable `emission_factors` table; client-side `src/lib/emissions.ts` mirrors it only for live previews and tips.
- Demo accounts use fixed UUIDs that own seeded rows; `ensureDemoUser` server fn creates their auth users on demand.
