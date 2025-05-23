import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

interface RequestBody {
  name: string
  email: string
  password: string
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json()
    const { name, email, password } = body

    // Validate inputs
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    })

    // Remove the password from the response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      { message: "User created successfully", user: userWithoutPassword },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    console.log("REQUEST BODY:", request)
    return NextResponse.json(
      { message: "Something went wrong" },
      { status: 500 }
    )
  }
}
