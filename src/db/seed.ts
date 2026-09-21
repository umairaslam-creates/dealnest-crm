import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./client";
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
} from "./schema";

async function main() {
  console.log("Seeding...");

  // Clean old data
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
  await db.delete(stages);
  await db.delete(pipelines);
  await db.delete(contacts);
  await db.delete(accounts);
  await db.delete(users);

  const devPasswordHash = await bcrypt.hash("mytm2026", 10);

  const [ahmad, sara, omar] = await db
    .insert(users)
    .values([
      { name: "Ahmad Aziz", email: "ahmad.aziz@mytm.co", role: "MANAGER", passwordHash: devPasswordHash },
      { name: "Sara Khaled", email: "sara.khaled@mytm.co", role: "REP", passwordHash: devPasswordHash },
      { name: "Omar Sami", email: "omar.sami@mytm.co", role: "REP", passwordHash: devPasswordHash },
    ])
    .returning();

  const [leadPipeline] = await db
    .insert(pipelines)
    .values({ name: "Lead Intake", type: "LEAD", isDefault: true })
    .returning();

  const leadStageNames = ["New", "Contacted", "Demo Meeting", "Qualified", "Converted"];
  const leadStages = await db
    .insert(stages)
    .values(leadStageNames.map((name, i) => ({ name, order: i, pipelineId: leadPipeline.id })))
    .returning();

  const [dealPipeline] = await db
    .insert(pipelines)
    .values({ name: "Main Sales Pipeline", type: "DEAL", isDefault: true })
    .returning();

  const dealStageNames = [
    "Qualification",
    "Discovery",
    "Proposal Submitted",
    "Negotiation",
    "Contract / Legal",
    "Closed Won",
    "Closed Lost",
  ];
  const dealStages = await db
    .insert(stages)
    .values(dealStageNames.map((name, i) => ({ name, order: i, pipelineId: dealPipeline.id })))
    .returning();

  // A sample ad-hoc event pipeline, same idea as "LEAP 2026" or "Money 20/20"
  const [eventPipeline] = await db
    .insert(pipelines)
    .values({ name: "LEAP 2026", type: "DEAL", isDefault: false })
    .returning();
  await db.insert(stages).values(
    ["Booth Contact", "Follow-up Sent", "Meeting Booked", "Qualified"].map((name, i) => ({
      name,
      order: i,
      pipelineId: eventPipeline.id,
    }))
  );

  const stageByName = (list: typeof dealStages, name: string) => list.find((s) => s.name === name)!.id;

  const accountRows = await db
    .insert(accounts)
    .values([
      { name: "Al Rasheed Bank", industry: "Banking", region: "Saudi Arabia" },
      { name: "Zad Retail Group", industry: "Retail", region: "Saudi Arabia" },
      { name: "Waseet Logistics", industry: "Logistics", region: "UAE" },
      { name: "Nour Telecom", industry: "Telecom", region: "Saudi Arabia" },
      { name: "SNB Enterprise", industry: "Banking", region: "Saudi Arabia" },
      { name: "Baytna Foods", industry: "QSR", region: "UAE" },
    ])
    .returning();

  const acc = (name: string) => accountRows.find((a) => a.name === name)!.id;

  const seededContacts = await db.insert(contacts).values([
    { name: "Faisal Al-Mutairi", title: "Head of Digital", accountId: acc("Al Rasheed Bank") },
    { name: "Noura Al-Qahtani", title: "Procurement Lead", accountId: acc("Al Rasheed Bank") },
    { name: "Khalid Bin Zayed", title: "COO", accountId: acc("Zad Retail Group") },
    { name: "Reem Haddad", title: "Operations Director", accountId: acc("Waseet Logistics") },
    { name: "Mansour Al-Dosari", title: "VP Technology", accountId: acc("SNB Enterprise") },
  ]).returning();

  const seededDeals = await db.insert(deals).values([
    {
      title: "Core Banking Integration",
      value: 480000,
      currency: "SAR",
      accountId: acc("Al Rasheed Bank"),
      ownerId: ahmad.id,
      pipelineId: dealPipeline.id,
      stageId: stageByName(dealStages, "Negotiation"),
      probability: 60,
    },
    {
      title: "Merchant Payments Rollout",
      value: 220000,
      currency: "SAR",
      accountId: acc("Zad Retail Group"),
      ownerId: ahmad.id,
      pipelineId: dealPipeline.id,
      stageId: stageByName(dealStages, "Proposal Submitted"),
      probability: 40,
    },
    {
      title: "Fleet Management Platform",
      value: 150000,
      currency: "AED",
      accountId: acc("Waseet Logistics"),
      ownerId: sara.id,
      pipelineId: dealPipeline.id,
      stageId: stageByName(dealStages, "Discovery"),
      probability: 25,
    },
    {
      title: "Digital Onboarding Suite",
      value: 340000,
      currency: "SAR",
      accountId: acc("Nour Telecom"),
      ownerId: sara.id,
      pipelineId: dealPipeline.id,
      stageId: stageByName(dealStages, "Qualification"),
      probability: 15,
    },
    {
      title: "AI Collections Agent",
      value: 610000,
      currency: "SAR",
      accountId: acc("SNB Enterprise"),
      ownerId: ahmad.id,
      pipelineId: dealPipeline.id,
      stageId: stageByName(dealStages, "Closed Won"),
      probability: 100,
      status: "WON",
    },
    {
      title: "Tamara Checkout Expansion",
      value: 310000,
      currency: "SAR",
      accountId: acc("SNB Enterprise"),
      ownerId: sara.id,
      pipelineId: dealPipeline.id,
      stageId: stageByName(dealStages, "Closed Won"),
      probability: 100,
      status: "WON",
    },
    {
      title: "QSR POS Rollout",
      value: 95000,
      currency: "AED",
      accountId: acc("Baytna Foods"),
      ownerId: omar.id,
      pipelineId: dealPipeline.id,
      stageId: stageByName(dealStages, "Negotiation"),
      probability: 55,
    },
  ]).returning();

  const seededLeads = await db.insert(leads).values([
    {
      contactName: "Fahad Al-Otaibi",
      company: "Jeel Finance",
      email: "fahad@jeelfinance.sa",
      phone: "+966 50 111 2233",
      source: "LinkedIn",
      productInterest: "Payment Gateway",
      region: "Riyadh",
      score: "hot",
      pipelineId: leadPipeline.id,
      stageId: stageByName(leadStages, "New"),
      ownerId: ahmad.id,
    },
    {
      contactName: "Lindsey Cho",
      company: "Tarek Holdings",
      email: "lcho@tarekholdings.com",
      phone: "+971 52 444 5566",
      source: "Referral",
      productInterest: "Corporate Payroll",
      region: "Dubai",
      score: "warm",
      pipelineId: leadPipeline.id,
      stageId: stageByName(leadStages, "Contacted"),
      ownerId: sara.id,
    },
    {
      contactName: "Bilal Chaudhry",
      company: "Indus Retail",
      email: "bilal@indusretail.pk",
      phone: "+92 300 123 4567",
      source: "Money 20/20",
      productInterest: "POS Terminal",
      region: "Karachi",
      score: "hot",
      pipelineId: leadPipeline.id,
      stageId: stageByName(leadStages, "Demo Meeting"),
      ownerId: omar.id,
    },
    {
      contactName: "Elena Sorensen",
      company: "Nord Pay",
      email: "elena@nordpay.io",
      phone: "+44 7911 123456",
      source: "Website",
      productInterest: "Core Banking API",
      region: "London",
      score: "warm",
      pipelineId: leadPipeline.id,
      stageId: stageByName(leadStages, "Qualified"),
      ownerId: ahmad.id,
    },
  ]).returning();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 17, 0, 0);
  const overdue = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await db.insert(tasks).values([
    {
      title: "Send revised POS terminal agreement to Zad Retail Group",
      description: "Discount approved by Ahmad for 15% on bulk terminals.",
      priority: "HIGH",
      dueDate: today,
      ownerId: ahmad.id,
      dealId: seededDeals[1]?.id,
    },
    {
      title: "Prepare technical API integration presentation for Waseet Logistics",
      description: "Focus on webhook latency and multi-currency settlement.",
      priority: "HIGH",
      dueDate: overdue,
      ownerId: sara.id,
      dealId: seededDeals[2]?.id,
    },
    {
      title: "Schedule Discovery Call with Fahad Al-Otaibi",
      description: "Inbound interest from LinkedIn campaign on SME financing.",
      priority: "MEDIUM",
      dueDate: tomorrow,
      ownerId: ahmad.id,
      leadId: seededLeads[0]?.id,
    },
    {
      title: "Follow up on contract signature with Tamara Integration",
      description: "Executive approval received, pending legal review.",
      priority: "MEDIUM",
      dueDate: nextWeek,
      ownerId: ahmad.id,
      dealId: seededDeals[3]?.id,
    },
    {
      title: "Conduct product demo meeting with Bilal Chaudhry",
      description: "Demo the analytics dashboard and batch settlement exports.",
      priority: "HIGH",
      dueDate: today,
      ownerId: omar.id,
      leadId: seededLeads[2]?.id,
    },
    {
      title: "Confirm KYC documentation from Baytna Foods",
      description: "Commercial registration and tax certificates received.",
      priority: "LOW",
      dueDate: overdue,
      done: true,
      ownerId: omar.id,
      dealId: seededDeals[4]?.id,
    },
  ]);

  await db.insert(activities).values([
    {
      type: "MEETING",
      notes: "Executive product demo covering POS terminals, multi-currency processing, and high-volume batch settlement. Client requested SLA agreement draft.",
      occurredAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      dealId: seededDeals[1]?.id,
      contactId: seededContacts[2]?.id,
      userId: ahmad.id,
    },
    {
      type: "MEETING",
      notes: "Technical architecture deep-dive on Payment Gateway APIs, webhook event latency, and tokenization security.",
      occurredAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      dealId: seededDeals[2]?.id,
      contactId: seededContacts[3]?.id,
      userId: sara.id,
    },
    {
      type: "MEETING",
      notes: "Conducted live platform demonstration with Bilal Chaudhry. Showcased real-time reporting analytics and automated settlement feeds.",
      occurredAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      leadId: seededLeads[2]?.id,
      userId: omar.id,
    },
    {
      type: "CALL",
      notes: "Follow-up discovery call regarding API integration timelines and regulatory compliance in KSA.",
      occurredAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      dealId: seededDeals[0]?.id,
      contactId: seededContacts[0]?.id,
      userId: ahmad.id,
    },
    {
      type: "CALL",
      notes: "Introductory qualification call with Tariq Al-Ghamdi regarding Corporate Payroll solution.",
      occurredAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      leadId: seededLeads[0]?.id,
      userId: ahmad.id,
    },
    {
      type: "EMAIL",
      notes: "Sent commercial quotation and technical specification sheet for Smart POS Fleet deployment.",
      occurredAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
      dealId: seededDeals[1]?.id,
      contactId: seededContacts[2]?.id,
      userId: ahmad.id,
    },
  ]);

  await db.insert(meetings).values([
    {
      title: "Smart POS Fleet Product Demonstration",
      description: "Interactive demo with Khalid Bin Zayed covering batch terminal checkout and ERP feeds.",
      meetingType: "DEMO",
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000),
      contactId: seededContacts[2]?.id,
      dealId: seededDeals[1]?.id,
      userId: ahmad.id,
      status: "COMPLETED",
      location: "Google Meet",
      color: "purple",
    },
    {
      title: "API Gateway Architecture & Tokenization Demo",
      description: "Deep dive with Reem Haddad on secure multi-currency payment settlement APIs.",
      meetingType: "DEMO",
      startTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      contactId: seededContacts[3]?.id,
      dealId: seededDeals[2]?.id,
      userId: sara.id,
      status: "COMPLETED",
      location: "In-Person (Riyadh HQ)",
      color: "blue",
    },
    {
      title: "Commercial Contract & Pricing Review",
      description: "Contract negotiation with Faisal Al-Mutairi regarding Core Banking SLA clauses.",
      meetingType: "NEGOTIATION",
      startTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
      contactId: seededContacts[0]?.id,
      dealId: seededDeals[0]?.id,
      userId: ahmad.id,
      status: "SCHEDULED",
      location: "Google Meet",
      color: "coral",
    },
  ]);

  await db.insert(feedback).values([
    {
      type: "IMPROVEMENT",
      message: "The new tasks section and quick search (Cmd+K) makes daily pipeline tracking significantly faster!",
      rating: 5,
      userId: ahmad.id,
    },
    {
      type: "FEATURE",
      message: "Would love automated WhatsApp notifications for deal stage transitions in the future.",
      rating: 4,
      userId: sara.id,
    },
  ]);

  console.log("Seed complete with rich tasks, leads, deals, and feedback.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
