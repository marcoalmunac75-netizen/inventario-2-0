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

## Project rules
- Inventory data lives in the Lovable Cloud `activos` table and is read/written only through hooks in `src/lib/inventory.ts`; never bundle the real spreadsheet in the app, since it contains personal data.
- Access is enforced in the database: company-domain users read, `admin` role (in `user_roles`) writes; UI hiding of edit controls is cosmetic only.
- All app pages live under `src/routes/_authenticated/`; only `/auth` and `/reset-password` are public.
