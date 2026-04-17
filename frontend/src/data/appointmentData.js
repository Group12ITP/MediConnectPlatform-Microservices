export const specialties = [
  { id: 1, name: "General Physician", icon: "🩺", count: 12 },
  { id: 2, name: "Cardiologist", icon: "❤️", count: 8 },
  { id: 3, name: "Urologist", icon: "🧬", count: 5 },
  { id: 4, name: "Pediatrician", icon: "👶", count: 7 },
  { id: 5, name: "Psychiatrist", icon: "🧠", count: 4 },
  { id: 6, name: "Dentist", icon: "🦷", count: 9 },
];

export const doctorsWithAvailability = [
  {
    id: 1,
    name: "Dr. Cody Nguyen",
    specialty: "Urologist",
    avatar: "👨🏻‍⚕️",
    rating: 4.9,
    price: 4500,
    experience: "12 years",
    location: "Kandy Central Hospital",
    nextAvailable: "Today",
    availability: {
      "2026-04-05": ["09:00", "10:30", "14:00", "15:30"], // green
      "2026-04-06": ["08:30", "11:00", "13:00"], // green
      "2026-04-07": ["09:00", "10:00", "16:00"], // green
    },
    bookedSlots: {
      "2026-04-05": ["11:00", "13:00"],
      "2026-04-06": ["09:00", "14:30"],
    },
  },
  {
    id: 2,
    name: "Dr. Bessie Howard",
    specialty: "Cardiologist",
    avatar: "👩🏻‍⚕️",
    rating: 4.8,
    price: 6500,
    experience: "15 years",
    location: "Kandy General Hospital",
    nextAvailable: "Tomorrow",
    availability: {
      "2026-04-05": ["10:00", "11:30", "14:30"],
      "2026-04-06": ["09:00", "13:00", "15:00"],
    },
    bookedSlots: {
      "2026-04-05": ["09:00", "13:00"],
    },
  },

];