const Bull = require('bull');
const User = require('../models/User.model');
const OrderModel = require('../models/Order.model');
const sendEmail = require('../utils/sendMail');

// Initialize Bull queue
const EmailQueue = new Bull('Email_Sending', {
    redis: { host: '127.0.0.1', port: 6379 },
    defaultJobOptions: {
        attempts: 3,
        delay: 3000
    }
});

// ─── Shared OTP email HTML builder ───────────────────────────────
const otpEmailHtml = (name, otp, heading, subtext) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#81190B 0%,#a01a0a 100%);padding:32px 24px;text-align:center;">
      <div style="font-size:36px;margin-bottom:8px;">🌶</div>
      <h2 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">Grand Masala</h2>
      <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">${heading}</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 24px;">
      <p style="margin:0 0 20px;color:#374151;font-size:15px;line-height:1.6;">
        Hi <strong>${name || 'there'}</strong>,<br/>${subtext}
      </p>

      <!-- OTP box -->
      <div style="background:#fef2f2;border:2px dashed #81190B;border-radius:12px;padding:20px;text-align:center;margin-bottom:24px;">
        <p style="margin:0 0 6px;color:#6b7280;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Your OTP</p>
        <p style="margin:0;font-size:40px;font-weight:800;color:#81190B;letter-spacing:10px;">${otp}</p>
        <p style="margin:8px 0 0;color:#9ca3af;font-size:11px;">Valid for 15 minutes. Do not share with anyone.</p>
      </div>

      <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
        If you did not request this, please ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px 24px;text-align:center;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        &copy; ${new Date().getFullYear()} Grand Masala. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>`;

// ─── Email templates ──────────────────────────────────────────────
const emailTemplates = {

    register: (user, otp) => ({
        subject: 'Verify your Grand Masala account',
        html: otpEmailHtml(
            user.Name,
            otp,
            'Verify Your Account',
            'Thanks for signing up! Use the OTP below to verify your email address and activate your account.'
        ),
    }),

    resendRegisterOtp: (user, otp) => ({
        subject: 'Your new verification OTP — Grand Masala',
        html: otpEmailHtml(
            user.Name,
            otp,
            'Resend Verification OTP',
            'Here is your new verification code. The previous one has been invalidated.'
        ),
    }),

    loginOtp: (user, otp) => ({
        subject: 'Your login OTP — Grand Masala',
        html: otpEmailHtml(
            user.Name,
            otp,
            'Login OTP',
            'Use the OTP below to sign in to your Grand Masala account.'
        ),
    }),

    passwordOtp: (user, otp) => ({
        subject: 'Reset your Grand Masala password',
        html: otpEmailHtml(
            user.Name,
            otp,
            'Password Reset OTP',
            'We received a request to reset your password. Use the OTP below to proceed.'
        ),
    }),

    passwordResendOtp: (user, otp) => ({
        subject: 'New password reset OTP — Grand Masala',
        html: otpEmailHtml(
            user.Name,
            otp,
            'Password Reset OTP (Resent)',
            'Here is your new password reset code. The previous one has been invalidated.'
        ),
    }),

    orderConfirmOtp: (order) => ({
        subject: `Order #${order.orderId || order._id} Confirmed — Grand Masala`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f4f1ea;margin:0;padding:0;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#81190B,#a01a0a);padding:28px 24px;text-align:center;">
      <div style="font-size:32px;margin-bottom:6px;">🎉</div>
      <h2 style="margin:0;color:#fff;font-size:20px;">Order Confirmed!</h2>
    </div>
    <div style="padding:28px 24px;">
      <p style="color:#374151;">Your order <strong>#${order.orderId || order._id}</strong> has been placed successfully.</p>
      <p style="color:#6b7280;font-size:13px;">Thank you for shopping with Grand Masala!</p>
    </div>
  </div>
</body>
</html>`,
    }),
};

// ─── Friendly subject map (fallback) ─────────────────────────────
const subjectMap = {
    register:           'Verify your Grand Masala account',
    resendRegisterOtp:  'Your new verification OTP — Grand Masala',
    loginOtp:           'Your login OTP — Grand Masala',
    passwordOtp:        'Reset your Grand Masala password',
    passwordResendOtp:  'New password reset OTP — Grand Masala',
};

// ─── Queue processor ──────────────────────────────────────────────
EmailQueue.process(async (job) => {

    console.log('=====================================');
    console.log('📨 New Email Job Received');
    console.log('Job ID:', job.id);
    console.log('Job Data:', job.data);
    console.log('=====================================');

    try {
        const { user_id, mail_type, otp } = job.data;

        console.log('➡ Step 1: Validating job data...');
        if (!user_id || !mail_type) {
            throw new Error('Invalid email job data: user_id and mail_type are required.');
        }

        // Check template exists
        if (!emailTemplates[mail_type]) {
            throw new Error(`No email template found for mail_type: "${mail_type}". Add it to emailTemplates.`);
        }

        console.log('➡ Step 2: Fetching user...');
        const user = await User.findById(user_id);
        if (!user) throw new Error(`User not found for ID: ${user_id}`);
        console.log('Fetched User:', user.Email, user.Name);

        console.log('➡ Step 3: Building email content...');
        let templateResult;
console.log('mail_type:', mail_type,"user:",user,"otp:",otp);
        if (mail_type === 'orderConfirmOtp') {
            const order = await OrderModel.findOne({ userId: user_id }).sort({ createdAt: -1 });
            if (!order) throw new Error(`Order not found for user ID: ${user_id}`);
            templateResult = emailTemplates[mail_type](order);
        } else {
            if (otp === undefined || otp === null) {
                throw new Error(`OTP is required for mail_type: ${mail_type}`);
            }
            templateResult = emailTemplates[mail_type](user, otp);
        }

        console.log("templateResult",templateResult)

        const emailOptions = {
            from: `"Grand Masala" <${process.env.SMTP_MAIL}>`,
            email: user.Email,
            subject: templateResult.subject || subjectMap[mail_type] || 'Grand Masala Notification',
            message: templateResult.html,
        };

        console.log('➡ Step 4: Sending to:', user.Email, '| Subject:', emailOptions.subject);
        const sent = await sendEmail(emailOptions);

        if (!sent) throw new Error('sendEmail returned falsy — check SMTP config.');

        console.log(`✅ Email sent to: ${user.Email}`);
        job.progress(100);

    } catch (error) {
        console.error('=====================================');
        console.error('❌ ERROR PROCESSING EMAIL JOB');
        console.error('Error Message:', error.message);
        console.error('=====================================');
        throw error; // re-throw so Bull marks job as failed and retries
    }
});

// ─── Event listeners ──────────────────────────────────────────────
EmailQueue.on('completed', (job) => {
    console.log(`✅ Email job ${job.id} completed.`);
});

EmailQueue.on('failed', (job, err) => {
    console.error(`❌ Email job ${job.id} failed (userId: ${job.data.user_id}):`, err.message);
});

EmailQueue.on('error', (err) => {
    console.error('Email queue error:', err);
});

module.exports = EmailQueue;