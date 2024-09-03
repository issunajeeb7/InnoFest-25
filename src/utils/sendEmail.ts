"use server";

// utils/sendEmail.ts
const nodemailer = require("nodemailer");

interface EmailData {
    to: string;
    teamName: string;
    theme: string;
    problemStatementNumber: string;
    problemStatementTitle: string;
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export async function sendConfirmationEmail(data: EmailData) {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: data.to,
        subject: "DUKInnoFest 2024 - Registration Confirmation",
        html: `
      <h1>Thank you for registering for DUKInnoFest 2024!</h1>
      <p>Dear Participant,</p>
      <p>Your team has been successfully registered for the hackathon. Here are your details:</p>
      <ul>
        <li><strong>Team Name:</strong> ${data.teamName}</li>
        <li><strong>Theme:</strong> ${data.theme}</li>
        <li><strong>Problem Statement Number:</strong> ${data.problemStatementNumber}</li>
        <li><strong>Problem Statement Title:</strong> ${data.problemStatementTitle}</li>
      </ul>
      <p>We're excited to see your innovative ideas at the hackathon!</p>
      <p>Best regards,<br>The DUKInnoFest 2024 Team</p>
    `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
}
