package com.bkb.service;

import org.springframework.stereotype.Service;

@Service
public class EmailTemplateService {

    public String buildOtpEmailHtml(String name, String otp) {
        String firstName = name != null ? name.split(" ")[0] : "there";
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Email Verification</title>
                </head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px;">
                  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%%, #16213e 100%%); padding: 32px 40px; text-align: center;">
                      <h1 style="color: #f5a623; margin: 0; font-size: 28px; letter-spacing: 2px;">🍔 BKB</h1>
                      <p style="color: #a0a8b0; margin: 8px 0 0; font-size: 14px;">Bukan Kedai Burger</p>
                    </div>
                    <div style="padding: 40px;">
                      <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Verify Your Email</h2>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">Hi <strong>%s</strong>,</p>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 28px;">
                        Use the verification code below to complete your BKB account registration.
                        This code expires in <strong>10 minutes</strong>.
                      </p>
                      <div style="background: #f0f4ff; border: 2px dashed #4f6ef7; border-radius: 10px; padding: 24px; text-align: center; margin: 0 0 28px;">
                        <div style="font-size: 42px; font-weight: 900; letter-spacing: 10px; color: #1a1a2e; font-family: 'Courier New', monospace;">%s</div>
                        <p style="color: #888; font-size: 13px; margin: 12px 0 0;">One-time code &middot; expires in 10 minutes</p>
                      </div>
                      <p style="color: #888; font-size: 13px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin: 0;">
                        If you didn't create a BKB account, you can safely ignore this email.
                        Do not share this code with anyone.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(firstName, otp);
    }

