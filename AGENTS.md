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
- Inventory data lives in `src/lib/inventory.ts` (in-memory store persisted to browser localStorage, seeded from `src/data/inventario.json`, generated from the user's Excel with placeholder values like "SIN INFORMACIÓN" stored as empty strings); swap this module for a backend when shared data is needed, since every page reads through `useInventory()`.
- Bump the localStorage key in `inventory.ts` whenever the seed data or record shape changes, so browsers drop stale copies.
