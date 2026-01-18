import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: 'bharbatdivyansh1@gmail.com',
    pass: 'hlhyxxrtsxfsqoge', // remove trailing space!
  },
});

// Optional: verify connection when server starts
transporter.verify((err, success) => {
  if (err) console.error("[SMTP verify] Error:", err);
  else console.log("[SMTP verify] Server ready to send emails");
});
