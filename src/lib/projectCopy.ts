import type { InventoryStatus, ProjectCategory } from "@/lib/types";

// Land / Plot project pages are written in Bangla, Flat / Apartment
// pages in English. Section copy that belongs to one layout lives in
// that layout (LandProjectView / ApartmentProjectView); this file only
// holds the strings of components both layouts share.
export type ProjectLocale = "en" | "bn";

export function localeForCategory(category: ProjectCategory): ProjectLocale {
  return category === "land_plot" ? "bn" : "en";
}

export const BRAND_LINE = "Building a Better Tomorrow.";

export const INTEREST_OPTIONS = [
  { value: "plot", label: "Plot" },
  { value: "flat", label: "Flat" },
  { value: "info", label: "Project Information" },
  { value: "site_visit", label: "Site Visit" },
] as const;

export type Interest = (typeof INTEREST_OPTIONS)[number]["value"];

interface SharedCopy {
  inventory: {
    plotNo: string;
    unitNo: string;
    floor: string;
    block: string;
    size: string;
    bedBath: string;
    parking: string;
    roadWidth: string;
    facing: string;
    price: string;
    status: string;
    statuses: Record<InventoryStatus, string>;
  };
  payment: { bookingAmount: string; downPayment: string };
  video: {
    nowShowing: string;
    video: string;
    watchOnYouTube: string;
    moreVideos: string;
    nowSelected: string;
    clickToWatch: string;
    play: string;
  };
  gallery: { all: string };
  form: {
    fullName: string;
    mobile: string;
    email: string;
    interestedIn: string;
    message: string;
    messagePlaceholder: (projectName: string) => string;
    request: string;
    bookVisit: string;
    sending: string;
    required: string;
    invalidEmail: string;
    successTitle: string;
    successBody: string;
    genericError: string;
  };
  disclaimer: string;
}

export const SHARED_COPY: Record<ProjectLocale, SharedCopy> = {
  en: {
    inventory: {
      plotNo: "Plot No.",
      unitNo: "Unit No.",
      floor: "Floor",
      block: "Block",
      size: "Size",
      bedBath: "Bed / Bath",
      parking: "Parking",
      roadWidth: "Road Width",
      facing: "Facing",
      price: "Price",
      status: "Status",
      statuses: { available: "Available", reserved: "Reserved", sold: "Sold" },
    },
    payment: { bookingAmount: "Booking Amount", downPayment: "Down Payment" },
    video: {
      nowShowing: "Now showing",
      video: "Video",
      watchOnYouTube: "Watch on YouTube ↗",
      moreVideos: "More videos",
      nowSelected: "Now selected",
      clickToWatch: "Click to watch",
      play: "Play video",
    },
    gallery: { all: "All" },
    form: {
      fullName: "Full Name",
      mobile: "Mobile Number",
      email: "Email Address",
      interestedIn: "Interested In",
      message: "Message",
      messagePlaceholder: (name) => `I'd like more information about ${name}.`,
      request: "Request Information",
      bookVisit: "Book a Site Visit",
      sending: "Sending…",
      required: "This field is required.",
      invalidEmail: "Enter a valid email address.",
      successTitle: "Thank you — we've received your request.",
      successBody: "Our representative will contact you shortly.",
      genericError: "Something went wrong. Please try again.",
    },
    disclaimer:
      "All designs, layouts, images, facilities and descriptions on this site are conceptual and for information only. Al Bustan Communities Limited reserves the right to change, extend or amend any element, design or master plan according to company decisions and government or relevant authority directions. Prices, handover timing and other legal and commercial terms will be finalised by the company and are not final until confirmed in writing.",
  },
  bn: {
    inventory: {
      plotNo: "প্লট নং",
      unitNo: "ইউনিট নং",
      floor: "তলা",
      block: "ব্লক",
      size: "আয়তন",
      bedBath: "বেড / বাথ",
      parking: "পার্কিং",
      roadWidth: "রাস্তার প্রস্থ",
      facing: "মুখ",
      price: "মূল্য",
      status: "অবস্থা",
      statuses: { available: "খালি আছে", reserved: "সংরক্ষিত", sold: "বিক্রিত" },
    },
    payment: { bookingAmount: "বুকিং মানি", downPayment: "ডাউন পেমেন্ট" },
    video: {
      nowShowing: "এখন দেখছেন",
      video: "ভিডিও",
      watchOnYouTube: "YouTube-এ দেখুন ↗",
      moreVideos: "আরও ভিডিও",
      nowSelected: "নির্বাচিত",
      clickToWatch: "দেখতে ক্লিক করুন",
      play: "ভিডিও দেখুন",
    },
    gallery: { all: "সব" },
    form: {
      fullName: "Full Name",
      mobile: "Mobile Number",
      email: "Email Address",
      interestedIn: "Interested In",
      message: "Message",
      messagePlaceholder: (name) => `${name} সম্পর্কে বিস্তারিত জানতে চাই।`,
      request: "Request Information",
      bookVisit: "Book a Site Visit",
      sending: "পাঠানো হচ্ছে…",
      required: "এই তথ্যটি প্রয়োজন।",
      invalidEmail: "সঠিক ইমেইল ঠিকানা দিন।",
      successTitle: "ধন্যবাদ! আপনার তথ্য আমরা পেয়েছি।",
      successBody: "আমাদের প্রতিনিধি শীঘ্রই আপনার সঙ্গে যোগাযোগ করবেন।",
      genericError: "কিছু একটা সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    },
    disclaimer:
      "এই ওয়েবসাইটে প্রদর্শিত সকল ডিজাইন, লেআউট, ছবি, সুযোগ-সুবিধা ও বর্ণনা ধারণাগত এবং শুধুমাত্র তথ্যের জন্য। কোম্পানির সিদ্ধান্ত এবং সরকার বা সংশ্লিষ্ট কর্তৃপক্ষের নির্দেশনা অনুযায়ী Al Bustan Communities Limited যেকোনো উপাদান, ডিজাইন বা মাস্টার প্ল্যান পরিবর্তন, সম্প্রসারণ বা সংশোধনের অধিকার সংরক্ষণ করে। প্লটের মূল্য, হস্তান্তরের সময় এবং অন্যান্য আইনি ও বাণিজ্যিক শর্তাবলি কোম্পানি কর্তৃক লিখিতভাবে নিশ্চিত না হওয়া পর্যন্ত চূড়ান্ত নয়।",
  },
};
