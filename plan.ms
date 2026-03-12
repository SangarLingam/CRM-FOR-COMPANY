# DesignCRM Development Plan

This document describes the **workflow, system structure, and development plan** for the DesignCRM project.

DesignCRM is a **CRM system for interior design businesses** built using **Next.js, MongoDB, and deployed on Vercel**.

---

# 1. Project Goal

The goal of DesignCRM is to help interior design companies manage:

- Customers
- Projects
- Quotes
- Payments
- Team members

All in one system.

---

# 2. User Roles

The system includes **4 roles**.

### Super Admin
Full control of the system.

Permissions:
- Manage users
- Manage projects
- View reports
- View payments
- System configuration

### Manager
Project management role.

Permissions:
- Manage projects
- Approve quotes
- Monitor payments
- Manage team workflow

### Sales
Customer handling role.

Permissions:
- Add customers
- Create projects
- Create quotes
- Track payments

### Designer
Creative execution role.

Permissions:
- View assigned projects
- Upload designs
- Update project status

---

# 3. CRM Workflow

Customer → Project → Quote → Payment

Detailed flow:

1. Sales adds a **Customer**
2. Sales creates a **Project**
3. Sales generates a **Quote**
4. Manager approves the quote
5. Customer confirms project
6. Payments are recorded
7. Designer starts the work

---

# 4. System Modules

## Authentication
User login system with role-based access.

Features:
- JWT authentication
- Role-based permissions

---

## Customer Module

Features:
- Create customer
- Edit customer
- View customer projects
- Customer contact details

---

## Project Module

Features:
- Create project
- Assign designer
- Track project status
- View project progress

Project status example:

- Lead
- Quoted
- Approved
- In Progress
- Completed

---

## Quote Module

Features:
- Create project quote
- Add pricing details
- Send quote to customer
- Quote approval

---

## Payment Module

Features:
- Record payment
- Track paid amount
- Track remaining balance
- Payment history

Payment types:

- Cash
- UPI
- Bank Transfer
- Card
- Cheque

---

# 5. Database Models

Main MongoDB collections.

Users
Customers
Projects
Quotes
Payments

Relationships:

Customer → Projects  
Project → Quote  
Project → Payments  

---

# 6. API Structure

Next.js API routes.

Example:

/api/auth
/api/customers
/api/projects
/api/quotes
/api/payments




Each API supports:

GET  
POST  
PUT  
DELETE

---

# 7. UI Pages

Main application pages.

Login  
Dashboard  
Customers  
Projects  
Quotes  
Payments  
Users

---

# 8. Deployment

Deployment platform:

Vercel

Steps:

1. Push project to GitHub
2. Connect GitHub repo to Vercel
3. Add environment variables
4. Deploy

Environment variables example:
MONGODB_URI=your_mongodb_url
JWT_SECRET=your_secret


---

# 9. Future Improvements

Planned features:

- Invoice generation
- Email notifications
- WhatsApp integration
- Analytics dashboard
- File uploads for designs
- Mobile responsive improvements

---

# 10. Version Roadmap

Version 1
Core CRM features.

Version 2
Automation + notifications.

Version 3
Advanced analytics + integrations.

---

# Author

Project: DesignCRM  
Tech: Next.js + MongoDB + Vercel