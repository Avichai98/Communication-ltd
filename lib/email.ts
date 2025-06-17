import nodemailer from "nodemailer"

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  secure: Number(process.env.EMAIL_PORT) === 465, // true for 465, false for other ports
  tls: {
    // This is not recommended for production, but helps with testing
    rejectUnauthorized: false,
  },
})

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  try {
    console.log(`Attempting to send email to ${to} with subject: ${subject}`)
    console.log(`Using email configuration:`, {
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      user: process.env.EMAIL_USER ? "Set" : "Not set",
      pass: process.env.EMAIL_PASSWORD ? "Set" : "Not set",
      from: process.env.EMAIL_FROM,
    })

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    })

    console.log(`Email sent to ${to}: ${info.messageId}`)
  } catch (error) {
    console.error("Failed to send email:", error)
    if (error instanceof Error) {
      console.error("Error details:", error.message, error.stack)
    }
    throw error
  }
}
