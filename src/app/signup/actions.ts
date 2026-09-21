"use server";

import { db } from "@/db/client";
import { users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";

import { PUBLIC_WEBMAILS, extractEmailDomain, isPublicWebmail } from "@/lib/domain-helpers";

/**
 * Checks if a verified Team Lead already exists for the given company domain and department.
 */
export async function checkTeamLeadAvailabilityAction(params: {
  companyDomain: string;
  department: string;
}) {
  const cleanDomain = params.companyDomain.trim().toLowerCase().replace(/^@/, "");
  const cleanDept = params.department.trim();

  if (!cleanDomain || !cleanDept) {
    return { available: true };
  }

  // Check if any verified or active team lead exists for this department in this company
  const existingLead = await db.query.users.findFirst({
    where: and(
      eq(users.companyDomain, cleanDomain),
      eq(users.department, cleanDept),
      eq(users.orgRole, "TEAM_LEAD")
    ),
    columns: {
      id: true,
      name: true,
      email: true,
      status: true,
    },
  });

  if (existingLead) {
    return {
      available: false,
      currentLeadName: existingLead.name || "A verified team lead",
      currentLeadEmail: existingLead.email,
    };
  }

  return { available: true };
}

export type RegisterUserData = {
  accountType: "INDIVIDUAL" | "ORGANIZATION";
  name: string;
  email: string;
  password: string;
  phone?: string;
  // Individual fields
  occupation?: string;
  purpose?: string;
  industry?: string;
  themePreference?: string;
  fontPreference?: string;
  // Organization fields
  department?: string;
  orgRole?: "TEAM_LEAD" | "REPRESENTATIVE" | "EXECUTIVE" | "SPECIALIST" | "INTERN";
};

export async function registerUserAction(data: RegisterUserData) {
  try {
    const name = data.name.trim();
    const email = data.email.trim().toLowerCase();
    const password = data.password;

    if (!name) return { error: "Please enter your full name." };
    if (!email || !email.includes("@")) return { error: "Please enter a valid email address." };
    if (!password || password.length < 6) return { error: "Password must be at least 6 characters." };

    // Check email uniqueness
    const existing = await db.query.users.findFirst({
      where: eq(users.email, email),
      columns: { id: true },
    });
    if (existing) {
      return { error: "An account with this email address already exists. Please sign in instead." };
    }

    const domain = extractEmailDomain(email);

    let status: "ACTIVE" | "PENDING_APPROVAL" = "ACTIVE";
    let orgRole = data.orgRole || "REPRESENTATIVE";
    let department = data.department || null;
    let permissions = JSON.stringify({
      canExportLeads: true,
      canDeleteLeads: true,
      canViewReports: true,
      canReassignLeads: true,
      canManagePipelines: true,
    });

    if (data.accountType === "ORGANIZATION") {
      if (isPublicWebmail(domain)) {
        return {
          error:
            "Organization accounts must use a custom company domain email (e.g. name@company.com), not @" +
            domain +
            ". If you wish to use Gmail, please choose 'Individual Account'.",
        };
      }

      if (!department) {
        return { error: "Please select a department for your organization workspace." };
      }

      // Check strict 1 Team Lead per department rule
      if (orgRole === "TEAM_LEAD") {
        const leadCheck = await checkTeamLeadAvailabilityAction({
          companyDomain: domain,
          department,
        });

        if (!leadCheck.available) {
          return {
            error: `${leadCheck.currentLeadName} has already registered as the verified Team Lead for ${department} in this organization. Each department can have only one Team Lead. Please choose Representative, Executive, Specialist, or Intern to join this department.`,
          };
        }
        // Founding Team Lead gets active status and management rights
        status = "ACTIVE";
        permissions = JSON.stringify({
          canExportLeads: true,
          canDeleteLeads: true,
          canViewReports: true,
          canReassignLeads: true,
          canManagePipelines: true,
        });
      } else {
        // Non-lead team member signup requires Team Lead approval
        status = "PENDING_APPROVAL";
        permissions = JSON.stringify({
          canExportLeads: true,
          canDeleteLeads: false,
          canViewReports: true,
          canReassignLeads: false,
          canManagePipelines: false,
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        role: data.accountType === "ORGANIZATION" && orgRole === "TEAM_LEAD" ? "MANAGER" : "REP",
        accountType: data.accountType,
        department,
        orgRole,
        status,
        companyDomain: data.accountType === "ORGANIZATION" ? domain : null,
        phone: data.phone?.trim() || null,
        occupation: data.occupation?.trim() || null,
        purpose: data.purpose?.trim() || null,
        industry: data.industry?.trim() || null,
        themePreference: data.themePreference || "clinexa-blue",
        fontPreference: data.fontPreference || "saas-modern",
        permissions,
      })
      .returning();

    return {
      success: true,
      userId: newUser.id,
      status: newUser.status,
      accountType: newUser.accountType,
      department: newUser.department,
      orgRole: newUser.orgRole,
      companyDomain: newUser.companyDomain,
    };
  } catch (error: any) {
    console.error("Registration error:", error);
    return { error: error?.message || "Registration failed. Please try again." };
  }
}
