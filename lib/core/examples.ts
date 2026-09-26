import { subDays } from "date-fns";
import { generateNKeysBetween } from "fractional-indexing";
import { SCHEMA_VERSION } from "./constants";
import { toCalendarDate, toLocalDate, type CalendarDate } from "./dates";
import type { AppData, Frequency, TaskNode } from "./types";

// The "Start with examples" setup for someone new: common chores most people really have, so
// the examples are worth keeping and editing rather than deleting.
//
// "Last done" is given as days before the day the examples are added, not as fixed dates, so on
// any day there is always a task just done, some fine (green), some due soon (yellow), some
// overdue (red) and one long overdue (red with "!"). The margins are wide enough that month
// lengths never tip a task into another colour; examples.test.ts checks every day of two years.
// Once added they are ordinary items and age like any other task.

type Example = {
  name: string;
  /** A task repeats; a folder has no `every`. */
  every?: Frequency;
  /** How many days ago the task was last done. 0 = today. */
  daysAgo?: number;
  children?: Example[];
};

const EXAMPLES: Example[] = [
  {
    name: "Home",
    children: [
      { name: "Replace the HVAC filter", every: { count: 3, unit: "month" }, daysAgo: 20 },
      // 35 days is 4-7 days past a month of any length: overdue, but not long overdue.
      { name: "Test the smoke detectors", every: { count: 1, unit: "month" }, daysAgo: 35 },
      {
        name: "Kitchen",
        children: [
          // Past 3 months by far more than half of the interval: long overdue.
          { name: "Clean the fridge", every: { count: 3, unit: "month" }, daysAgo: 150 },
          { name: "Replace the sponge", every: { count: 2, unit: "week" }, daysAgo: 3 },
        ],
      },
      {
        name: "Bathroom",
        children: [
          {
            name: "Clean the bathroom",
            every: { count: 1, unit: "week" },
            daysAgo: 0,
            // Shows that a task can be broken into steps.
            children: [
              { name: "Scrub the toilet", every: { count: 1, unit: "week" }, daysAgo: 0 },
              { name: "Clean the shower", every: { count: 1, unit: "week" }, daysAgo: 0 },
            ],
          },
          { name: "Replace the toothbrush", every: { count: 3, unit: "month" }, daysAgo: 30 },
        ],
      },
      {
        name: "Bedroom",
        // 12 of 14 days: due in 2 days, so yellow.
        children: [{ name: "Wash the sheets", every: { count: 2, unit: "week" }, daysAgo: 12 }],
      },
    ],
  },
  {
    name: "Car",
    children: [
      { name: "Oil change", every: { count: 6, unit: "month" }, daysAgo: 60 },
      { name: "Check the tire pressure", every: { count: 1, unit: "month" }, daysAgo: 10 },
    ],
  },
  {
    // A category rather than a place, to show that top-level items do not have to be locations.
    name: "Personal",
    children: [
      // 40 of 42 days: due soon.
      { name: "Haircut", every: { count: 6, unit: "week" }, daysAgo: 40 },
      { name: "Dentist checkup", every: { count: 6, unit: "month" }, daysAgo: 90 },
    ],
  },
];

/**
 * The example setup as fresh app data, dated relative to `today`. `newId` supplies ids (the
 * store passes crypto.randomUUID), so core stays free of randomness.
 */
export function buildExampleData(today: CalendarDate, newId: () => string): AppData {
  const nodes: TaskNode[] = [];

  const addLevel = (examples: Example[], parentId: string | null) => {
    const sortKeys = generateNKeysBetween(null, null, examples.length);
    examples.forEach((example, position) => {
      const id = newId();
      nodes.push({
        id,
        parentId,
        name: example.name,
        frequency: example.every ?? null,
        lastCompleted:
          example.every && example.daysAgo !== undefined
            ? toCalendarDate(subDays(toLocalDate(today), example.daysAgo))
            : null,
        createdAt: today,
        sortOrder: sortKeys[position],
      });
      if (example.children) addLevel(example.children, id);
    });
  };

  addLevel(EXAMPLES, null);
  return { schemaVersion: SCHEMA_VERSION, nodes, completions: [] };
}
