"use server";

// utils/sendEmail.ts
const nodemailer = require("nodemailer");

interface EmailData {
    to: string;
    roomAllotted: string;
}

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

export async function notifyRoomAllocation(data: EmailData) {
    const mailOptions = {
        from: process.env.GMAIL_USER,
        to: data.to,
        subject: "DUKInnoFest 2024 - Room Allocation Notification",
        html: `
      <h1>Room Allocation for DUKInnoFest 2024</h1>
      <p>Dear Team Leader,</p>
      <p>Your team has been successfully allocated/reallocated <strong>room number ${data.roomAllotted}</strong> for the hackathon.</p>
      <p>If there is any change in your room allocation, we will notify you promptly.</p>
      <p>We look forward to seeing your innovative solutions at the hackathon!</p>
      <br /><p>Best regards,<br />The DUKInnoFest 2024 Team</p>
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
