import { describe, expect, it } from "vitest";
import { getChildViews, listAttentionItems, summarizeNode } from "./summary";
import { TODAY, dueTask, folder, makeNode, okTask, severeTask, soonTask, WEEKLY } from "./test-helpers";
import { buildTreeIndex } from "./tree";
import type { TaskNode } from "./types";

const summarize = (nodes: TaskNode[], id = "room") => summarizeNode(buildTreeIndex(nodes), id, TODAY);
const dueTasks = (count: number) => Array.from({ length: count }, (_, i) => dueTask(`due${i}`, "room"));

describe("summarizeNode — room color", () => {
  it("is green when empty or when everything is fine", () => {
    expect(summarize([folder("room", null)]).level).toBe("green");
    expect(summarize([folder("room", null), okTask("a", "room")]).level).toBe("green");
  });

  it("is yellow when something is due soon but nothing is overdue", () => {
    expect(summarize([folder("room", null), soonTask("a", "room")])).toMatchObject({
      level: "yellow",
      overdueCount: 0,
    });
  });

  it("steps through orange, red and dark red by COUNT of overdue tasks", () => {
    expect(summarize([folder("room", null), ...dueTasks(1)]).level).toBe("orange");
    expect(summarize([folder("room", null), ...dueTasks(2)]).level).toBe("orange");
    expect(summarize([folder("room", null), ...dueTasks(3)]).level).toBe("red");
    expect(summarize([folder("room", null), ...dueTasks(5)]).level).toBe("red");
    expect(summarize([folder("room", null), ...dueTasks(6)]).level).toBe("darkRed");
  });

  it("does not punish a small room: 1 of 1 overdue is milder than 3 of 10", () => {
    const small = summarize([folder("room", null), ...dueTasks(1)]);
    const big = summarize([
      folder("room", null),
      ...dueTasks(3),
      ...Array.from({ length: 7 }, (_, i) => okTask(`ok${i}`, "room")),
    ]);
    expect(small.level).toBe("orange");
    expect(big.level).toBe("red");
  });

  it("counts a severe task double, and forces at least red", () => {
    expect(summarize([folder("room", null), severeTask("a", "room")])).toMatchObject({
      level: "red",
      score: 2,
      overdueCount: 1,
      hasSevere: true,
    });
  });

  it("includes tasks in sub-rooms at any depth", () => {
    const nodes = [
      folder("room", null),
      folder("closet", "room"),
      folder("shelf", "closet"),
      dueTask("a", "shelf"),
    ];
    expect(summarize(nodes).overdueCount).toBe(1);
  });

  it("counts an overdue task once, ignoring its overdue sub-tasks", () => {
    const nodes = [
      folder("room", null),
      dueTask("clean", "room"),
      dueTask("scrub", "clean"),
      dueTask("mirror", "clean"),
      severeTask("soap", "clean"),
    ];
    expect(summarize(nodes)).toMatchObject({ overdueCount: 1, score: 1, hasSevere: false });
  });

  it("still finds an overdue sub-task under a parent that is not overdue", () => {
    const nodes = [folder("room", null), okTask("clean", "room"), dueTask("regrout", "clean")];
    expect(summarize(nodes).overdueCount).toBe(1);
  });
});

describe("getChildViews — display order", () => {
  it("puts tasks above folders, most urgent task first, worst folder first", () => {
    const nodes = [
      folder("room", null),
      folder("calm", "room"),
      okTask("fine", "room"),
      folder("messy", "room"),
      dueTask("late", "messy"),
      severeTask("veryLate", "room"),
      soonTask("soon", "room"),
    ];
    const order = getChildViews(buildTreeIndex(nodes), "room", TODAY).map((v) => v.node.id);
    expect(order).toEqual(["veryLate", "soon", "fine", "messy", "calm"]);
  });

  it("keeps sub-tasks inside a task in manual order, because they are steps", () => {
    const nodes = [
      makeNode("clean", null, { frequency: WEEKLY, lastCompleted: TODAY }),
      okTask("step1", "clean"),
      severeTask("step2", "clean"),
    ];
    const order = getChildViews(buildTreeIndex(nodes), "clean", TODAY).map((v) => v.node.id);
    expect(order).toEqual(["step1", "step2"]);
  });

  it("keeps a folder step in its manual place inside a task, not pushed below the tasks", () => {
    const nodes = [
      makeNode("clean", null, { frequency: WEEKLY, lastCompleted: TODAY }),
      folder("prep", "clean"),
      severeTask("scrub", "clean"),
    ];
    const order = getChildViews(buildTreeIndex(nodes), "clean", TODAY).map((v) => v.node.id);
    expect(order).toEqual(["prep", "scrub"]);
  });

  it("keeps locations in manual order, whatever their state", () => {
    const nodes = [folder("home", null), folder("work", null), severeTask("x", "work")];
    const order = getChildViews(buildTreeIndex(nodes), null, TODAY).map((v) => v.node.id);
    expect(order).toEqual(["home", "work"]);
  });
});

describe("listAttentionItems — the Due tab", () => {
  const nodes = [
    folder("home", null),
    folder("kitchen", "home"),
    dueTask("late", "kitchen"),
    okTask("fine", "kitchen"),
    folder("work", null),
    severeTask("veryLate", "work"),
    soonTask("soon", "home"),
  ];
  const index = buildTreeIndex(nodes);

  it("lists everything wanting attention across all locations, most urgent first", () => {
    const ids = listAttentionItems(index, null, TODAY).map((item) => item.node.id);
    expect(ids).toEqual(["veryLate", "late", "soon"]);
  });

  it("can be limited to one location", () => {
    const ids = listAttentionItems(index, "home", TODAY).map((item) => item.node.id);
    expect(ids).toEqual(["late", "soon"]);
  });

  it("includes the path from the location down to the task", () => {
    const late = listAttentionItems(index, "home", TODAY)[0];
    expect(late.path.map((node) => node.id)).toEqual(["home", "kitchen", "late"]);
  });

  it("agrees with the room badge", () => {
    const overdueRows = listAttentionItems(index, "home", TODAY).filter(
      (item) => item.timing.status !== "soon",
    );
    expect(overdueRows).toHaveLength(summarizeNode(index, "home", TODAY).overdueCount);
  });
});
