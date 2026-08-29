i want to build a web platform for recipes. here's some basics:

* authentication, each user can create and view recipes

* a user can have multiple recipe collections (e.g. salads, dinner, ...), like tags

* sharing should be possible per recipe and per tag, and it should be possible to make a recipe "public", or just share it with a specific user

* there should be a possibility to "share all" with a specific user

* a recipe can have multiple pictures attached, has a list of steps, and a list of ingredients per step. the ingredients should be summarized to have an overview what the recipe requires in total

* it should be easy to switch between metric and imperial units (simple toggle with autocalc)

* it should be easy to scale the recipe

* ingredients should have a trait "vegan"/"vegetarian". based on that the recipe should show the total trait

* it should be possible to search for recipes by ingredients

* there should be an "upload from photo" feature that uses OCR and picture trimming from the foto of a recipe (e.g. from a recipe book or magazine) to be integrated into the platform

* there should be a possibility to track inventory: the user can define what they have at home (and how much of it), and the platform finds recipes they can cook, or suggests some (based on tag search?) that require just a few more things (and shows which ones and how much)

the details and design decisions follow:


# Recipe Platform - Technical Architecture & Implementation Blueprint

This document serves as the single source of truth for implementing the custom Web Recipe Platform. It outlines the core domain model, system architecture, feature workflows, and data structures agreed upon during design discovery.

---

## 1. System Stack & Core Architecture

* **Frontend**: Responsive Single-Page Application (SPA) with PWA-ready decoupled state architecture (enabling offline IndexedDB sync in future iterations).
* **Backend**: Node.js / TypeScript REST or RPC server.
* **Database**: SQLite (via Prisma or Drizzle ORM) for localized, clean data isolation.
* **Localization**: Dual-language support (**English** and **German**). All units default to **Metric** (`g`, `ml`, `°C`), with dynamic Imperial conversions.

---

## 2. Core Features & Functional Requirements

### 2.1 Recipe & Ingredient Structure

* **Step-Based Ingredients**: Ingredients are assigned per step (e.g., Step 1: 100g flour; Step 3: 50g flour).
* **Step Aggregation**: The UI aggregates total ingredient requirements at the top of the recipe while keeping step-specific preparation notes (e.g., total: "150g Butter", step notes: "100g melted", "50g cold").
* **Scaling & Unit Conversion**:
* Servings can be scaled dynamically, auto-calculating all amounts.
* Metric/Imperial toggle converts units on the fly.
* Base units preserve sensible boundaries (e.g., `15 ml` remains `15 ml` and does not auto-convert to `1 tbsp`).
* Basic density factors (g/ml) can be configured once per canonical ingredient.


* **Dietary Trait Inference**:
* Trait flags: `Vegan`, `Vegetarian`, `Omnivore`.
* Auto-computed as the common denominator of constituent ingredients (e.g., any non-vegan ingredient sets the calculated default to non-vegan).
* Manual override toggle available for recipe creators.



### 2.2 Canonical Ingredient & Smart Pantry Engine

* **Taxonomy & Deduplication**:
* Global canonical catalog with EN/DE alias mappings (e.g., `ing_oat_milk` maps to `["Oat Milk", "Oatmilk", "Hafermilch"]`).
* On ingredient creation, fuzzy match against global aliases and prompt: *"We found 'Oat Milk' (Hafermilch). Use this instead?"*


* **Smart Pantry Search & Matching**:
* **100% Match**: All ingredients present in sufficient quantities.
* **Close Match**: 1–2 items missing or acceptable smart substitutions available (e.g., *"Requires Milk; you have Oat Milk (close match)"*).
* **Staples Exclusion**: Pantry staples (salt, pepper, water, cooking oil) are excluded from match penalty calculations.


* **Pantry Deductions**: "Cooked This" button opens a confirmation modal allowing customized quantity subtractions from inventory stock.

### 2.3 Sharing & Permission Model

* **Access Control**: Read-Only default with explicit `Viewer` vs `Editor` role flags.
* **Hierarchical Tags/Collections**: Nested structure (e.g., `[Dinner] -> [Italian]`). Parent collection permissions cascade to all sub-collections.
* **Share Scopes**: Per-recipe, per-tag, or dynamic **"Share All"** with a specific user (grants live access to present and future recipes).
* **Revocation Rules**: Revoking access immediately cuts viewability and shows a notification banner to the recipient. If the recipient clicked **"Fork / Duplicate"**, their personal cloned copy remains unaffected.
* **Public Registry**: Searchable public listing + "Unlisted" secret link access.

### 2.4 Recipe Revision History

* **Full Snapshot Storage**: Every save creates an entry in a `recipe_revisions` table storing a full JSON snapshot of recipe fields, step data, and media path references along with optional user edit notes.
* **Diff UI**: Users can toggle between historical revisions to view past ratios or restore previous versions.

### 2.5 OCR & Web Import Pipeline

* **URL Import**:
1. Primary: Extract `Schema.org` (`JSON-LD` `Recipe`) microdata from blog links.
2. Fallback: Prompt user to upload a full-page screenshot (via browser DevTools) for OCR processing.


* **Photo OCR Processing**:
* Client-side interactive canvas selector allowing repeated manual crop boxes to extract dish and step photos.
* Backend API process extracts structured text (ingredients, steps, amounts) into a side-by-side draft editor modal for user validation.



### 2.6 Interactive "Cook Mode"

* Dedicated full-screen interface using browser **Wake Lock API** to keep display awake.
* Stepper UI with step-specific inline ingredient badges (e.g., *"Add **200g flour** to bowl"*).
* Integrated step timers.

### 2.7 Import / Export Specification

