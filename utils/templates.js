// backend/utils/templates.js

// 👉 Common table style
const tableStyle = ` 
  style="border-collapse: collapse; width: 100%; margin-top:12px;" 
  cellpadding="10" cellspacing="0" border="1" 
`;
// 👉 Format time to AM/PM
const formatTime = (time24) => {
  if (!time24) return "";
  const [hour, minute] = time24.split(":").map(Number);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute.toString().padStart(2, "0")} ${period}`;
};

// 👉 Wrapper (all emails use this)
const wrapTemplate = (title, content, color = "#0d6efd") => `
  <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto; border:1px solid #ddd; border-radius:8px; overflow:hidden;">
    <div style="background:${color}; padding:16px; text-align:center; color:#fff;">
      <h2 style="margin:0;">${title}</h2>
    </div>
    <div style="padding:20px; color:#333; font-size:15px; line-height:1.6;">
      ${content}
    </div>
    <div style="background:#f4f4f4; text-align:center; padding:12px; font-size:12px; color:#888;">
      © ${new Date().getFullYear()} E-Appointment. All rights reserved.
    </div>
  </div>
`;

// 📨 Inquiry Email
const userInquiryTemplate = ({ name, phone, email, productDescription }) => 
  wrapTemplate(
    `Thank You for Your Inquiry, ${name}!`,
    `
    <p>We have received your request. Our team will contact you shortly with more details.</p>
    <h3>Your Details:</h3>
    <table ${tableStyle}>
      <tr><td><b>Name</b></td><td>${name}</td></tr>
      <tr><td><b>Phone</b></td><td>${phone}</td></tr>
      <tr><td><b>Email</b></td><td>${email}</td></tr>
      <tr><td><b>Product Description</b></td><td>${productDescription}</td></tr>
    </table>
    <p style="margin-top:20px; font-size:13px; color:#666;">If you didn’t request this, please ignore this email.</p>
    `
  );

// ✅ Booking Confirmation
const bookingConfirmationTemplate = ({ name, email, phone, booking_date, booking_time, description }) =>
  wrapTemplate(
    `Booking Confirmed ✅`,
    `
    <p>Hello <b>${name}</b>,</p>
    <p>Your appointment has been booked successfully.</p>
    <table ${tableStyle}>
      <tr><td><b>Name</b></td><td>${name}</td></tr>
      <tr><td><b>Phone</b></td><td>${phone}</td></tr>
      <tr><td><b>Email</b></td><td>${email}</td></tr>
      <tr><td><b>Date</b></td><td>${booking_date}</td></tr>
      <tr><td><b>Time</b></td><td>${formatTime(booking_time)}</td></tr>
      <tr><td><b>Details</b></td><td>${description}</td></tr>
    </table>
    <p>Thank you,<br/>E-Appointment Team</p>
    `,
    "#28a745" // green header
  );

// 📢 Booking Notification (to admin)
const bookingNotificationTemplate = ({ name, email, phone, booking_date, booking_time, description }) =>
  wrapTemplate(
    `📢 New Booking Received`,
    `
    <table ${tableStyle}>
      <tr><td><b>Name</b></td><td>${name}</td></tr>
      <tr><td><b>Phone</b></td><td>${phone}</td></tr>
      <tr><td><b>Email</b></td><td>${email}</td></tr>
      <tr><td><b>Date</b></td><td>${booking_date}</td></tr>
      <tr><td><b>Time</b></td><td>${formatTime(booking_time)}</td></tr>
      <tr><td><b>Details</b></td><td>${description}</td></tr>
    </table>
    `,
    "#ff9800" // orange header
  );

// ❌ Booking Cancellation
const cancellationTemplate = ({ name, email, phone, booking_date, booking_time, description }) =>
  wrapTemplate(
    `Booking Cancelled ❌`,
    `
    <p>Hello <b>${name}</b>,</p>
    <p>Your booking has been cancelled. Details below:</p>
    <table ${tableStyle}>
      <tr><td><b>Name</b></td><td>${name}</td></tr>
      <tr><td><b>Phone</b></td><td>${phone}</td></tr>
      <tr><td><b>Email</b></td><td>${email}</td></tr>
      <tr><td><b>Date</b></td><td>${booking_date}</td></tr>
      <tr><td><b>Time</b></td><td>${formatTime(booking_time)}</td></tr>
      <tr><td><b>Details</b></td><td>${description}</td></tr>
    </table>
    <p>Regards,<br/>E-Appointment Team</p>
    `,
    "#dc3545" // red header
  );

module.exports = {
  userInquiryTemplate,
  bookingConfirmationTemplate,
  bookingNotificationTemplate,
  cancellationTemplate,
};
