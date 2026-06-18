<img width="1856" height="576" alt="cover" src="https://github.com/user-attachments/assets/1f5015d3-a608-4cf9-b246-fbf64c9dbe68" />

# BLOOM - _grow beyond limits_
> An organic digital conservatory where unrelated worlds collide, cross-pollinate, and bloom into radical, production-ready blueprints.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Google Gemma 4](https://img.shields.io/badge/Google-Gemma_4-4285f4.svg?style=flat&logo=google&logoColor=white)](https://ai.google.dev/gemma)
[![React 19](https://img.shields.io/badge/React-19-20232a.svg?style=flat&logo=react&logoColor=61dafb)](https://react.dev)
[![TypeScript 5.x](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite 7.x](https://img.shields.io/badge/Vite-7.x-646cff.svg?style=flat&logo=vite&logoColor=white)](https://vite.dev)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-purple?style=flat&logo=framer&logoColor=white)](https://motion.dev)
[![Zustand](https://img.shields.io/badge/State-Zustand-orange.svg?style=flat&logo=react&logoColor=white)](https://zustand-demo.pmnd.rs)
[![Tailwind 4.x](https://img.shields.io/badge/Tailwind-4.x-06b6d4.svg?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Lucide React](https://img.shields.io/badge/Icons-Lucide_React-pink.svg?style=flat)](https://lucide.dev)
[![Supabase Backend](https://img.shields.io/badge/Supabase-Backend-3ecf8e.svg?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Deployment-Vercel-black.svg?style=flat&logo=vercel&logoColor=white)](https://vercel.com)

<img width="1365" height="634" alt="img1" src="https://github.com/user-attachments/assets/a3dc2d4b-ce6b-42a9-9682-ff1bcffe21a4" />

<img width="1296" height="601" alt="m4" src="https://github.com/user-attachments/assets/00c85389-3562-4139-af1b-8d2e996f409f" />

## The Creative Revolution Has Bloomed

Meet BLOOM, the ultimate playground for individual creators, solo inventors, and visionary thinkers who are tired of standard, boring AI responses. BLOOM is an organic digital conservatory designed to smash together completely unrelated worlds, text, and images to grow ideas that have never existed on this planet before.
Instead of typing standard prompts into a corporate chat box, BLOOM lets you plant conflicting inputs to watch them mutate, cross-pollinate, and explode into radical, production-ready blueprints.

* 🌸 Launch the Lab: [Try Now](https://trybloomlabs.vercel.app/ "Go to BLOOM official site")  
* 🌸 Video Walkthrough: [Watch Now](https://youtu.be/2nzXjrcIF18?si=PWce5YJMGGDX_dct "Watch BLOOM Demo on Youtube")
  
---

## 🌟 Mind-Bending Features & Capabilities

* **🌱 The Multi-Modal Seed Altar:** Drop in your high-stakes problem text or image on one side, then plant a completely wild, disconnected visual inspiration matrix on the other side to spark instant, radical cross-pollination between separate realities.
  
* **🌸 Living Botanical Architecture:** Watch your structured data transform into a living digital ecosystem where main structural flowers represent core entities, and their glowing, interactive petals represent distinct sub-entities.
  
* **⚡ Interactive Synaptic Grafting:** Click, drag, and physically wire two different concept flowers together on your screen to force an instant structural collision, watching the engine think and breed completely out-of-the-box breakthroughs.
  
* **🔬 Ecosystem Manipulation:** Take total physical control of your conceptual garden by deleting specific petals to prune away sub-entities, or combine multiple flowers to watch them cross-pollinate, giving rise to entirely new mutant flowers in real time.
  
* **🧠 Dual Engine Growth Modes:** Toggle the cognitive state of the router. Use **Focused Mode** for razor-sharp engineering logic, or unleash **Divergent Mode** to widen the gating softmax, forcing the engine to look past obvious logic and pull in its fringe specialists.
  
* **👁️ The Core Observatory:** Pull back the curtain on the black box of artificial intelligence. A live analysis panel streams the model's raw internal `reasoning_details` text in real time, exposing exactly how it navigates its thoughts to bridge your inputs.
  
* **📊 The Ultimate Innovation Harvest:** Step into a beautiful markdown workspace containing fully realized blueprints divided into **Core Insights**, **Future Scenarios**, and **Flow Analysis** for every single cross-pollination sequence analyzed.
  
* **🎨 Adaptive Aesthetic Ecosystem:** Designed to fit your exact creative workflow seamlessly with full native support for both clean **Light Mode** and futuristic, dark-mode neon-glassmorphic layouts.
  
* **🤖 Pure Machine Imagination:** Every single connection, hybrid concept, and radical blueprint is thought up entirely from scratch by the core intelligence engine, ensuring true originality with zero human bias.

---

## 🧠 Why Gemma 4 26B MoE A4B is the Only Choice

BLOOM is built *on* and *for* the specific sparse architecture outlined in the latest Google technical briefs:

* **🌸Isolating the Spark:** With a pool of **128 internal specialists**, Gemma 4 can hold two entirely conflicting concepts in isolated mental compartments simultaneously, avoiding the semantic compression that ruins dense models.
  
* **🌸The 8-Expert Synergy:** By activating exactly **8 precise specialists per token + 1 unified shared expert**, the gating network forces diverse domains (like a biological pattern specialist and a software architecture specialist) to argue and align token by token.
  
* **🌸 Massive 256K Context Window:** Provides a massive data runway that allows BLOOM to track intricate visual details and deep textual strings concurrently, tracking your garden history over long iterative sessions.
  
* **🌸 Google AI Studio API Integration:** Leveraging the ultra-fast, high-throughput Google AI Studio pipeline allows the application to capture and stream deep internal reasoning blocks with zero latency.

* **🌸 Dynamic Parameter Blending & Algorithmic Guardrails:** Instead of just connecting to an API, the system utilizes an advanced multi-parameter injection pipeline. Bloom dynamically blends user-defined parameters with an algorithmic creativity level, altering ( $temperature$, $topP$, and $topK$ ) on the fly. Paired with state-aware canvas tracking and a resilient, multi-tiered JSON repair pipeline, the system handles extreme creative scaling without ever hallucinating syntax errors.
---

## 🏗️ Architecture & Repository Structure
BLOOM is a single-page React + TypeScript application powered by Vite. The frontend talks directly to Google Gemma 4 for multi-modal generation and persists snapshots, interactions, and uploads to Supabase.

<details>
<summary><b>View Directory Structure</b></summary>

```text
bloom/
├── public/
│   └── images/                    # Static assets (logo.png, orb.png)
├── src/
│   ├── components/
│   │   ├── Canvas/                # Interactive SVG concept garden
│   │   │   ├── Canvas.tsx         # Main canvas: pan, zoom, drag-connect, tooltips
│   │   │   ├── CentralOrb.tsx     # The "Core Soul" orb (Gemma 4 anchor)
│   │   │   ├── FlowerNode.tsx     # Animated flower + petal renderer
│   │   │   └── VineConnection.tsx # Bezier vine connections with energy particles
│   │   ├── HarvestPanel/          # Bottom drawer of harvest insight cards
│   │   │   ├── HarvestPanel.tsx
│   │   │   └── ShareModal.tsx
│   │   ├── Landing/               # Marketing landing page
│   │   │   └── LandingPage.tsx
│   │   ├── RightPanel/            # Reasoning stream + model controls
│   │   │   ├── RightPanel.tsx
│   │   │   ├── ReasoningStream.tsx
│   │   │   └── ModelControls.tsx
│   │   ├── Header.tsx             # Top bar: mode, creativity, theme, online status
│   │   ├── LeftPanel.tsx          # Input matrices (problem + inspirations)
│   │   └── StartGrowthButton.tsx
│   ├── lib/
│   │   └── supabase.ts            # Supabase client + persistence helpers
│   ├── services/
│   │   └── ai.ts                  # Gemma 4 orchestration, prompt building, JSON parsing
│   ├── store/
│   │   └── useStore.ts            # Zustand global state
│   ├── utils/
│   │   ├── layout.ts              # Flower ring positioning + bezier paths
│   │   └── cn.ts                  # Tailwind class merge helper
│   ├── App.tsx                    # Root router + generation orchestrator
│   ├── main.tsx                   # Entry point
│   ├── index.css                  # Global styles + theme variables + animations
│   └── vite-env.d.ts
├── .env                           # API keys (gitignored)
├── vercel.json                    # SPA rewrites for /home, /dashboard
├── vite.config.ts                 # Vite + Tailwind + React + single-file bundling
├── tsconfig.json
└── package.json

```

</details>

---

### Major Directories

| Directory | Purpose |
|---|---|
| **`src/components/Canvas/`** | The heart of BLOOM — an SVG-based interactive garden with pan/zoom, drag-to-connect synaptic grafting, hover tooltips, and animated flower swaying. |
| **`src/components/RightPanel/`** | The Core Observatory — live streaming of the model's reasoning chain with anti-loop sanitization, plus fine-grained model parameter sliders. |
| **`src/components/HarvestPanel/`** | The Innovation Harvest — categorized blueprint cards (Core Insights, Future Scenarios, Flow Analysis, Generated Artifacts). |
| **`src/services/ai.ts`** | All Gemma 4 orchestration: multi-modal payload building, system instruction generation, JSON extraction & repair, connection rule enforcement. |
| **`src/lib/supabase.ts`** | Garden snapshot persistence, upload metadata, interaction event logging. |
| **`src/store/useStore.ts`** | Single Zustand store with the full application state graph. |

---

## ✅ Prerequisites

Before you start, make sure you have the following installed:

| Tool | Minimum Version | Purpose |
|---|---|---|
| [**Node.js**](https://nodejs.org/) | `v18.0+` (LTS recommended) | JavaScript runtime |
| [**npm**](https://www.npmjs.com/) / [**pnpm**](https://pnpm.io/) / [**yarn**](https://yarnpkg.com/) | latest | Package manager |
| [**Git**](https://git-scm.com/) | `v2.30+` | Version control |
| [**Google AI API Key**](https://aistudio.google.com/app/apikey) | — | For Gemma 4 generation |
| [**Supabase Account**](https://supabase.com/) | — | *(Optional)* For persistence |

---

### A. Clone the Repository

```bash
git clone https://github.com/pmrinal2005/bloom.git
cd bloom
```
#### Install dependencies:
```bash
npm install react@19 react-dom@19 typescript vite@7 vite-plugin-singlefile tailwindcss@4 tailwind-merge clsx zustand framer-motion lucide-react @google/genai @supabase/supabase-js
```

### B. Environment Configuration

Create a `.env` file in the project root (next to `package.json`). You can copy the template using the command for your operating system:

#### Linux / macOS
```bash
cp .env.example .env
```

#### Windows (PowerShell)
```powershell
Copy-Item .env.example .env
```

#### Windows (CMD)
```cmd
copy .env.example .env
```

Then open the `.env` file and fill in your credentials:

```env
# Required — Google AI Studio API key for Gemma 4
VITE_GOOGLE_AI_API_KEY=your-google-ai-key-here

# Supabase project 
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_your_anon_key
```

Put this code into your Supabase SQL Editor: 
```
-- This is the complete schema with one optional additive column.

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── Projects ──
create table if not exists projects (
  id                  text primary key,
  name                text not null default 'Untitled Garden',
  problem_description text,
  growth_mode         text not null default 'Focused'
                        check (growth_mode in ('Focused','Divergent')),
  creativity_level    float not null default 0.7
                        check (creativity_level between 0 and 1),
  is_archived         boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── Uploads ──
create table if not exists uploads (
  id            text primary key,
  project_id    text not null references projects(id) on delete cascade,
  file_url      text not null,
  file_type     text not null check (file_type in ('image','video')),
  thumbnail_url text,
  description   text,
  slot          text,
  created_at    timestamptz not null default now()
);

-- ── Garden Snapshots ──
create table if not exists garden_snapshots (
  id               text primary key default gen_random_uuid()::text,
  project_id       text not null references projects(id) on delete cascade,
  generation_index integer not null default 1,
  trigger_type     text not null default 'auto',
  is_current       boolean not null default true,
  created_at       timestamptz not null default now()
);

create index if not exists idx_snapshots_project_current
  on garden_snapshots(project_id, is_current);

-- ── Flowers ──
create table if not exists flowers (
  id           text primary key,
  snapshot_id  text not null references garden_snapshots(id) on delete cascade,
  project_id   text not null references projects(id) on delete cascade,
  flower_label text not null,
  entity_name  text not null,
  position_x   float not null default 0,
  position_y   float not null default 0,
  color_theme  text not null default 'cyan'
                 check (color_theme in ('cyan','green','pink','orange','blue','purple','yellow')),
  ring         integer not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_flowers_snapshot on flowers(snapshot_id);
create index if not exists idx_flowers_project  on flowers(project_id);

-- ── Petals ──
create table if not exists petals (
  id              text primary key,
  flower_id       text not null references flowers(id) on delete cascade,
  project_id      text not null references projects(id) on delete cascade,
  petal_label     text not null,
  sub_entity_name text not null,
  description     text,
  angle           float,
  created_at      timestamptz not null default now()
);

create index if not exists idx_petals_flower  on petals(flower_id);
create index if not exists idx_petals_project on petals(project_id);

-- ── Connections ──
create table if not exists connections (
  id                       text primary key,
  snapshot_id              text not null references garden_snapshots(id) on delete cascade,
  project_id               text not null references projects(id) on delete cascade,
  source_type              text not null check (source_type in ('orb','flower')),
  source_id                text not null,
  target_type              text not null default 'flower',
  target_id                text not null,
  relationship_description text,
  is_manual                boolean not null default false,
  created_at               timestamptz not null default now()
);

create index if not exists idx_connections_snapshot on connections(snapshot_id);
create index if not exists idx_connections_project  on connections(project_id);

-- ── Reasoning Logs ──
create table if not exists reasoning_logs (
  id                  text primary key,
  snapshot_id         text not null references garden_snapshots(id) on delete cascade,
  project_id          text not null references projects(id) on delete cascade,
  step_number         integer not null,
  text_content        text not null,
  highlighted_phrases text[] not null default '{}',
  created_at          timestamptz not null default now()
);

create index if not exists idx_reasoning_snapshot on reasoning_logs(snapshot_id);

-- ── Harvest Results ──
create table if not exists harvest_results (
  id          text primary key,
  snapshot_id text not null references garden_snapshots(id) on delete cascade,
  project_id  text not null references projects(id) on delete cascade,
  tab_type    text not null check (tab_type in (
                'Core Insights','Generated Artifacts','Future Scenarios','Flow Analysis'
              )),
  title       text not null,
  summary     text not null,
  content     jsonb not null default '{"paragraphs":[],"key_points":[]}',
  created_at  timestamptz not null default now()
);

create index if not exists idx_harvest_snapshot on harvest_results(snapshot_id);
create index if not exists idx_harvest_project  on harvest_results(project_id);

-- ── Model Parameter Snapshots ──
-- Optional: add has_vision_input for analytics tracking
create table if not exists model_param_snapshots (
  id                text primary key default gen_random_uuid()::text,
  snapshot_id       text not null references garden_snapshots(id) on delete cascade,
  project_id        text not null references projects(id) on delete cascade,
  temperature       float not null,
  top_p             float not null,
  top_k             integer not null,
  presence_penalty  float not null,
  frequency_penalty float not null,
  -- Optional analytics column (additive, safe to add to existing schema):
  has_vision_input  boolean not null default false,
  created_at        timestamptz not null default now()
);

-- ── Interaction Events ──
create table if not exists interaction_events (
  id          text primary key default gen_random_uuid()::text,
  project_id  text not null references projects(id) on delete cascade,
  snapshot_id text references garden_snapshots(id) on delete set null,
  event_type  text not null,
  payload     jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index if not exists idx_events_project on interaction_events(project_id);

-- ── Row-Level Security ──
alter table projects              enable row level security;
alter table uploads               enable row level security;
alter table garden_snapshots      enable row level security;
alter table flowers               enable row level security;
alter table petals                enable row level security;
alter table connections           enable row level security;
alter table reasoning_logs        enable row level security;
alter table harvest_results       enable row level security;
alter table model_param_snapshots enable row level security;
alter table interaction_events    enable row level security;

-- ── RLS Policies ──
do $$ begin
  create policy "Allow all on projects"
    on projects for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow all on uploads"
    on uploads for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow all on garden_snapshots"
    on garden_snapshots for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow all on flowers"
    on flowers for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow all on petals"
    on petals for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow all on connections"
    on connections for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow all on reasoning_logs"
    on reasoning_logs for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow all on harvest_results"
    on harvest_results for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow all on model_param_snapshots"
    on model_param_snapshots for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

do $$ begin
  create policy "Allow all on interaction_events"
    on interaction_events for all using (true) with check (true);
exception when duplicate_object then null;
end $$;

-- ── Trigger: mark other snapshots as non-current ──
create or replace function set_current_snapshot()
returns trigger language plpgsql as $$
begin
  update garden_snapshots
     set is_current = false
   where project_id = new.project_id
     and id <> new.id;
  return new;
end;
$$;

drop trigger if exists trg_current_snapshot on garden_snapshots;
create trigger trg_current_snapshot
  after insert on garden_snapshots
  for each row execute function set_current_snapshot();

-- ── Trigger: auto-update projects.updated_at ──
create or replace function touch_project()
returns trigger language plpgsql as $$
begin
  update projects set updated_at = now() where id = new.project_id;
  return new;
end;
$$;

drop trigger if exists trg_touch_project_on_snapshot on garden_snapshots;
create trigger trg_touch_project_on_snapshot
  after insert on garden_snapshots
  for each row execute function touch_project();

-- ── If upgrading existing schema: safely add has_vision_input column ──
-- Run this separately if you already have the table:
-- alter table model_param_snapshots add column if not exists has_vision_input boolean not null default false;
```

### C. Install Dependencies

BLOOM is a frontend-only application — there is no separate backend to set up. Install the npm packages using your preferred package manager:

#### Using npm
```bash
npm install
```

#### Using pnpm (Recommended for speed)
```bash
pnpm install
```

#### Using yarn
```bash
yarn install
```

### D. Run the Application Locally

Start the Vite development server:

```bash
npm run dev
```

You should see an output like:

```text
  VITE v7.x.x  ready in 412 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open [http://localhost:5173](http://localhost:5173) in your browser. You'll land on the BLOOM landing page then click **Enter the Lab** to navigate to `/dashboard` and start planting sparks. 🌱

---

### E. Available Scripts


| Command | Description |
| :--- | :--- |
| `npm run dev` | Start the Vite development server with HMR |
| `npm run build` | Type-check and build production assets |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint over the codebase (if configured) |


---

## 🛠️ Tech Stack & Implementation Details


| Layer | Technology |
| :--- | :--- |
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 7 + vite-plugin-singlefile |
| **Styling** | Tailwind CSS 4 + tailwind-merge + clsx |
| **State** | Zustand |
| **Animation** | Framer Motion + native SVG/CSS animations |
| **Icons** | Lucide React |
| **AI Engine** | Google Gemma 4 (`@google/genai`) — multi-modal text + vision |
| **Backend** | Supabase (`@supabase/supabase-js`) — Postgres + Auth + Storage |
| **Deployment** | Vercel / any static host |



---

## 📄 License

Distributed under the **MIT License**. 

>  **MIT License** — feel free to fork, remix, cross-pollinate, and build something the world has never seen! 🚀

#### See the [LICENSE](./LICENSE) file for the full legal text.
---
## 💬 Acknowledgements

*   **🌸 Google AI Studio** Powered by the Gemma 4 26B MoE engine using Google AI Studio's Gemini API.
*   **🌸 Supabase** for effortless backend persistence
*   **🌸 The open-source community** — React, Vite, Tailwind, Zustand, Framer Motion, Lucide
*   **🌸 Every creator** who refuses to settle for templated thinking 🌸

---

🌐 Project Links
* 🌸 Launch the Lab: [Try Now](https://trybloomlabs.vercel.app/ "Go to BLOOM official site")
> NOTE:
> Please allow 1 to 4 minutes for the engine to analyze your problem matrices, sprout its reasoning and cultivate your breakthrough. Hang tight to see the magic bloom! Thank you for your patience!
* 🌸 Video Walkthrough: [Watch Now](https://youtu.be/2nzXjrcIF18?si=PWce5YJMGGDX_dct "Watch BLOOM Demo on Youtube")
* 🌸 Visit the [BLOOM Repository](https://github.com/pmrinal2005/bloom "Go to BLOOM GitHub").
> Exposing neural routing architectures for cross-domain discovery.

---
### **BLOOM** - _grow beyond limits_
#### 🌱 Plant a spark. Watch it bloom. 🌸
> **Built for visionaries who grow beyond limits.**
