import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: "us-east-1" });

const ALLOWED_ORIGINS = [
  "https://driftlesslogic.com",
  "https://www.driftlesslogic.com",
  "http://localhost:4321",
];

export const handler = async (event) => {
  const origin = event.headers?.origin || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  const headers = {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  // Handle CORS preflight
  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { name, email, organization, subject, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Name, email, and message are required" }),
      };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid email format" }),
      };
    }

    const subjectMap = {
      partnership: "Partnership Inquiry",
      methodology: "Methodology Questions",
      swarm: "Swarm Waitlist",
      federal: "Federal Contracting",
      general: "General Inquiry",
    };

    const emailSubject = `[Driftless Logic] ${subjectMap[subject] || "Contact Form"}: ${name}`;

    const emailBody = `
New contact form submission from driftlesslogic.com

Name: ${name}
Email: ${email}
Organization: ${organization || "Not provided"}
Subject: ${subjectMap[subject] || subject || "Not specified"}

Message:
${message}

---
Sent from the Driftless Logic website contact form
    `.trim();

    const command = new SendEmailCommand({
      Source: "jake@driftlesslogic.com",
      Destination: {
        ToAddresses: ["jake@driftlesslogic.com"],
      },
      Message: {
        Subject: { Data: emailSubject },
        Body: {
          Text: { Data: emailBody },
        },
      },
      ReplyToAddresses: [email],
    });

    await ses.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: "Message sent successfully" }),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Failed to send message. Please try again." }),
    };
  }
};
