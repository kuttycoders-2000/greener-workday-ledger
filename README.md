# Greener Workday Ledger

Build a complete, working full-stack web app called "EcoTrack": a B2B workplace carbon-footprint tracker. It turns employees' daily commute, business travel and office habits into measurable CO2 data, and gives companies Scope 3 emissions data (GHG Protocol categories 6 and 7, India's BRSR format). It must be mobile-first for employees and a desktop dashboard for company admins.

TECH
- React + TypeScript + Tailwind + shadcn/ui, Recharts for charts, Lovable Cloud / Supabase for auth, Postgres and row-level security.
- Responsive: employee views are designed for a 390px phone, admin views for desktop.

ROLES
1. Employee: sees only their own detailed data.
2. Company admin (sustainability / HR): sees only team-level and company aggregates, never individual trips. Hide any team with fewer than 5 people.

DATABASE (Supabase, with RLS so employees read only their own rows and admins read only aggregates through views/functions)
- companies(id, name, created_at)
- profiles(id, company_id, full_name, team_id, role, home_distance_km, usual_mode, office_days_per_week, tracking_consent, baseline_kg_per_week)
- teams(id, company_id, name)
- trips(id, user_id, date, mode, distance_km, co2_kg)
- office_habits(id, user_id, date, habit_type, co2_saved_kg)
- challenges(id, company_id, name, start_date, end_date, reward)
- rewards(id, company_id, name, description)
Seed realistic demo data: 1 company "Northwind Technologies", 6 teams, about 60 employees, 12 weeks of trips with a gentle downward trend, and 1 live challenge "Metro Month".

EMISSION ENGINE (a shared function; co2_kg = distance_km x factor)
Use these India-oriented placeholder factors in kg CO2e per passenger-km, stored in an editable table so they can be updated: walk 0, cycle 0, metro 0.04, bus 0.08, auto-rickshaw 0.10, two-wheeler 0.05, car 0.17, cab 0.19, flight 0.15. Show a note that factors are placeholders to be replaced with India GHG Program / CEA values.

EMPLOYEE APP (mobile)
1. Onboarding / baseline survey: usual commute mode, home-to-office distance (slider), office days per week, and an opt-in toggle for automatic trip detection with the text "Only you see your trip details. Your company sees team totals, never individuals." Mention India's DPDP Act 2023, with options to pause tracking and delete my data. Compute and save the personal baseline kg/week.
2. Home: greeting, this-week total in kg CO2e with a 7-day bar chart, a badge showing % below/above own baseline, low-carbon streak, kg saved this month, a "trip detected" card with "Looks right / Edit" buttons (simulate detection with a mock trip), and a personalised tip. The tip is rule-based: find the user's biggest source and suggest a realistic switch with the monthly kg saving (e.g. "metro 2 days a week saves about X kg a month").
3. Log a trip: 8 mode tiles (walk, cycle, metro, bus, auto, bike, car, cab), distance input with a "use home to office" shortcut, date chips (today / yesterday / pick), a live CO2 result and "X kg less than by car" comparison, optional office check-in chips (AC off when leaving, lights off, no printing, zero food waste), and a Save button.
4. Leaderboard: People / Teams toggle. Rank by % REDUCTION VS OWN BASELINE, not absolute emissions, so everyone can win. Highlight "You", show the active challenge banner. Show only name and % change to colleagues.
5. Bottom tab bar: Home, Log trip, Ranks.

COMPANY DASHBOARD (desktop, admin only)
- Left sidebar: Overview, Teams, Locations, Challenges and rewards, BRSR reports, plus a "Privacy by design" note.
- KPI cards: total employee emissions (t CO2e, labelled Scope 3 categories 6 and 7), change vs baseline, active employees (x of y with a progress bar), average kg per active employee.
- Weekly emissions trend chart (12 weeks), emissions-by-source breakdown (car, two-wheeler, cab/auto, flights, bus, metro/rail, office habits).
- Team improvement leaderboard table with rank, team, people, t CO2e and % change bar.
- Challenge card (participation bar, "Assign reward", "New challenge" that actually creates a challenge) and a by-location list.
- "Export CSV" and "Export BRSR report (PDF)" buttons that really download a file. The PDF should include company totals, category 6 and 7 split, methodology and the emission factors used.
- A footer note "Sample data for demo" while seeded data is in use.

AUTH AND ONBOARDING
- Email sign-up and login. Include a demo mode with two one-click logins: "Demo employee (Priya)" and "Demo admin". A company admin can invite employees by work email.

VISUAL DESIGN
- Clean, calm, trustworthy climate-tech look. Background #F3F5F1, ink #12261E, primary green #1F7A4D, light green #DCEFE3, deep forest #12261E for hero cards, amber #F2B84B for highlights, borders #DDE4DC, cards white with 16-18px radius.
- Fonts: Bricolage Grotesque for headings and big numbers, Figtree for body text.
- Touch targets at least 44px, strong text contrast, no emojis, simple line icons (lucide-react).

QUALITY
- Everything must work end to end: logging a trip updates the weekly chart, streak, leaderboard and company dashboard immediately.
- Use loading, empty and error states. Make it deployable and demo-ready.

Follow-up prompts (send one at a time, after the first build works)

Add a rule-based recommendation engine on the employee Home screen that finds each user's largest emission source and shows the switch with the highest realistic monthly saving.

Add a "Simulate auto-detected trip" button in settings that creates a pending trip the user can confirm or edit, to demonstrate automatic trip detection.

Add an admin page to create challenges and rewards (extra leave, vouchers, tree planting) and a rewards list employees can see.

Make the BRSR PDF report look professional with a cover page, methodology, emission factors table and charts.

Polish: add subtle animations, a dark mode toggle, and check every screen at 390px and 1440px widths.

Tips for a good result

Paste the master prompt in one go, then fix issues with the small follow-ups. Long single prompts are fine for the first build, but fixes work better as short, specific messages.

Connect Supabase when Lovable offers it. Without it the data won’t persist.

If Lovable skips a screen, reply with “You missed the [screen name]. Add it exactly as specified in my original prompt.”

If you want it to match the design I made, take screenshots of the canvas screens and attach them to the first message, with “Match this visual design closely.”

Before the demo, test the full loop: log in as the employee, log a trip, then switch to the admin and check that the numbers changed.

I can also write a 2-minute demo script or a pitch outline for judges once the app is built.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://greener-workday-ledger.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bf569624-ad72-5150-9473-b4c2ae642416).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
