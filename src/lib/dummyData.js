// lib/dummyData.js
// All temporary frontend data — replace with API calls in Step 2

export const dummyUser = {
  _id: "u001",
  name: "Priya Sharma",
  email: "priya@designstudio.com",
  role: "manager", // try: "super_admin" | "manager" | "sales" | "designer"
};

export const dummyLeads = [
  { _id: "l001", customerName: "Rajesh Kumar",   phone: "9876543210", email: "rajesh@gmail.com",  address: "12 MG Road, Bangalore",   leadSource: "referral",    status: "new",        assignedSales: { name: "Amit Singh" },   assignedDesigner: { name: "Sneha Patel" }, budget: 500000,  projectType: "Residential", notes: "2BHK renovation", createdAt: "2025-01-10" },
  { _id: "l002", customerName: "Meena Iyer",     phone: "9123456780", email: "meena@yahoo.com",   address: "5 Anna Nagar, Chennai",    leadSource: "website",     status: "contacted",  assignedSales: { name: "Riya Verma" },   assignedDesigner: null,                    budget: 800000,  projectType: "Commercial",  notes: "Office interior",  createdAt: "2025-01-12" },
  { _id: "l003", customerName: "Suresh Nair",    phone: "9988776655", email: "suresh@hotmail.com", address: "88 Juhu, Mumbai",          leadSource: "social_media", status: "site_visit", assignedSales: { name: "Amit Singh" },   assignedDesigner: { name: "Kiran Das" },   budget: 1200000, projectType: "Villa",        notes: "Full home design", createdAt: "2025-01-15" },
  { _id: "l004", customerName: "Anita Desai",    phone: "9871234560", email: "anita@gmail.com",   address: "34 Civil Lines, Delhi",    leadSource: "walk_in",     status: "quote_sent", assignedSales: { name: "Riya Verma" },   assignedDesigner: { name: "Sneha Patel" }, budget: 650000,  projectType: "Residential", notes: "3BHK flat",        createdAt: "2025-01-18" },
  { _id: "l005", customerName: "Vikram Malhotra", phone: "9765432100", email: "vikram@corp.com",  address: "22 Sector 17, Chandigarh", leadSource: "referral",    status: "won",        assignedSales: { name: "Amit Singh" },   assignedDesigner: { name: "Kiran Das" },   budget: 950000,  projectType: "Penthouse",   notes: "Luxury penthouse", createdAt: "2025-01-20" },
  { _id: "l006", customerName: "Lakshmi Rao",    phone: "9654321098", email: "lakshmi@gmail.com", address: "77 Banjara Hills, Hyderabad", leadSource: "website",   status: "lost",       assignedSales: { name: "Riya Verma" },   assignedDesigner: null,                    budget: 300000,  projectType: "Residential", notes: "Budget too low",   createdAt: "2025-01-22" },
];

export const dummyProjects = [
  { _id: "p001", projectName: "Vikram Malhotra Penthouse", customerId: { name: "Vikram Malhotra", phone: "9765432100" }, designerId: { name: "Kiran Das" },   status: "in_progress", startDate: "2025-02-01", endDate: "2025-04-30", totalBudget: 950000,  description: "Luxury penthouse full interior" },
  { _id: "p002", projectName: "Nisha Gupta Villa",          customerId: { name: "Nisha Gupta",     phone: "9812345670" }, designerId: { name: "Sneha Patel" }, status: "design",      startDate: "2025-02-10", endDate: "2025-05-15", totalBudget: 1500000, description: "4BHK villa complete design" },
  { _id: "p003", projectName: "Arjun Mehta Office",         customerId: { name: "Arjun Mehta",     phone: "9700001111" }, designerId: { name: "Kiran Das" },   status: "planning",    startDate: "2025-03-01", endDate: "2025-06-01", totalBudget: 700000,  description: "Corporate office interiors" },
  { _id: "p004", projectName: "Kavya Reddy 3BHK",           customerId: { name: "Kavya Reddy",     phone: "9600002222" }, designerId: { name: "Sneha Patel" }, status: "completed",   startDate: "2024-10-01", endDate: "2025-01-15", totalBudget: 450000,  description: "3BHK apartment renovation" },
];

