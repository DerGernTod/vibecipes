# Vibecipes Domain Glossary

## Core Concepts & Terminology

- **User**: An account holder on the platform who authenticates exclusively via WebAuthn Passkeys.
- **Recipe**: A culinary blueprint owned by a User, consisting of title, description, base servings count, ordered steps, dietary traits, revision history, and collection tags.
- **Recipe Step**: A discrete instruction step within a Recipe, featuring instructions, optional timer durations (seconds), and specific ingredients used in that step.
- **Canonical Ingredient**: A standardized global catalog entry representing a generic ingredient (e.g., "Oat Milk" / "Hafermilch") with English/German alias dictionaries, volumetric density ($g/ml$), default dietary trait (`VEGAN`, `VEGETARIAN`, `OMNIVORE`), and smart substitution parent links.
- **Recipe Step Ingredient**: An ingredient allocation assigned to a specific Recipe Step, specifying the Canonical Ingredient, quantity, base metric unit (`g`, `ml`, `piece`), and optional preparation note (e.g. "finely chopped").
- **Dietary Trait**: Culinary classification (`VEGAN`, `VEGETARIAN`, `OMNIVORE`). Automatically inferred based on ingredient hierarchy (`OMNIVORE` if any meat/fish > `VEGETARIAN` if any dairy/egg > `VEGAN` if all vegan; marked `UNVERIFIED` if any ingredient trait is unknown). Persisted in `recipes.dietary_traits` for fast SQLite filtering with optional manual override.
- **Unit Conversion Engine**: Deterministic TypeScript domain module (`src/domain/units.ts`) handling dynamic metric/imperial unit conversions with culinary snap boundaries (`15ml` -> `1 tbsp`, `5ml` -> `1 tsp`) and Unicode fraction rendering (`½`, `⅓`, `¼`).
- **Recipe Scaling**: Predictable linear scaling (`quantity * scaleFactor`) across recipe-level and step-level ingredient amounts, with UI warnings for scale factors > `2x`.
- **Pantry Item**: Inventory item defined by a User, recording existing stock quantity of a Canonical Ingredient and whether it is a zero-penalty household staple (e.g., salt, pepper, tap water).
- **Collection**: A hierarchical tag/folder owned by a User for organizing Recipes (e.g., `[Dinner] -> [Italian]`).
- **Share Permission**: Access control record granting `VIEWER` or `EDITOR` role scoped to a Recipe, a Collection, or all recipes (`SHARE_ALL`).
- **Recipe Revision**: Full JSON snapshot of a Recipe recorded upon modification for diffing and historical version rollback.
