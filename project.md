# Fitkofer — MVP PRD (for Serbian market)

Version: 1.0  
Owner: Marko (solo founder)  
Audience: engineers, designer, content ops  
Language in‑app: **Serbian (latinica)**  
Platforms: iOS + Android (one codebase), responsive web later

---

## 1) Product vision
Enable women in Serbia to achieve sustainable body recomposition and wellbeing through a single app that generates **personalized training**, **calorie‑rotation meal plans**, and **daily habits** based on onboarding inputs. Keep it simple, automated, and accountable.

**North‑star metric:** 4‑week plan adherence ≥60% for active users.

---

## 2) Target users
- Women 18–45, beginners to intermediate.  
- Two primary contexts: (A) home workouts (bez opreme, trake, bučice), (B) gym access.  
- Constraints: busy schedule, past diet failures, potential conditions: IR, Hashimoto, PCOS.

**Personas**  
1) *Zauzeta mama (31)* — 3x nedeljno, kućni treninzi, želi smanjenje masti.  
2) *Studentkinja (22)* — 4x nedeljno, teretana, želi oblikovanje tela.  
3) *IT zaposlena (28)* — stres, loš san; traži strukturu, NSDR i disanje.

---

## 3) Brand + UI baseline
Use provided assets as visual source. Style: warm terracotta + neutral bež/siva; solid black for text.

**Palette (proposal):**  
- Terracotta: `#AF4D49`  
- Sand: `#EADFCF`  
- Olive: `#7E8B6A`  
- Charcoal: `#232323`  
- Cream: `#FDF8F2`

**Typography:**  
- Headings: Playfair Display or DM Serif Display.  
- Body/UI: Inter or SF Pro.  

**Tone:** direktno, motivišuće, bez floskula.

---

## 4) MVP scope (buildable by solo founder)
**Included**
1. **Onboarding** questionnaire → profile + constraints.  
2. **Plan generator**  
   - Training plan (home/gym variants) with linear progression.  
   - Calorie rotation (low/mid/high) per week + makroi + primeri obroka.  
3. **Dashboard** with adherence % and energija.  
4. **Daily tracker**: planer zadataka, obroci, treninzi, navike; podsjetnici.  
5. **Content**: recepti, liste za kupovinu, kratki vodiči za san, stres, disanje i NSDR.  
6. **Auth + subscription** (mesecna i godišnja) + paywall.  
7. **Basic integrations**: Apple Health/Google Fit (koraci, energija potrošnja – read‑only).  

**Excluded (post‑MVP)**  
- Wearable deep integration, community feed, chat, AI coach chat, advanced period tracking.

---

## 5) System architecture (suggested stack)
- **Client:** React Native (Expo), TypeScript.  
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions) 
- **Payments:** RevenueCat (iOS/Android subscriptions) + Stripe for web.  
- **Push:** Expo Notifications.  
- **Analytics:** PostHog or Firebase Analytics.  
- **CMS:** Supabase tables (recipes, exercises, habits) with row‑level versioning.

---

## 6) Core user flows

### 6.1 Onboarding → plan generation
1. User installs → language fixed to sr‑lat.  
2. Create account (email + lozinka, Apple/Google later).  
3. **Questionnaire**: starost, visina, težina, cilj (gubitak/održavanje/dobitak), nivo aktivnosti, zdravstvena stanja (IR/Hashimoto/PCOS), oprema (kuća/teretana + dostupno), dani u nedelji (2–5), ishrana preferencije (meso/riba/vegetarijan/kombinovano), alergije, nevoljeni sastojci, spavanje, stres, ciklus info (opciono).  
4. App generiše: kalorije, makroi, raspored **Low/Mid/High** dana po nedeljama, trening split i progresiju, osnovne navike.  
5. Prikaz **Plan pregleda** i početak.

### 6.2 Dnevna upotreba
- Dashboard: današnji plan, napredak, energija, adherence bar.  
- Ticking: trening urađen, obroci zabeleženi, voda, san, šetnja, disanje.  
- Podsjetnici: push po rasporedu.  
- Nedeljni update: automatski prilagodi težine i kalorije po adherenci i merenjima.