export const dummyQuotes = [
  { _id: "q001", quoteNumber: "QT-1001", projectId: { projectName: "Vikram Malhotra Penthouse" }, customerId: { name: "Vikram Malhotra" }, totalAmount: 920000, status: "accepted", createdAt: "2025-02-05",
    items: [
      { name: "Living Room Design", description: "Complete living area", quantity: 1, unitPrice: 350000, total: 350000 },
      { name: "Master Bedroom",     description: "Bedroom + wardrobe",   quantity: 1, unitPrice: 280000, total: 280000 },
      { name: "Kitchen Modular",    description: "Full modular kitchen",  quantity: 1, unitPrice: 290000, total: 290000 },
    ], subtotal: 920000, tax: 0, discount: 0,
  },
  { _id: "q002", quoteNumber: "QT-1002", projectId: { projectName: "Nisha Gupta Villa" },          customerId: { name: "Nisha Gupta" },     totalAmount: 1480000, status: "sent",     createdAt: "2025-02-15",
    items: [
      { name: "Full Villa Interior", description: "All rooms", quantity: 1, unitPrice: 1480000, total: 1480000 },
    ], subtotal: 1480000, tax: 0, discount: 0,
  },
  { _id: "q003", quoteNumber: "QT-1003", projectId: { projectName: "Arjun Mehta Office" },         customerId: { name: "Arjun Mehta" },     totalAmount: 680000, status: "draft",    createdAt: "2025-03-02",
    items: [
      { name: "Reception Area", description: "", quantity: 1, unitPrice: 200000, total: 200000 },
      { name: "Workstations",   description: "12 seats", quantity: 12, unitPrice: 40000,  total: 480000 },
    ], subtotal: 680000, tax: 0, discount: 0,
  },
  { _id: "q004", quoteNumber: "QT-1004", projectId: { projectName: "Kavya Reddy 3BHK" },          customerId: { name: "Kavya Reddy" },     totalAmount: 430000, status: "rejected", createdAt: "2024-10-05",
    items: [
      { name: "3BHK Renovation", description: "Full flat", quantity: 1, unitPrice: 430000, total: 430000 },
    ], subtotal: 430000, tax: 0, discount: 0,
  },
];

export const dummyPayments = [
  { _id: "pay001", projectId: { projectName: "Vikram Malhotra Penthouse" }, customerId: { name: "Vikram Malhotra" }, amount: 460000, paymentMethod: "bank_transfer", status: "completed", paymentDate: "2025-02-10", reference: "NEFT20250210" },
  { _id: "pay002", projectId: { projectName: "Vikram Malhotra Penthouse" }, customerId: { name: "Vikram Malhotra" }, amount: 460000, paymentMethod: "bank_transfer", status: "completed", paymentDate: "2025-03-15", reference: "NEFT20250315" },
  { _id: "pay003", projectId: { projectName: "Kavya Reddy 3BHK" },          customerId: { name: "Kavya Reddy" },     amount: 450000, paymentMethod: "upi",          status: "completed", paymentDate: "2025-01-20", reference: "UPI20250120" },
  { _id: "pay004", projectId: { projectName: "Nisha Gupta Villa" },          customerId: { name: "Nisha Gupta" },     amount: 500000, paymentMethod: "cash",         status: "pending",   paymentDate: "2025-02-20", reference: "" },
];

export const dummyCustomers = [
  { _id: "c001", name: "Vikram Malhotra", phone: "9765432100", email: "vikram@corp.com",   address: "22 Sector 17, Chandigarh",     createdAt: "2025-01-20", leadId: { leadSource: "referral", status: "won" } },
  { _id: "c002", name: "Nisha Gupta",     phone: "9812345670", email: "nisha@gmail.com",   address: "14 Koramangala, Bangalore",    createdAt: "2025-01-25", leadId: { leadSource: "website",  status: "won" } },
  { _id: "c003", name: "Arjun Mehta",     phone: "9700001111", email: "arjun@startup.in",  address: "56 BKC, Mumbai",               createdAt: "2025-02-01", leadId: { leadSource: "referral", status: "won" } },
  { _id: "c004", name: "Kavya Reddy",     phone: "9600002222", email: "kavya@gmail.com",   address: "88 Jubilee Hills, Hyderabad",  createdAt: "2024-09-15", leadId: { leadSource: "walk_in",  status: "won" } },
];

export const dummyTeam = [
  { _id: "u001", name: "Priya Sharma",   email: "priya@studio.com",   role: "manager",  createdAt: "2024-01-01" },
  { _id: "u002", name: "Amit Singh",     email: "amit@studio.com",    role: "sales",    createdAt: "2024-02-15" },
  { _id: "u003", name: "Riya Verma",     email: "riya@studio.com",    role: "sales",    createdAt: "2024-03-10" },
  { _id: "u004", name: "Sneha Patel",    email: "sneha@studio.com",   role: "designer", createdAt: "2024-02-20" },
  { _id: "u005", name: "Kiran Das",      email: "kiran@studio.com",   role: "designer", createdAt: "2024-04-05" },
];

export const dummyDashboard = {
  leads:    { total: 6, new: 1, won: 1, lost: 1 },
  projects: { total: 4, active: 3, completed: 1 },
  quotes:   { total: 4, accepted: 1 },
  revenue:  1370000,
  recentLeads: dummyLeads.slice(0, 5),
};