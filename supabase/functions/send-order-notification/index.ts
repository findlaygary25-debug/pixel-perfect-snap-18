import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderNotificationRequest {
  customerEmail: string;
  customerName: string;
  orderId: string;
  status: string;
  trackingNumber?: string;
  orderTotal: number;
  items: Array<{
    title: string;
    quantity: number;
    price: number;
  }>;
}

const getStatusMessage = (status: string): string => {
  switch (status) {
    case "pending":
      return "Your order has been received and is being processed.";
    case "processing":
      return "Your order is being prepared for shipment.";
    case "completed":
      return "Your order has been delivered!";
    case "cancelled":
      return "Your order has been cancelled.";
    default:
      return "Your order status has been updated.";
  }
};

const getEmailSubject = (status: string): string => {
  switch (status) {
    case "pending":
      return "Order Confirmation";
    case "processing":
      return "Order Being Prepared";
    case "completed":
      return "Order Delivered";
    case "cancelled":
      return "Order Cancelled";
    default:
      return "Order Update";
  }
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      customerEmail,
      customerName,
      orderId,
      status,
      trackingNumber,
      orderTotal,
      items,
    }: OrderNotificationRequest = await req.json();

    console.log("Sending order notification:", { customerEmail, orderId, status });

    const itemsHtml = items
      .map(
        (item) => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #eee;">
            <strong>${item.title}</strong>
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">
            $${item.price.toFixed(2)}
          </td>
        </tr>
      `
      )
      .join("");

    const trackingHtml = trackingNumber
      ? `
        <div style="background-color: #f0f9ff; padding: 16px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #3b82f6;">
          <h3 style="margin: 0 0 8px 0; color: #1e40af; font-size: 16px;">📦 Tracking Information</h3>
          <p style="margin: 0; color: #1e3a8a; font-size: 18px; font-weight: bold; font-family: monospace;">
            ${trackingNumber}
          </p>
        </div>
      `
      : "";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🔥 Voice2Fire</h1>
            <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 16px;">${getEmailSubject(status)}</p>
          </div>
          
          <div style="background: white; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; margin-bottom: 24px;">Hi ${customerName},</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 15px; color: #374151;">
                ${getStatusMessage(status)}
              </p>
            </div>

            ${trackingHtml}
            
            <div style="margin: 24px 0;">
              <h2 style="font-size: 18px; margin-bottom: 16px; color: #111827;">Order Details</h2>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Order ID: <strong style="color: #111827;">#${orderId.slice(0, 8)}</strong>
              </p>
              <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px;">
                Status: <span style="background-color: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 12px; font-weight: 600;">${status.toUpperCase()}</span>
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 16px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">Item</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-size: 14px;">Price</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2" style="padding: 16px 12px; text-align: right; font-weight: bold; font-size: 16px;">Total:</td>
                    <td style="padding: 16px 12px; text-align: right; font-weight: bold; font-size: 18px; color: #059669;">$${orderTotal.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 14px;">
                Questions? Contact us at support@voice2fire.com
              </p>
            </div>
          </div>
          
          <div style="text-align: center; padding: 24px; color: #9ca3af; font-size: 12px;">
            <p style="margin: 0;">© ${new Date().getFullYear()} Voice2Fire. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Voice2Fire <onboarding@resend.dev>",
      to: [customerEmail],
      subject: `${getEmailSubject(status)} - Order #${orderId.slice(0, 8)}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
