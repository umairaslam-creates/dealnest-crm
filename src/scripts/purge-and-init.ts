import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../db/client";
import {
  accounts,
  contacts,
  deals,
  leads,
  pipelines,
  stages,
  users,
  tasks,
  feedback,
  activities,
  meetings,
  stageHistory,
  aiSuggestions,
  googleTokens,
  dealContacts,
  targets,
  products,
} from "../db/schema";
import { eq, ne, and, sql, notInArray } from "drizzle-orm";

async function main() {
  console.log("==================================================");
  console.log("DEALNEST CRM — Production Database Purge & Init");
  console.log("==================================================");

  // 1. Purge all operational pseudo/dummy records
  console.log("1. Purging pseudo/dummy records...");
  await db.delete(meetings);
  await db.delete(feedback);
  await db.delete(tasks);
  await db.delete(activities);
  await db.delete(stageHistory);
  await db.delete(aiSuggestions);
  await db.delete(googleTokens);
  await db.delete(dealContacts);
  await db.delete(deals);
  await db.delete(leads);
  await db.delete(targets);
  await db.delete(contacts);
  await db.delete(accounts);
  console.log("   ✓ Purged deals, leads, accounts, contacts, tasks, activities, meetings, targets.");

  // 2. Remove secondary test users (Sara Khaled, Omar Sami)
  console.log("2. Cleaning test user accounts...");
  const adminEmail = (process.env.ADMIN_EMAIL || "ahmad.aziz@mytm.co").trim().toLowerCase();
  const adminName = process.env.ADMIN_NAME || "Ahmad Aziz";
  const adminPass = process.env.ADMIN_PASSWORD || "mytm2026";

  // Delete all users except master admin
  await db.delete(users).where(ne(users.email, adminEmail));
  console.log(`   ✓ Removed non-admin test users. Preserving master admin (${adminEmail}).`);

  // 3. Ensure master admin user exists with active permissions
  const passwordHash = await bcrypt.hash(adminPass, 10);
  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail),
  });

  const adminPermissions = JSON.stringify({
    canExportLeads: true,
    canDeleteLeads: true,
    canViewReports: true,
    canReassignLeads: true,
    canManagePipelines: true,
    canAssignTargets: true,
  });

  if (existingAdmin) {
    await db
      .update(users)
      .set({
        name: adminName,
        role: "ADMIN",
        accountType: "ORGANIZATION",
        department: "Executive Management",
        orgRole: "TEAM_LEAD",
        status: "ACTIVE",
        permissions: adminPermissions,
        passwordHash,
      })
      .where(eq(users.id, existingAdmin.id));
    console.log(`   ✓ Master admin (${adminEmail}) updated to active ADMIN status.`);
  } else {
    await db.insert(users).values({
      name: adminName,
      email: adminEmail,
      role: "ADMIN",
      accountType: "ORGANIZATION",
      department: "Executive Management",
      orgRole: "TEAM_LEAD",
      status: "ACTIVE",
      permissions: adminPermissions,
      passwordHash,
    });
    console.log(`   ✓ Master admin (${adminEmail}) created successfully.`);
  }

  // 4. Clean ad-hoc event pipelines, preserve default system pipelines
  console.log("3. Validating core system pipelines & stages...");
  // Find or create default Lead Intake pipeline
  let leadPipeline = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.type, "LEAD"), eq(pipelines.isDefault, true)),
  });

  if (!leadPipeline) {
    const [created] = await db
      .insert(pipelines)
      .values({ name: "Lead Intake", type: "LEAD", isDefault: true })
      .returning();
    leadPipeline = created;
    console.log("   ✓ Created default 'Lead Intake' pipeline.");
  }

  const leadStageNames = ["New", "Contacted", "Demo Meeting", "Qualified", "Converted"];
  for (let i = 0; i < leadStageNames.length; i++) {
    const stageName = leadStageNames[i];
    const existing = await db.query.stages.findFirst({
      where: and(eq(stages.pipelineId, leadPipeline.id), eq(stages.name, stageName)),
    });
    if (!existing) {
      await db.insert(stages).values({
        name: stageName,
        order: i,
        pipelineId: leadPipeline.id,
      });
    }
  }

  // Find or create default Main Sales Pipeline
  let dealPipeline = await db.query.pipelines.findFirst({
    where: and(eq(pipelines.type, "DEAL"), eq(pipelines.isDefault, true)),
  });

  if (!dealPipeline) {
    const [created] = await db
      .insert(pipelines)
      .values({ name: "Main Sales Pipeline", type: "DEAL", isDefault: true })
      .returning();
    dealPipeline = created;
    console.log("   ✓ Created default 'Main Sales Pipeline'.");
  }

  const dealStageNames = [
    "Qualification",
    "Discovery",
    "Proposal Submitted",
    "Negotiation",
    "Contract / Legal",
    "Closed Won",
    "Closed Lost",
  ];
  for (let i = 0; i < dealStageNames.length; i++) {
    const stageName = dealStageNames[i];
    const existing = await db.query.stages.findFirst({
      where: and(eq(stages.pipelineId, dealPipeline.id), eq(stages.name, stageName)),
    });
    if (!existing) {
      await db.insert(stages).values({
        name: stageName,
        order: i,
        pipelineId: dealPipeline.id,
      });
    }
  }

  // Delete non-default custom event pipelines (e.g. LEAP 2026, money2020) and their stages
  const nonDefaultPipelines = await db.query.pipelines.findMany({
    where: eq(pipelines.isDefault, false),
  });

  for (const p of nonDefaultPipelines) {
    await db.delete(stages).where(eq(stages.pipelineId, p.id));
    await db.delete(pipelines).where(eq(pipelines.id, p.id));
    console.log(`   ✓ Cleaned non-default pipeline: ${p.name}`);
  }

  // 5. Audit Final Counts
  console.log("\n==================================================");
  console.log("PRODUCTION DATABASE AUDIT SUMMARY:");
  console.log("==================================================");
  const auditTables = [
    "users",
    "pipelines",
    "stages",
    "products",
    "accounts",
    "contacts",
    "leads",
    "deals",
    "tasks",
    "activities",
    "meetings",
    "targets",
    "feedback",
  ];

  for (const t of auditTables) {
    const res = await db.execute(sql.raw(`SELECT count(*) FROM ${t}`));
    console.log(`- ${t.padEnd(16)}: ${res[0].count} records`);
  }

  console.log("==================================================");
  console.log("✓ DEALNEST CRM IS COMPLETELY CLEAN & PRODUCTION READY!");
  console.log("==================================================");
  process.exit(0);
}

main().catch((err) => {
  console.error("Purge error:", err);
  process.exit(1);
});