---

## 7) Features + acceptance criteria

### 7.1 Onboarding
**Fields**  
- `age`, `height_cm`, `weight_kg`, `goal`, `activity_level`, `health_conditions[]`, `equipment_home[]` or `gym_access`, `days_per_week`, `diet_pref`, `allergies[]`, `disliked[]`, `sleep_hours`, `stress_level`.

**Rules**  
- Required: age, height, weight, goal, activity, equipment/gym, days_per_week.  
- Health conditions drive nutrition rules below.  
- Save profile and snapshot inputs.

**Acceptance**  
- Submitting valid form creates `user_profile` and enqueues `plan_generate` job within 1s.  
- Error messages in sr‑lat.

### 7.2 Training plan generator
**Inputs:** days_per_week (2–5), location (home/gym), available equipment, level (deduced from activity + strength questionnaire 3 pitanja).  
**Algorithm:**  
- Choose a split:
  - 2 dana: Full Body A/B.  
  - 3 dana: Upper/Lower/Full.  
  - 4 dana: Upper/Lower x2.  
  - 5 dana: Push/Pull/Legs/Upper/Lower.  
- Each workout: 6–8 vežbi, 2–4 serije, rep‑range po cilju.  
- Progression: **double‑progression**. Ako korisnik na sve serije ispuni gornju granicu ponavljanja u 2 uzastopne nedelje → +2.5–5% težine (ili +1–2 ponavljanja kod kuće). Deload auto na 4. nedelji ako RPE>9 prijavljen ili adherence<50%.

**Acceptance:**  
- Plan renderuje za 4 nedelje sa progresijom.  
- Svaka vežba ima video/GIF, opis, alternativu za kuću.  
- "Mark as done" po seriji ili po vežbi.

### 7.3 Nutrition plan generator (calorie rotation)
**Inputs:** goal, weight, height, age, sex=female, activity_level, health_conditions.  
**Calorie calc:** Mifflin‑St Jeor → TDEE → deficit/maintenance/surplus.  
- Deficit: −15% do −25% po profilu.  
- Surplus: +10%.  
**Rotation weekly template (default 3‑day training):** `H M L M H L M` (adjust by training days).  
- `High` = TDEE or Deficit+0 to −5%.  
- `Mid` = High − 15%.  
- `Low` = High − 30%.  
**Macros:** protein 1.6–2.0 g/kg, fat 0.8 g/kg min, ostatak carbs.  
**Conditions rules:**  
- **IR/PCOS:** carbs 35–45% na High dan, niže na Low; fokus vlakna i proteini; vremenska distribucija carbs oko treninga.  
- **Hashimoto:** doda se preporuka za selen, jod oprez, vlakna; bez tvrde restrikcije.  
**Meal plan:** 3–4 obroka + 1 užina; swap sistem po preferenciji.  
**Grocery list:** generiši iz izabranih recepata za 7 dana.

**Acceptance:**  
- Generisano 7‑dnevno nedeljno meni + rotacija za 4 nedelje.  
- Svaki obrok ima kalorije + makroe.  
- Zamena radi unutar iste kalorijske kategorije.  
- Lista kupovine grupisana po kategorijama.

### 7.4 Habits & wellbeing
**Defaults:** voda 2L, 7–8h sna, 7k–10k koraka, 5‑min NSDR ili vođeno disanje, 10‑min šetnja posle obroka.  
**Tracking:** toggle + kratki edukativni kartice.

**Acceptance:**  
- Dnevni habit check + push podsjetnik.  
- NSDR audio 5/10/20 min lokalni fajlovi.

### 7.5 Dashboard
Widgets:  
- **Danas:** trening, obroci, navike.  
- **Adherence %**: poslednjih 7/28 dana.  
- **Energija**: skala 1–5 dnevno.  
- **Telesne mere**: težina, struk, kuk.

**Acceptance:**  
- Sve metrike se računaju klijentski sa serverskim zapisom.  
- Nedeljni email/push sa sumarnim pregledom.

