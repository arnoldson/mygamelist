import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

interface RequestBody {
  username: string
  email: string
  password: string
}

export async function POST(request: Request) {
  try {
    const body: RequestBody = await request.json()
    const { username, email, password } = body

    // Validate inputs
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    })

    if (existingEmail) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      )
    }

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    })
    if (existingUsername) {
      return NextResponse.json(
        { message: "Username already taken" },
        { status: 400 }
      )
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create the user
    const user = await prisma.user.create({
      data: {
        username: username,
        email,
        password: hashedPassword,
      },
    })

    // Remove the password from the response
    const userWithoutPassword: Omit<typeof user, "password"> = {
      id: user.id,
      username: user.username,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
    }

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
