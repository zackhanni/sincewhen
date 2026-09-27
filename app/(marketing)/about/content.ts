import {
  BriefcaseIcon,
  CarIcon,
  DumbbellIcon,
  FolderTreeIcon,
  HeartPulseIcon,
  HouseIcon,
  LeafIcon,
  ListTreeIcon,
  MoonIcon,
  PawPrintIcon,
  RotateCcwIcon,
  ScaleIcon,
  Share2Icon,
  ShieldCheckIcon,
  SmartphoneIcon,
  SprayCanIcon,
  WifiOffIcon,
  ZoomInIcon,
  type LucideIcon,
} from "lucide-react";

// Every word on the landing page, in the order it appears. page.tsx only lays it out, so the
// copy can be edited here and the design reworked there without touching each other.
//
// Every claim must stay true of the app as shipped: no invented numbers, no testimonials until
// real users have given them (with permission), and anything not built yet says "not yet".

/** Where "Open Sincewhen" goes: the launcher, which opens the start screen chosen in Settings. */
export const APP_HREF = "/";

export const hero = {
  eyebrow: "Free · No account · Works offline",
  title: "Since when did you last change the air filter?",
  subtitle:
    "Sincewhen keeps track of the things you do every so often, and shows what is due based on when you actually last did them. Not on a date you picked months ago.",
  primaryCta: "Open Sincewhen",
  secondaryCta: "See how it works",
  note: "Runs in your browser. Add it to your home screen and it works like any other app.",
};

export const problems = {
  title: "Sound familiar?",
  items: [
    {
      title: "You can't remember when you last did it",
      body: "Was the smoke detector test last month, or last spring? Jobs that come around every few weeks or months are the easiest to lose track of.",
    },
    {
      title: "Calendar reminders don't fit",
      body: "A reminder on a fixed date nags you even when you did the job early, and quietly moves on when you do it late.",
    },
    {
      title: "Everything looks equally urgent",
      body: "A to-do list can't tell a daily job that is two days late from a yearly one that is a week late.",
    },
  ],
};

export const steps = {
  id: "how-it-works",
  title: "How it works",
  items: [
    {
      title: "Add what you do, and how often",
      body: "Change the air filter, every 3 months. Wash the sheets, every 2 weeks. Put them in folders that fit your life: Home, Car, Cleaning, Exercise.",
    },
    {
      title: "Check it off when it's done",
      body: "One tap. The clock restarts from that day, so doing something late never leaves you behind.",
    },
    {
      title: "Let the colors guide you",
      body: "Tasks go from green to yellow to red as they come due. Folders turn red as overdue work piles up inside them, so you can see where to start.",
    },
  ],
};

/** Screenshots in public/landing, made by scripts/landing-screenshots.mjs in light and dark. */
export const screens = {
  title: "See where the work is",
  items: [
    {
      image: "folders",
      alt: "The Folders screen: Home in red with 2 overdue, Car in green, Personal in yellow",
      title: "Every place at a glance",
      body: "Each location or category takes its color from what is overdue inside it.",
    },
    {
      image: "room",
      alt: "The Home screen: overdue tasks at the top, then the Kitchen, Bedroom and Bathroom folders",
      title: "The most urgent first",
      body: "Inside a folder, tasks are sorted by what needs you most, with rooms and sub-tasks for bigger jobs.",
    },
    {
      image: "due",
      alt: "The Due screen: a list of overdue and upcoming tasks from every folder",
      title: "Or just what's due",
      body: "One list of everything overdue or coming up, from every folder, filtered by place if you like.",
    },
  ],
};

export type Feature = { icon: LucideIcon; title: string; body: string };

export const features: { id: string; title: string; items: Feature[] } = {
  id: "features",
  title: "Everything it does",
  items: [
    {
      icon: FolderTreeIcon,
      title: "Organized like folders",
      body: "Locations, categories, rooms and sub-tasks, up to five levels deep.",
    },
    {
      icon: ScaleIcon,
      title: "Fair about urgency",
      body: "Tasks are ranked by how late they are for their own schedule, so a neglected daily job rises above a slightly late yearly one.",
    },
    {
      icon: ListTreeIcon,
      title: "Big jobs, small steps",
      body: "Break “clean the bathroom” into steps. Check them off one by one, or the whole job at once.",
    },
    {
      icon: RotateCcwIcon,
      title: "Undo a mis-tap",
      body: "Every check-off can be undone right away.",
    },
    {
      icon: WifiOffIcon,
      title: "Works offline",
      body: "Once opened, it works with no signal: in the garage, the basement or the parking lot.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Private by design",
      body: "No account, no ads, no tracking. Your tasks are saved on your device, not on a server.",
    },
    {
      icon: Share2Icon,
      title: "Backups you control",
      body: "Save a backup file, or text or email it to yourself from the share sheet, and restore it on a new phone.",
    },
    {
      icon: MoonIcon,
      title: "Dark mode",
      body: "Light, dark, or match your phone, so it goes dark at night when your phone does.",
    },
    {
      icon: ZoomInIcon,
      title: "Larger text",
      body: "A Large setting makes text, buttons and everything you tap bigger.",
    },
    {
      icon: SmartphoneIcon,
      title: "Phone first, not phone only",
      body: "Made for phones, with layouts for tablets, folding phones and computers.",
    },
  ],
};

