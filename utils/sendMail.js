const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

//Sends an email with full sport listing details

const sendEmail = async ({
  to,
  username,
  sportType,
  location,
  date,
  time,
  postedBy,
}) => {
  const formattedDate = new Date(date).toDateString();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject: `New ${sportType} listing for ${formattedDate}`,
    html: `
      <p>Hi ${username},</p>
      <p>A new <strong>${sportType}</strong> listing has been posted!</p>
      <p><strong>Location:</strong> ${location}</p>
      <p><strong>Date:</strong> ${formattedDate}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Posted by:</strong> ${postedBy}</p>
      <br>
      <p>Login to <a href="http://localhost:3000">IFHE-Connect</a> to check it out.</p>
    `,
  };

  try {
    console.log(`Sending email to ${to} for ${sportType} on ${formattedDate}`);
    await transporter.sendMail(mailOptions);
    console.log(" Email sent to:", to);
  } catch (error) {
    console.error(" Error sending email:", error);
  }
};

module.exports = sendEmail;