### 7.6 Daily tracker & planner
- Dnevni kalendar sa time‑slots (po 30/60 min) za trening, pripremu obroka, san.  
- Custom taskovi sa podsjetnikom.  
- Premeštanje drag‑and‑drop (client‑side).

**Acceptance:**  
- Kreiranje, edit, done, snooze; lokalna notifikacija + push.

### 7.7 Subscriptions & paywall
- Free: onboarding + sample day + 3 recepta + 1 trening.  
- Pro: svi planovi, liste, tracker, audio; 7‑day trial.  
- Cene definisaće se u RSD u store‑ovima.

**Acceptance:**  
- RevenueCat entitlements gate all Pro features.  
- Grace period i restore purchase rade.

---

## 8) Data model (Postgres sketch)
```
users(id, email, created_at)
profiles(user_id FK, age, height_cm, weight_kg, goal, activity_level, diet_pref, sleep_hours, stress_level, created_at)
health_conditions(user_id, condition ENUM['IR','Hashimoto','PCOS','None'])
plans(id, user_id, start_date, type ENUM['training','nutrition','habits'], version, data JSONB)
workouts(plan_id, day_index, name, location ENUM['home','gym'])
exercises(id, slug, name, equipment_tags[], video_url)
workout_sets(workout_id, exercise_id, order, sets, reps_min, reps_max, rpe_target, weight_kg)
meal_days(plan_id, day_index, calorie_band ENUM['Low','Mid','High'], calories, protein_g, fat_g, carbs_g)
meals(meal_day_id, order, name, calories, protein_g, fat_g, carbs_g, recipe_id)
recipes(id, name, tags[], ingredients JSONB, steps JSONB, calories, macros JSONB)
grocery_items(meal_day_id, category, name, qty, unit)
habits(plan_id, key, title, target, unit)
checkins(user_id, date, weight_kg, waist_cm, hips_cm, energy_1_5, steps)
completions(user_id, date, type ENUM['workout','meal','habit'], ref_id, status)
reminders(id, user_id, title, datetime, repeat_rule)
notifications(id, user_id, type, payload JSONB, delivered_at)
subscriptions(user_id, status, product_id, trial_end)
```

---

## 9) Personalization logic (pseudo)
```
BMR = 10*kg + 6.25*cm - 5*age - 161
TDEE = BMR * activity_factor
High = goal=='loss' ? TDEE*(1 - deficit_pct_high) : TDEE*(1 + surplus_pct)
Mid  = High * 0.85
Low  = High * 0.70
Protein = clamp(1.6*kg, 90, 160)
Fat_min = max(0.8*kg, 40)
Carbs = (Calories - Protein*4 - Fat_min*9)/4
Rotation = mapTrainingDaysToBands(daysPerWeek)
```
**IR/PCOS modifiers:** prefer carbs around workout; add fiber goal 25–35g; avoid added sugar in recipes.  
**Hashimoto:** show note on selen rica hrana, tempo gubitka ≤0.7% tež/wk.

---

## 10) Gamification
- Streaks (dani sa ≥1 trening + 2 navike).  
- Badges: "Prva nedelja završena", "10 treninga", "100% adherence nedelja".  
- Weekly challenge: 35k koraka + 3 treninga.

---

## 11) Analytics events (PostHog/Firebase)
- `onboarding_completed`  
- `plan_generated` {days, location}  
- `workout_completed` {workout_id, duration_min}  
- `meal_swapped` {from,to}  
- `habit_checked` {key}  
- `reminder_fired` {type}  
- `subscription_start/renew/cancel`

---

## 12) Security & privacy
- GDPR‑like: privacy policy in‑app; export/delete account.  
- PII in Auth, health data in Postgres with RLS; at‑rest encryption via provider.  
- No medical advice; disclaimers mandatory.

---

