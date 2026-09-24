const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendEmail = async ({ email, subject, text, html }) => {
  const mailOptions = {
    from: `"App Support" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject,
    text,
    html,
  };
  await transporter.sendMail(mailOptions);
};