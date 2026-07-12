import { createClient } from "npm:@supabase/supabase-js@2";

const jsonHeaders = {
  "Content-Type": "application/json; charset=utf-8"
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function normalizeEgyptPhone(value = ""): string {
  let digits = String(value).replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(2);
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const expectedSecret = Deno.env.get("WHATSAPP_WEBHOOK_SECRET");
  const receivedSecret = request.headers.get("x-webhook-secret");

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const payload = await request.json();
    const providerId = payload?.record?.id || payload?.provider_id;

    if (!providerId) {
      return jsonResponse({ error: "provider_id is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const secretKeysRaw = Deno.env.get("SUPABASE_SECRET_KEYS");
    const legacyServiceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const secretKey = secretKeysRaw
      ? JSON.parse(secretKeysRaw)?.default
      : legacyServiceRole;

    if (!supabaseUrl || !secretKey) {
      throw new Error("Supabase server credentials are missing");
    }

    const supabaseAdmin = createClient(supabaseUrl, secretKey, {
      auth: { persistSession: false }
    });

    const { data: provider, error: providerError } = await supabaseAdmin
      .from("providers")
      .select("id,name,phone,whatsapp,service_name,status")
      .eq("id", providerId)
      .single();

    if (providerError || !provider) {
      throw providerError || new Error("Provider not found");
    }

    if (provider.status !== "approved") {
      return jsonResponse({ skipped: true, reason: "Provider is not approved" });
    }

    const recipient = normalizeEgyptPhone(provider.whatsapp || provider.phone);
    if (!/^20(10|11|12|15)\d{8}$/.test(recipient)) {
      return jsonResponse({ skipped: true, reason: "Invalid Egyptian WhatsApp number" });
    }

    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
    const phoneNumberId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
    const templateName = Deno.env.get("WHATSAPP_TEMPLATE_NAME") || "service_added_confirmation";
    const templateLanguage = Deno.env.get("WHATSAPP_TEMPLATE_LANGUAGE") || "ar";
    const graphVersion = Deno.env.get("WHATSAPP_GRAPH_VERSION");

    if (!accessToken || !phoneNumberId || !graphVersion) {
      throw new Error("WhatsApp Cloud API secrets are incomplete");
    }

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: recipient,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLanguage },
            components: [
              {
                type: "body",
                parameters: [
                  { type: "text", text: provider.name },
                  { type: "text", text: provider.service_name }
                ]
              }
            ]
          }
        })
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error("WhatsApp Cloud API error:", result);
      return jsonResponse({ error: "WhatsApp API rejected the message", details: result }, 502);
    }

    return jsonResponse({ success: true, provider_id: provider.id, result });
  } catch (error) {
    console.error("WhatsApp confirmation failed:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});
