import type { Habit } from "@/types";

export const coreHabits: Habit[] = [
  {
    id: "hydration",
    title: "Voda 2L",
    description: "Popij najmanje 8 čaša vode raspoređeno tokom dana.",
    category: "hydration",
  },
  {
    id: "sleep-hygiene",
    title: "San 7+ h",
    description: "Fiksiraj vreme spavanja i buđenja, minimum 7 sati sna.",
    category: "sleep",
  },
  {
    id: "walk",
    title: "Šetnja 6k koraka",
    description: "Planiraj 2 kraće šetnje po 15 minuta.",
    category: "mobility",
  },
  {
    id: "nsdr",
    title: "NSDR/Disanje",
    description:
      "Izaberi vođenu NSDR audio (.5, 10 ili 20 min) prema energiji.",
    category: "mindfulness",
  },
  {
    id: "protein",
    title: "Protein u svakom obroku",
    description: "Uključi kvalitetan izvor proteina u sva tri glavna obroka.",
    category: "nutrition",
  },
];

export const optionalHabits: Habit[] = [
  {
    id: "fiber",
    title: "Povrće 2x",
    description: "Dodaj povrće u minimum dva obroka danas.",
    category: "nutrition",
  },
  {
    id: "gratitude",
    title: "Kratka zahvalnost",
    description: "Upiši 3 stvari na kojima si zahvalna pre spavanja.",
    category: "mindfulness",
  },
  {
    id: "mobility-reset",
    title: "Mobilnost 10 min",
    description: "Krug mobilnosti za kukove i torakalnu kičmu (10 minuta).",
    category: "mobility",
  },
];
