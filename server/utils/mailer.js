const nodemailer = require('nodemailer');

const sendTelemetryReport = async (toEmail, patientName, reportData) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("Server .env file me EMAIL_USER ya EMAIL_PASS missing hai.");
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Pressure Padded Sole" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: `Foot Pressure Telemetry Report - ${patientName}`,
    html: `
      <div style="font-family: Arial, sans-serif; background: #080d13; color: #e8f0f7; padding: 24px; border-radius: 8px;">
        <h2 style="color: #1ab9c9;">Pressure Padded Sole — Telemetry Diagnostics</h2>
        <p>Hello <b>${patientName}</b>,</p>
        <p>Your gait and pressure session telemetry report is ready.</p>
        
        <div style="background: #0d1621; padding: 16px; border-radius: 6px; margin: 16px 0; border: 1px solid #1c2b3c;">
          <p style="margin: 6px 0;"><b>Session ID:</b> ${reportData.sessionId}</p>
          <p style="margin: 6px 0;"><b>Average Pressure:</b> ${reportData.avgPressure} kPa</p>
          <p style="margin: 6px 0;"><b>Peak Pressure:</b> ${reportData.peakPressure} kPa</p>
          <p style="margin: 6px 0;"><b>Foot Health Score:</b> <span style="color: #40d394; font-weight: bold;">${reportData.footHealth}%</span></p>
          <p style="margin: 6px 0;"><b>Symmetry Score:</b> ${reportData.symmetry}%</p>
        </div>

        <h3>Practitioner Notes:</h3>
        <p style="background: #081018; padding: 12px; border-left: 3px solid #1ab9c9; color: #b0c4de;">
          ${reportData.notes}
        </p>
      </div>
    `
  };

  return await transporter.sendMail(mailOptions);
};

module.exports = { sendTelemetryReport };