## 13) Copy — Serbian (UI strings)
- CTA: **"Započni promenu"**  
- Onboarding steps: **"O tebi"**, **"Ciljevi"**, **"Ishrana"**, **"Oprema"**, **"Raspored"**.  
- Dashboard: **"Današnji plan"**, **"Uspešnost"**, **"Energija"**, **"Mere"**.  
- Habits: **"Voda"**, **"San"**, **"Šetnja"**, **"NSDR/Disanje"**.  
- Buttons: **"Označi kao završeno"**, **"Zameni obrok"**, **"Sačuvaj"**, **"Podeli listu za kupovinu"**.  
- Paywall: **"Otključaj Fitkofer Pro"** — **"7 dana probno"**.

---

## 14) Screens (MVP)
1. **Auth** (Login/Signup/Reset).  
2. **Onboarding wizard** (5–7 ekrana).  
3. **Plan preview** (nutricija + trening + navike).  
4. **Home/Dashboard**.  
5. **Workout detail** (timer, serije, alternative).  
6. **Meals day** (zamene, recept, lista kupovine).  
7. **Habits**.  
8. **Planner**.  
9. **Profile & Settings** (merenja, integracije, notifikacije, subscription).

---

## 15) Edge cases
- Bez opreme → auto zamene za trake/težina tela.  
- Alergije → filter recepata.  
- Vegetarijan → proteinske zamene.  
- Povreda/kreatin/period post → korisnik može pauzirati trening; kalorije se automatski spuste 10%.  
- Offline: cache poslednjih 7 dana planova i recepata.

---

## 16) QA checklist (acceptance tests)
- [ ] Onboarding validacije i lokalizacija.  
- [ ] Generacija plana <1s sa default sadržajem.  
- [ ] Trening: markiranje serija i progresija kroz nedelje.  
- [ ] Meal swap zadržava kalorijsku kategoriju.  
- [ ] Lista kupovine tačna po meri.  
- [ ] Reminder radi foreground/background.  
- [ ] Subscription gating Pro.  
- [ ] Export podataka i brisanje naloga.

---

## 17) Content requirements
- **Exercises:** 120 vežbi sa tagovima (home/gym, trake/bučice/mašine).  
- **Recipes:** 60 recepata sa makroima i tagovima (IR‑friendly, brzo, budžet).  
- **Habits/Guides:** kratki tekst + audio NSDR (5/10/20).  
- **Images:** koristite postojeći brend paket.

---

## 18) Roadmap
- **MVP (0 → 1):** core flows gore + 30 recepata + 60 vežbi.  
- **v1.1:** period mode, ciklus‑aware napomene; deload auto.  
- **v1.2:** coach portal za ručnu korekciju planova.  
- **v1.3:** challenges i shareable progres kartice.

---

## 19) Legal
- "Fitkofer nije zamena za medicinski savet. Posavetujte se sa lekarom, posebno kod IR/Hashimoto/PCOS."  
- Uslovi korišćenja i Politika privatnosti linkovani iz Settings.

---

## 20) Developer notes
- Keep **pure functions** for calculations; unit‑test kalorije/makroi i progresije.  
- Seed JSON za vežbe i recepte.  
- Use feature flags (PostHog) za paywall varijante.  
- App state: Zustand/Redux minimal; SQLite for offline cache (expo‑sqlite).  
- Images & audio u CDN (Supabase Storage).  
- Accessibility: dynamic type + sufficient contrast per palette.

---

## 21) Example API contracts
```
POST /plan/generate
{ user_id, profile_snapshot_id }
→ { training_plan_id, nutrition_plan_id, habits_plan_id }

GET /day/:date
→ { workouts:[...], meals:[...], habits:[...], reminders:[...] }

POST /complete
{ type:'workout'|'meal'|'habit', ref_id, date, value }
```

---

## 22) Sample content blocks (sr‑lat)
**NSDR 5 min:** "Zauzmi udoban položaj, zatvori oči, udah broji do 4, izdah do 6…"  
**Habit kartica — San:** "Uključi *no‑screens* 60 min pre spavanja."

---

## 23) Success metrics
- D7 activation ≥40% (≥1 trening + 3 navike + 1 dan ishrane zabeležen).  
- Mesečni retention ≥25%.  
- Avg adherence 4 nedelje ≥60%.

---

**End of MVP PRD v1**