    public String buildPasswordResetEmailHtml(String name, String resetLink) {
        String firstName = name != null ? name.split(" ")[0] : "there";
        return """
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Password Reset</title>
                </head>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px;">
                  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%%, #16213e 100%%); padding: 32px 40px; text-align: center;">
                      <h1 style="color: #f5a623; margin: 0; font-size: 28px; letter-spacing: 2px;">🍔 BKB</h1>
                      <p style="color: #a0a8b0; margin: 8px 0 0; font-size: 14px;">Bukan Kedai Burger</p>
                    </div>
                    <div style="padding: 40px;">
                      <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Reset Your Password</h2>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">Hi <strong>%s</strong>,</p>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 28px;">
                        We received a request to reset your BKB account password.
                        Click the button below to proceed. This link expires in <strong>15 minutes</strong>.
                      </p>
                      <div style="text-align: center; margin: 0 0 28px;">
                        <a href="%s"
                           style="display: inline-block; background: #f5a623; color: #1a1a2e; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                          Reset My Password
                        </a>
                      </div>
                      <p style="color: #888; font-size: 13px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin: 0;">
                        If you didn't request a password reset, ignore this email. Your password will not change.
                        This link will expire after 15 minutes and can only be used once.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(firstName, resetLink);
    }

    public String buildOrderScheduledEmailHtml(String name, String orderNumber, java.time.LocalDateTime scheduledTime, java.math.BigDecimal total) {
        String firstName = name != null ? name.split(" ")[0] : "there";
        String timeStr = scheduledTime != null ? scheduledTime.format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd hh:mm a")) : "N/A";
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px;">
                  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%%, #16213e 100%%); padding: 32px 40px; text-align: center;">
                      <h1 style="color: #f5a623; margin: 0; font-size: 28px; letter-spacing: 2px;">🍔 BKB</h1>
                      <p style="color: #a0a8b0; margin: 8px 0 0; font-size: 14px;">Bukan Kedai Burger</p>
                    </div>
                    <div style="padding: 40px;">
                      <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Order Scheduled Successfully!</h2>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">Hi <strong>%s</strong>,</p>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 28px;">
                        Your scheduled order <strong>#%s</strong> has been placed successfully. It will remain on hold and automatically enter the kitchen queue closer to your pickup time.
                      </p>
                      <div style="background: #f0f4ff; border-radius: 10px; padding: 20px; margin: 0 0 28px;">
                        <p style="margin: 0 0 8px; color: #555;"><strong>Order Number:</strong> #%s</p>
                        <p style="margin: 0 0 8px; color: #555;"><strong>Scheduled Pickup Time:</strong> %s</p>
                        <p style="margin: 0; color: #555;"><strong>Total:</strong> RM %s</p>
                      </div>
                      <p style="color: #888; font-size: 13px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin: 0;">
                        Note: You can cancel this order only if it is more than 30 minutes before the scheduled pickup time.
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(firstName, orderNumber, orderNumber, timeStr, total.toString());
    }

    public String buildOrderEnteredQueueEmailHtml(String name, String orderNumber) {
        String firstName = name != null ? name.split(" ")[0] : "there";
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px;">
                  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%%, #16213e 100%%); padding: 32px 40px; text-align: center;">
                      <h1 style="color: #f5a623; margin: 0; font-size: 28px; letter-spacing: 2px;">🍔 BKB</h1>
                      <p style="color: #a0a8b0; margin: 8px 0 0; font-size: 14px;">Bukan Kedai Burger</p>
                    </div>
                    <div style="padding: 40px;">
                      <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Order Entered Kitchen Queue</h2>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">Hi <strong>%s</strong>,</p>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 28px;">
                        Good news! Your order <strong>#%s</strong> has officially entered our kitchen queue and our chefs are preparing to grill your burgers.
                      </p>
                      <p style="color: #888; font-size: 13px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin: 0;">
                        We will notify you once it's ready for pickup. Thank you for dining with BKB!
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(firstName, orderNumber);
    }

    public String buildOrderReadyEmailHtml(String name, String orderNumber) {
        String firstName = name != null ? name.split(" ")[0] : "there";
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px;">
                  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%%, #16213e 100%%); padding: 32px 40px; text-align: center;">
                      <h1 style="color: #f5a623; margin: 0; font-size: 28px; letter-spacing: 2px;">🍔 BKB</h1>
                      <p style="color: #a0a8b0; margin: 8px 0 0; font-size: 14px;">Bukan Kedai Burger</p>
                    </div>
                    <div style="padding: 40px;">
                      <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Your Order is Ready! 🎉</h2>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">Hi <strong>%s</strong>,</p>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 28px;">
                        Your order <strong>#%s</strong> is fresh off the grill and ready for pickup at our counter.
                      </p>
                      <div style="background: #e6fcf5; border: 2px solid #20c997; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 28px;">
                        <span style="font-size: 18px; font-weight: 700; color: #0ca678;">Ready for Collection</span>
                      </div>
                      <p style="color: #888; font-size: 13px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin: 0;">
                        Please show your order number #%s to our staff when collecting. Enjoy your meal!
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(firstName, orderNumber, orderNumber);
    }
    public String buildPaymentSuccessEmailHtml(String name, String orderNumber, java.math.BigDecimal amount) {
        String firstName = name != null ? name.split(" ")[0] : "there";
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px;">
                  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%%, #16213e 100%%); padding: 32px 40px; text-align: center;">
                      <h1 style="color: #f5a623; margin: 0; font-size: 28px; letter-spacing: 2px;">🍔 BKB</h1>
                      <p style="color: #a0a8b0; margin: 8px 0 0; font-size: 14px;">Bukan Kedai Burger</p>
                    </div>
                    <div style="padding: 40px;">
                      <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Payment Successful!</h2>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">Hi <strong>%s</strong>,</p>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 28px;">
                        We have successfully received your payment of <strong>RM %s</strong> for order <strong>#%s</strong>.
                      </p>
                      <p style="color: #888; font-size: 13px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin: 0;">
                        Your order is now accepted and will be prepared soon. Thank you for dining with BKB!
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(firstName, amount.toString(), orderNumber);
    }

    public String buildOrderCompletedEmailHtml(String name, String orderNumber) {
        String firstName = name != null ? name.split(" ")[0] : "there";
        return """
                <!DOCTYPE html>
                <html>
                <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f8f9fa; margin: 0; padding: 20px;">
                  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    <div style="background: linear-gradient(135deg, #1a1a2e 0%%, #16213e 100%%); padding: 32px 40px; text-align: center;">
                      <h1 style="color: #f5a623; margin: 0; font-size: 28px; letter-spacing: 2px;">🍔 BKB</h1>
                      <p style="color: #a0a8b0; margin: 8px 0 0; font-size: 14px;">Bukan Kedai Burger</p>
                    </div>
                    <div style="padding: 40px;">
                      <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Enjoy Your Meal!</h2>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">Hi <strong>%s</strong>,</p>
                      <p style="color: #555; line-height: 1.6; margin: 0 0 28px;">
                        Your order <strong>#%s</strong> has been completed. We hope you enjoy your food!
                      </p>
                      <p style="color: #888; font-size: 13px; line-height: 1.6; border-top: 1px solid #eee; padding-top: 20px; margin: 0;">
                        Thank you for choosing BKB. We look forward to serving you again soon!
                      </p>
                    </div>
                  </div>
                </body>
                </html>
                """.formatted(firstName, orderNumber);
    }
}