* **Export**: Generated `.zip` containing `recipe.json` + referenced image assets, plus an independent `.md` preview file.
* **Import**: Target accepts `.zip` bundle, parsing exclusively from `recipe.json` and associated media assets while ignoring the `.md` preview file.

---

## 3. Database Schema Blueprint (Drizzle / Prisma / SQLite)

```prisma
model User {
  id           String             @id @default(uuid())
  email        String             @unique
  name         String
  recipes      Recipe[]           @relation("Owner")
  collections  Collection[]
  pantryItems  PantryItem[]
  sharesGiven  SharePermission[]  @relation("Grantor")
  sharesRecv   SharePermission[]  @relation("Grantee")
}

model Ingredient {
  id            String            @id @default(uuid())
  primaryNameEn String
  primaryNameDe String
  aliasesJson   String            // Array of strings in EN & DE
  densityGPerMl Float?            // Optional density for volumetric conversion
  defaultTrait  String            // "VEGAN", "VEGETARIAN", "OMNIVORE"
  parentGroupId String?           // Links for smart substitution (e.g. Oat Milk -> Milk)
  parentGroup   Ingredient?       @relation("Substitutions", fields: [parentGroupId], references: [id])
  subtypes      Ingredient[]      @relation("Substitutions")
  stepItems     RecipeStepIngredient[]
  pantryItems   PantryItem[]
}

model Recipe {
  id             String           @id @default(uuid())
  ownerId        String
  owner          User             @relation("Owner", fields: [ownerId], references: [id])
  title          String
  description    String?
  servings       Int              @default(4)
  overrideTrait  String?          // "VEGAN", "VEGETARIAN", "OMNIVORE" or NULL (auto-calc)
  isPublic       Boolean          @default(false)
  isUnlisted     Boolean          @default(false)
  currentVersion Int              @default(1)
  steps          RecipeStep[]
  revisions      RecipeRevision[]
  collections    Collection[]     @relation("CollectionRecipes")
  shares         SharePermission[]
}

model RecipeStep {
  id          String                 @id @default(uuid())
  recipeId    String
  recipe      Recipe                 @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  stepIndex   Int
  instruction String
  timerSec    Int?
  ingredients RecipeStepIngredient[]
}

model RecipeStepIngredient {
  id              String     @id @default(uuid())
  stepId          String
  step            RecipeStep @relation(fields: [stepId], references: [id], onDelete: Cascade)
  ingredientId    String
  ingredient      Ingredient @relation(fields: [ingredientId], references: [id])
  rawText         String
  amount          Float
  unit            String     // Base unit: "g", "ml", "piece"
  preparationNote String?    // e.g. "melted", "finely chopped"
}

model RecipeRevision {
  id          String   @id @default(uuid())
  recipeId    String
  recipe      Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  version     Int
  editNote    String?
  snapshotJson String   // Full structured JSON representation of recipe, steps & image paths
  createdAt   DateTime @default(now())
}

model Collection {
  id        String       @id @default(uuid())
  ownerId   String
  owner     User         @relation(fields: [ownerId], references: [id])
  name      String
  parentId  String?
  parent    Collection?  @relation("Hierarchy", fields: [parentId], references: [id])
  children  Collection[] @relation("Hierarchy")
  recipes   Recipe[]     @relation("CollectionRecipes")
  shares    SharePermission[]
}

model PantryItem {
  id           String     @id @default(uuid())
  userId       String
  user         User       @relation(fields: [userId], references: [id])
  ingredientId String
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id])
  amount       Float
  unit         String
  isStaple     Boolean    @default(false)
}

model SharePermission {
  id           String      @id @default(uuid())
  grantorId    String
  grantor      User        @relation("Grantor", fields: [grantorId], references: [id])
  granteeId    String
  grantee      User        @relation("Grantee", fields: [granteeId], references: [id])
  scope        String      // "RECIPE", "COLLECTION", "SHARE_ALL"
  role         String      // "VIEWER", "EDITOR"
  recipeId     String?
  recipe       Recipe?     @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  collectionId String?
  collection   Collection? @relation(fields: [collectionId], references: [id], onDelete: Cascade)
}

```

---

## 4. Implementation Steps & Milestones

### Phase 1: Core Foundation & Domain Setup

1. Setup Node.js TypeScript project with SQLite database layer (Drizzle/Prisma).
2. Seed canonical ingredient taxonomy with basic density rules and English/German alias dictionaries.
3. Build base REST/RPC endpoints for Authentication, Recipes, and Step Ingredients CRUD.

### Phase 2: Trait Calculation, Scaling & Revision System

1. Implement culinary conversion module: handle base Metric unit scaling, unit locking, and optional Imperial conversion.
2. Implement auto-calculation engine for `Vegan`/`Vegetarian` traits with manual override flags.
3. Build full JSON snapshot revision logger on recipe update with optional user notes.

### Phase 3: Pantry Inventory & Matching Engine

1. Create Pantry CRUD with auto-complete matching canonical ingredients.
2. Implement 3-tier pantry match algorithm (100% Match, Close Match with Smart Substitution, Exclude Staples).
3. Build post-cooking stock deduction workflow modal.

### Phase 4: OCR & URL Import Workflows

1. Integrate Schema.org JSON-LD web scraper endpoint for recipe URLs.
2. Build frontend client-side canvas crop component for multi-image extraction.
3. Hook crop boxes into backend vision/OCR pipeline to pre-fill draft creation modal.

### Phase 5: Sharing, Cook Mode & Export

1. Build sharing subsystem handling dynamic "Share All", Tag hierarchies, and revocation triggers.
2. Implement Cook Mode UI with Wake Lock API, inline ingredient chips, and timer utilities.
3. Build `.zip` import/export engine parsing `recipe.json` payload + raw media assets.