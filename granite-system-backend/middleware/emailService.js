const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Create transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // This should be an App Password for Gmail
        },
    });

    // Define email options
    const mailOptions = {
        from: `"Heritage Slabs" <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
    };

    // Send email
    await transporter.sendMail(mailOptions);
};

const sendOrderConfirmation = async (user, order) => {
    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h1 style="color: #2a9d8f;">Order Successful!</h1>
            <p>Hello ${user.name},</p>
            <p>Thank you for your order with Heritage Slabs. Your payment has been successfully processed.</p>
            
            <div style="background: #f4f4f4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Order Summary</h3>
                <p><strong>Order ID:</strong> ${order._id}</p>
                <p><strong>Total Amount:</strong> LKR ${order.totalAmount.toLocaleString()}</p>
                <p><strong>Status:</strong> Paid</p>
            </div>
            
            <p>We will contact you shortly regarding the delivery/pickup details.</p>
            <p>Best regards,<br/>Heritage Slabs Team</p>
        </div>
    `;

    await sendEmail({
        email: user.email,
        subject: 'Order Confirmation - Heritage Slabs',
        html: html
    });
};

module.exports = { sendEmail, sendOrderConfirmation };
