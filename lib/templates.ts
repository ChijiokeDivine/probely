export interface ReviewTemplate {
  id: string;
  name: string;
  description: string;
  role: string;
  categoryWeights: {
    problemSolving: number;
    technicalDepth: number;
    communication: number;
    collaboration: number;
    cultureGrowth: number;
  };
  autoAdvanceRule: {
    enabled: boolean;
    passThreshold: number;
    failThreshold: number;
    passAction: string;
    failAction: string;
  };
  notesForReviewers: string;
  image: string;
}

export const TEMPLATES: ReviewTemplate[] = [
  {
    id: "senior-eng",
    name: "Senior Engineer",
    description: "A balanced template for senior-level technical roles with a focus on problem solving and technical depth.",
    role: "Senior Engineer",
    categoryWeights: {
      problemSolving: 30,
      technicalDepth: 30,
      communication: 15,
      collaboration: 10,
      cultureGrowth: 15,
    },
    autoAdvanceRule: {
      enabled: true,
      passThreshold: 80,
      failThreshold: 40,
      passAction: "Next round",
      failAction: "Send rejection",
    },
    notesForReviewers: "Please focus on the candidate's ability to design scalable systems and mentor junior engineers.",
    image: "/program.webp",
  },
  {
    id: "frontend-dev",
    name: "Frontend Developer",
    description: "Emphasizes user experience, collaboration, and technical skills for frontend-focused roles.",
    role: "Frontend Developer",
    categoryWeights: {
      problemSolving: 20,
      technicalDepth: 25,
      communication: 20,
      collaboration: 20,
      cultureGrowth: 15,
    },
    autoAdvanceRule: {
      enabled: false,
      passThreshold: 75,
      failThreshold: 40,
      passAction: "Next round",
      failAction: "No action",
    },
    notesForReviewers: "Pay attention to the candidate's knowledge of modern frontend frameworks and accessibility best practices.",
    image: "/programmer.webp",
  },
  {
    id: "product-manager",
    name: "Product Manager",
    description: "Focuses on communication, collaboration, and strategic thinking for product roles.",
    role: "Product Manager",
    categoryWeights: {
      problemSolving: 20,
      technicalDepth: 10,
      communication: 30,
      collaboration: 25,
      cultureGrowth: 15,
    },
    autoAdvanceRule: {
      enabled: true,
      passThreshold: 75,
      failThreshold: 35,
      passAction: "Next round",
      failAction: "Send rejection",
    },
    notesForReviewers: "Evaluate the candidate's ability to prioritize features and communicate effectively with stakeholders.",
    image: "/product.webp",
  },
  {
    id: "designer",
    name: "UX/UI Designer",
    description: "Balances technical design skills with collaboration and communication abilities.",
    role: "UX/UI Designer",
    categoryWeights: {
      problemSolving: 25,
      technicalDepth: 20,
      communication: 25,
      collaboration: 20,
      cultureGrowth: 10,
    },
    autoAdvanceRule: {
      enabled: false,
      passThreshold: 70,
      failThreshold: 35,
      passAction: "Next round",
      failAction: "No action",
    },
    notesForReviewers: "Assess the candidate's design thinking process and ability to create user-centered solutions.",
    image: "/womanonpc.webp",
  },
];
