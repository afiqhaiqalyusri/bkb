package com.bkb.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final EmailTemplateService emailTemplateService;

    @Value("${app.mail.from}")
    private String fromAddress;

    @Value("${app.mail.from-name}")
    private String fromName;

    // ─── OTP Verification Email ───────────────────────────────

    @Async
    public void sendVerificationOtp(String toEmail, String name, String otp) {
        String subject = "BKB — Your Email Verification Code";
        String html = emailTemplateService.buildOtpEmailHtml(name, otp);
        sendHtmlEmail(toEmail, subject, html);
    }

    // ─── Password Reset Email ─────────────────────────────────

    @Async
    public void sendPasswordResetEmail(String toEmail, String name, String resetToken, String baseUrl) {
        String resetLink = baseUrl + "/reset-password?token=" + resetToken;
        String subject = "BKB — Password Reset Request";
        String html = emailTemplateService.buildPasswordResetEmailHtml(name, resetLink);
        sendHtmlEmail(toEmail, subject, html);
    }

    // ─── Scheduled Order Email ────────────────────────────────

    @Async
    public void sendOrderScheduledEmail(String toEmail, String name, String orderNumber, java.time.LocalDateTime scheduledTime, java.math.BigDecimal total) {
        String subject = "BKB — Order Scheduled Successfully #" + orderNumber;
        String html = emailTemplateService.buildOrderScheduledEmailHtml(name, orderNumber, scheduledTime, total);
        sendHtmlEmail(toEmail, subject, html);
    }

    // ─── Kitchen Queue Email ──────────────────────────────────

    @Async
    public void sendOrderEnteredQueueEmail(String toEmail, String name, String orderNumber) {
        String subject = "BKB — Order Entered Kitchen Queue #" + orderNumber;
        String html = emailTemplateService.buildOrderEnteredQueueEmailHtml(name, orderNumber);
        sendHtmlEmail(toEmail, subject, html);
    }

    // ─── Payment Success Email ────────────────────────────────
    @Async
    public void sendPaymentSuccessEmail(String toEmail, String name, String orderNumber, java.math.BigDecimal amount) {
        String subject = "BKB — Payment Received for Order #" + orderNumber;
        String html = emailTemplateService.buildPaymentSuccessEmailHtml(name, orderNumber, amount);
        sendHtmlEmail(toEmail, subject, html);
    }

    // ─── Order Ready Email ────────────────────────────────────

    @Async
    public void sendOrderReadyEmail(String toEmail, String name, String orderNumber) {
        String subject = "BKB — Your Order is Ready! #" + orderNumber;
        String html = emailTemplateService.buildOrderReadyEmailHtml(name, orderNumber);
        sendHtmlEmail(toEmail, subject, html);
    }

    // ─── Order Completed Email ────────────────────────────────

    @Async
    public void sendOrderCompletedEmail(String toEmail, String name, String orderNumber) {
        String subject = "BKB — Order Completed! Thank you! #" + orderNumber;
        String html = emailTemplateService.buildOrderCompletedEmailHtml(name, orderNumber);
        sendHtmlEmail(toEmail, subject, html);
    }

    // ─── Core Send Method ─────────────────────────────────────

    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent successfully to: {}", to);
        } catch (MessagingException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error sending email to {}: {}", to, e.getMessage());
        }
    }
}
