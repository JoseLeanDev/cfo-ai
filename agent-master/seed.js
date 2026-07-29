#!/usr/bin/env node
/**
 * Seed script for Agent Master Database
 * Run this after creating the master DB and applying the schema
 * 
 * Usage: node seed.js
 * Requires: MASTER_DATABASE_URL env var
 */

require('dotenv').config();
const masterDb = require('./connection');

async function seed() {
  console.log('🌱 Seeding Agent Master Database...\n');

  // Check connection
  const health = await masterDb.healthCheck();
  if (!health.ok) {
    console.error('❌ Cannot connect to master DB:', health.error);
    console.error('Make sure MASTER_DATABASE_URL is set correctly.');
    process.exit(1);
  }
  console.log('✅ Connected to master DB at', health.time);

  // ============================================
  // REGISTER EXISTING CLIENTS
  // ============================================

  const clients = [
    {
      name: 'CFO AI / Abaco',
      slug: 'abaco',
      database_url: 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com/cfo_ai_db',
      database_name: 'cfo_ai_db',
      repository: 'https://github.com/josearias/cfo-ai',
      local_path: '/root/.openclaw/workspace/cfo-ai-project',
      render_service_id: 'cfo-ai-backend-4n29',
      render_db_id: 'dpg-d7fbdrcvikkc739npr4g',
      status: 'active',
      priority: 1,
      timezone: 'America/Guatemala',
      currency: 'GTQ',
      business_context: JSON.stringify({
        industry: 'fintech',
        size: 'startup',
        model: 'saas',
        description: 'Financial intelligence platform for CFOs/CEOs'
      }),
      notes: 'Main production app. Has runway calculator, CCC, customer concentration, SAT integration.'
    },
    {
      name: 'Lavanderia Demo',
      slug: 'lavanderia-demo',
      database_url: 'postgresql://abaco_lavanderia_db_user:dWBeRxNVO3AuY9uBd0Bllmywz3BD4Wp7@dpg-d8gr7meq1p3s73andg20-a.oregon-postgres.render.com:5432/abaco_lavanderia_db',
      database_name: 'abaco_lavanderia_db',
      render_db_id: 'dpg-d8gr7meq1p3s73andg20-a',
      repository: 'https://github.com/josearias/abaco-demo-lavanderia',
      local_path: '/root/.openclaw/workspace/abaco-demo-lavanderia',
      status: 'active',
      priority: 2,
      timezone: 'America/Guatemala',
      currency: 'GTQ',
      business_context: JSON.stringify({
        industry: 'laundry_service',
        size: 'small_business',
        model: 'local_service'
      }),
      notes: 'Demo app for Abaco platform. Currently SHARING database with abaco - MUST FIX.'
    },
    {
      name: 'Mission Control',
      slug: 'mission-control',
      database_url: 'postgresql://cfo_ai_db_user:LpZcIQtaIUu3sGpAZLmdCSxcgF6L0hYh@dpg-d7fbdrcvikkc739npr4g-a.ohio-postgres.render.com/mission_control',
      database_name: 'mission_control',
      repository: 'https://github.com/josearias/mission-control',
      local_path: '/root/.openclaw/workspace/mission-control',
      status: 'active',
      priority: 2,
      timezone: 'America/Guatemala',
      currency: 'GTQ',
      business_context: JSON.stringify({
        industry: 'devops_tools',
        size: 'internal',
        model: 'dashboard'
      }),
      notes: 'Internal dashboard for managing Render deploys and GitHub repos.'
    }
  ];

  for (const client of clients) {
    try {
      const existing = await masterDb.getClientBySlug(client.slug);
      if (existing) {
        console.log(`⚠️  Client "${client.name}" already exists (ID: ${existing.id})`);
        continue;
      }

      const result = await masterDb.createClient(client);
      console.log(`✅ Registered client: ${client.name} (ID: ${result.lastID})`);
    } catch (err) {
      console.error(`❌ Failed to register "${client.name}":`, err.message);
    }
  }

  // ============================================
  // ASSIGN SKILLS
  // ============================================

  const skillAssignments = [
    { client_slug: 'abaco', skills: ['React Frontend', 'Node.js Backend', 'PostgreSQL', 'Financial Analysis', 'AI Integration', 'SAT / Taxes'] },
    { client_slug: 'lavanderia-demo', skills: ['React Frontend', 'Node.js Backend', 'PostgreSQL'] },
    { client_slug: 'mission-control', skills: ['React Frontend', 'Node.js Backend', 'PostgreSQL', 'DevOps / CI-CD'] }
  ];

  for (const assignment of skillAssignments) {
    const client = await masterDb.getClientBySlug(assignment.client_slug);
    if (!client) {
      console.log(`⚠️  Client "${assignment.client_slug}" not found, skipping skill assignment`);
      continue;
    }

    for (const skillName of assignment.skills) {
      try {
        const skill = await masterDb.get(
          'SELECT id FROM skills WHERE name = ?',
          [skillName]
        );
        if (!skill) {
          console.log(`⚠️  Skill "${skillName}" not found in catalog`);
          continue;
        }

        await masterDb.run(
          'INSERT INTO client_skills (client_id, skill_id) VALUES (?, ?) ON CONFLICT DO NOTHING',
          [client.id, skill.id]
        );
        console.log(`✅ Assigned "${skillName}" to ${client.name}`);
      } catch (err) {
        console.error(`❌ Failed to assign "${skillName}" to ${client.name}:`, err.message);
      }
    }
  }

  console.log('\n🎉 Seed complete!');
  console.log('\nNext steps:');
  console.log('  1. Create a separate PostgreSQL DB for lavanderia-demo');
  console.log('  2. Update lavanderia-demo/backend/.env with the new DATABASE_URL');
  console.log('  3. Run migrations on the new lavanderia DB');
}

seed().catch(err => {
  console.error('💥 Seed failed:', err);
  process.exit(1);
});
