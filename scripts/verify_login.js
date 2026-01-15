const { createClient } = require('@supabase/supabase-js');

// Config from your .env
const SUPABASE_URL = 'https://lkmzgppvhqsubuhqaezd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6z6mPQpR7JegVcmuCJRPHg_QftCiNqL'; // Anon Key

if (process.argv.length < 4) {
    console.log('Usage: node scripts/verify_login.js <email> <password>');
    process.exit(1);
}

const email = process.argv[2];
const password = process.argv[3];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testLogin() {
    console.log('--- Testing Auth ---');
    console.log(`URL: ${SUPABASE_URL}`);
    console.log(`User: ${email}`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
    });

    if (error) {
        console.error('FAILED:');
        console.error(error.message);
        if (error.message.includes('Email not confirmed')) {
            console.log('HINT: Use Supabase Dashboard -> Users -> Confirm User');
        }
    } else {
        console.log('SUCCESS!');
        console.log(`User ID: ${data.user.id}`);
        console.log('Email Confirmed At:', data.user.email_confirmed_at);
        console.log('Last Sign In:', data.user.last_sign_in_at);
        console.log('--- Credentials are VALID ---');
    }
}

testLogin();
