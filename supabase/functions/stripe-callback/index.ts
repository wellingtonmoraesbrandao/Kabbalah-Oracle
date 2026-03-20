import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import Stripe from "https://esm.sh/stripe@14.16.0?target=deno";

serve(async (req) => {
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("session_id");

  // Fallback URL if something fails
  const origin = req.headers.get("origin") || Deno.env.get("PUBLIC_SITE_URL") || "http://localhost:5173";

  if (!sessionId) {
    return Response.redirect(`${origin}?error=no_session_id`, 302);
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const email = session.customer_details?.email;
    const name = session.customer_details?.name;

    if (!email) {
      return Response.redirect(`${origin}?error=no_email`, 302);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Ensure user exists
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    let userExists = users.some((u) => u.email === email);

    if (!userExists) {
        // Create user
        await supabaseAdmin.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: { full_name: name || "Usuário Premium" }
        });
    }

    // Generate action link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: email,
      options: { redirectTo: origin }
    });

    if (linkError) throw linkError;

    // Use a 302 redirect so the browser fetches the action link and completes login seamlessly
    return Response.redirect(linkData.properties.action_link, 302);
  } catch (err: any) {
    console.error("Stripe Callback error:", err.message);
    return Response.redirect(`${origin}?error=callback_failed`, 302);
  }
});
