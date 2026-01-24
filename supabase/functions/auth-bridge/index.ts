
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { idToken } = await req.json()

        if (!idToken) {
            return new Response(JSON.stringify({ error: 'Missing ID Token' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }

        // 1. Verify Firebase Token via Google Identity Toolkit API
        // We need the Firebase Web API Key for this. Users should set FIREBASE_WEB_API_KEY in Supabase Secrets.
        // Or we can just trust the token structure if we are lazy (NOT SECURE).
        // Let's use the API.
        const firebaseApiKey = Deno.env.get('FIREBASE_WEB_API_KEY');
        if (!firebaseApiKey) {
            throw new Error('Server missing FIREBASE_WEB_API_KEY secret');
        }

        const googleUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`;
        const googleRes = await fetch(googleUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken })
        });

        const googleData = await googleRes.json();

        if (googleData.error || !googleData.users || googleData.users.length === 0) {
            throw new Error('Invalid Firebase Token: ' + (googleData.error?.message || 'Unknown error'));
        }

        const userProfile = googleData.users[0];
        const phone = userProfile.phoneNumber; // Format: +919876543210

        if (!phone) {
            throw new Error('Firebase user has no phone number');
        }

        // 2. Setup Supabase Admin
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 3. Find or Create User in Supabase
        // We Map Phone -> Email (phone@harvester.app) for consistency
        const cleanPhone = phone.replace('+', ''); // 919876543210
        const fakeEmail = `${cleanPhone}@harvester.app`;

        // Generate a temporary strong password
        const tempPassword = crypto.randomUUID() + crypto.randomUUID();

        // Check if user exists (by email, since we use fake email for phone users)
        // Note: APIs usually allow checking by phone too if using Phone Auth, but we are simulating it.
        // Let's try updates first.

        // Attempt to Update (will fail if not found) doesn't give error, just count 0? 
        // `updateUserById` needs ID. `listUsers` needs permissions.

        // Strategy: Try Sign In Logic. 
        // Actually, `admin.createUser` returns error if exists.

        let userId = '';

        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email: fakeEmail,
            password: tempPassword,
            email_confirm: true,
            user_metadata: { phone: phone, phone_verified: true }
        });

        if (createError && createError.message.includes('already been registered')) {
            // User exists, find their ID to update password
            // We can't query `auth.users` easily without SQL or listing.
            // But `createUser` failed, so we know they exist.
            // We can just `admin.updateUserById` if we had the ID.
            // Since we don't have ID, we rely on the fact that `admin.listUsers` can filter? No.

            // WORKAROUND: We can use a direct SQL query via Postgrest if we have access to `auth.users`? No, usually blocked.
            // BUT, `supabase-js` Admin bundle has `listUsers`.
            // Or simpler: Just use `signInWithOtp`? No we want password flow.

            // Ok, we must get the User ID.
            // `admin.listUsers` is the way, but might be slow if millions of users. For 1000 users it's fine? 
            // No, `listUsers` doesn't filter by email well in all versions.

            // Better: We stored the mapping.
            // Actually, let's try to Sign In with the OLD password? We don't know it.
            // Let's use `admin.deleteUser`? No!

            // Wait, `admin.updateUserById` needs id.
            // Can we get ID from email?
            // `rpc` call?

            // Let's use a stored procedure if needed, OR just `admin.listUsers` with search?
            // `supabase.auth.admin.listUsers()` does not support email filter in JS client usually unless updated.

            // BEST HACK: 
            // We will create a `public.profiles` table (which likely exists or we create it) that maps Email -> UUID.
            // Or we just assume we can use `GENERATE_LINK` to get the user?

            // Let's try `supabase.auth.admin.generateLink({ type: 'magiclink', email: fakeEmail })`.
            // This returns the User User object in `data.user`!

            const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
                type: 'magiclink',
                email: fakeEmail
            });

            if (linkError) throw linkError;

            userId = linkData.user.id;

            // Now update password
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                userId,
                { password: tempPassword }
            );

            if (updateError) throw updateError;

        } else if (createError) {
            throw createError;
        } else {
            userId = newUser.user.id;
        }

        // 4. Return the Credentials
        return new Response(
            JSON.stringify({
                email: fakeEmail,
                password: tempPassword,
                success: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error(error)
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
})
