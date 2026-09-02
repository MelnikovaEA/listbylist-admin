<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Architecture rules

- Organize application code by feature or domain instead of building flat collections in generic `lib` or `components` directories.
- Before adding files, inspect the surrounding structure and state the intended directory and responsibility of each new module.
- Keep modules cohesive and separate UI, form contracts, validation, application services, domain rules, and infrastructure when they represent genuinely different responsibilities.
- Use pragmatic Feature-Sliced Design: colocate feature-specific `ui`, `form`, `services`, `files`, and `model` code under `src/features/<feature>`.
- Keep reusable infrastructure such as database and object-storage clients outside features under `src/lib`.
- Do not add directory levels that do not distinguish responsibilities. This project is entirely an admin application, so feature paths must not repeat an `admin` segment.
- Avoid filename-prefix grouping in flat directories. When several closely related files form a recognizable subsystem or feature area, prefer a named subdirectory with concise filenames.
- Keep dependencies directed from presentation and orchestration toward domain and infrastructure modules; avoid circular imports.
- Prefer moving a feature-specific UI component into its feature over adding it to a global `src/components` directory.
- Colocate a CSS Module with the route, layout, or component that owns it. Do not create `src/ui` or another shared UI directory only to hold stylesheets without reusable UI components.
- Preserve coherent existing conventions. If existing placement conflicts with these rules, use the smallest scoped structural refactor necessary before adding more files to the wrong location.
- Do not restructure unrelated parts of the project as part of a local change.