export const useCases: { title: string; subtitle: string; items: Feature[] } = {
  title: "Made for the jobs that come around again",
  subtitle: "Start with a set of common chores, or build your own from scratch.",
  items: [
    { icon: HouseIcon, title: "Home", body: "Replace the HVAC filter · Test the smoke detectors · Clear the gutters" },
    { icon: SprayCanIcon, title: "Cleaning", body: "Clean the fridge · Wash the sheets · Descale the coffee maker" },
    { icon: CarIcon, title: "Car", body: "Oil change · Check the tire pressure · Rotate the tires" },
    { icon: LeafIcon, title: "Garden and plants", body: "Water the ferns · Feed the lawn · Repot the houseplants" },
    { icon: PawPrintIcon, title: "Pets", body: "Flea treatment · Wash the dog bed · Vet checkup" },
    { icon: HeartPulseIcon, title: "Health", body: "Dentist checkup · Replace the toothbrush · Refill prescriptions" },
    { icon: DumbbellIcon, title: "Exercise", body: "Long run · Stretching · Replace the running shoes" },
    { icon: BriefcaseIcon, title: "Work", body: "Back up the laptop · Review subscriptions · Clear the inbox" },
  ],
};

export const privacy = {
  title: "Your tasks stay yours",
  body: "Sincewhen has no accounts and no server holding your data. Everything you add is saved on your device, and nothing leaves it unless you save or share a backup file yourself.",
  points: ["No sign-up, no email address", "No ads, no analytics, no tracking", "Works without an internet connection"],
};

export const install = {
  id: "get-it",
  title: "No app store needed",
  body: "Open Sincewhen in your browser, then add it to your home screen. It opens from its own icon, full screen, like any other app.",
  qrCaption: "On a computer? Scan this with your phone.",
};

export const faqs = {
  id: "faq",
  title: "Questions",
  items: [
    {
      question: "Is it really free?",
      answer: "Yes. There is no subscription, no ads and nothing to buy.",
    },
    {
      question: "Do I need an account?",
      answer: "No. Open it and start adding tasks.",
    },
    {
      question: "Where is my data stored?",
      answer:
        "On your device, in the app's own storage. It is never sent to a server. That also means a backup file is your only other copy, so save one now and then from Settings. The app reminds you.",
    },
    {
      question: "Does it work offline?",
      answer: "Yes. After you have opened it once, it opens and works without an internet connection.",
    },
    {
      question: "What happens when I get a new phone?",
      answer:
        "Save a backup file, or share it to yourself, then open it in Sincewhen on the new phone. Your tasks, folders and history come with it.",
    },
    {
      question: "Can I use it on my phone and my computer?",
      answer:
        "Yes, but each device keeps its own list: there is no syncing between them yet. A backup file moves everything across.",
    },
    {
      question: "Does it send reminders?",
      answer:
        "Not yet. Open it to see what is due, and the colors do the rest. Notifications are on the list for a later version.",
    },
    {
      question: "Can I share chores with my household?",
      answer: "Not yet. Sharing a home's tasks with a partner or housemates is on the list for a later version.",
    },
    {
      question: "Which phones does it work on?",
      answer:
        "iPhone, iPad and Android, in any up-to-date browser, and on computers too. To add it to an iPhone or iPad home screen, use Safari.",
    },
  ],
};

export const finalCta = {
  title: "Start with a few examples, or your own",
  body: "The first time you open Sincewhen, it can fill in a set of common chores for you to keep, change or delete.",
  cta: "Open Sincewhen",
};

export const footer = {
  madeBy: "Made by Web Wizard Dev",
  madeByHref: "https://webwizarddev.com",
};
