// lib/database-info.ts
import { PrismaClient } from "@prisma/client"

export async function getDatabaseInfo() {
  const prisma = new PrismaClient()

  try {
    await prisma.$connect()

    // Get database name and version
    const dbInfo = (await prisma.$queryRaw`
      SELECT 
        current_database() as database_name, 
        version() as version,
        current_user as current_user,
        current_setting('server_version') as postgres_version
    `) as any[]

    // Get all tables in the database
    const tables = (await prisma.$queryRaw`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `) as any[]

    // Get database size
    const sizeQuery = (await prisma.$queryRaw`
      SELECT 
        pg_size_pretty(pg_database_size(current_database())) as database_size
    `) as any[]

    const info = {
      ...dbInfo[0],
      database_size: sizeQuery[0]?.database_size,
      tables: tables.map((t) => ({
        name: t.table_name,
        type: t.table_type,
      })),
      connection_url: process.env.DATABASE_URL?.replace(/:[^:]*@/, ":***@"), // Hide password
    }

    return info
  } catch (error) {
    console.error("Error getting database info:", error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Usage example function
export async function printDatabaseInfo() {
  try {
    const info = await getDatabaseInfo()

    console.log("=== DATABASE INFORMATION ===")
    console.log("Database Name:", info.database_name)
    console.log("PostgreSQL Version:", info.postgres_version)
    console.log("Current User:", info.current_user)
    console.log("Database Size:", info.database_size)
    console.log("Connection URL:", info.connection_url)
    console.log("Tables in database:")
    info.tables.forEach((table) => {
      console.log(`  - ${table.name} (${table.type})`)
    })
    console.log("===============================")

    return info
  } catch (error) {
    console.error("Failed to get database info:", error)
    return null
  }
}
