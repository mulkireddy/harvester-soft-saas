
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lkmzgppvhqsubuhqaezd.supabase.co';
const supabaseKey = 'sb_publishable_6z6mPQpR7JegVcmuCJRPHg_QftCiNqL';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPolicies() {
    console.log("Attempting to UPDATE a job...");

    // Pick any job
    const { data: jobs } = await supabase.from('jobs').select('id').limit(1);
    const jobId = jobs[0].id;

    const { data, error } = await supabase
        .from('jobs')
        .update({ notes: 'test update' }) // Try updating a dummy field (or just anything)
        .eq('id', jobId)
        .select();

    if (error) {
        console.error("UPDATE FAILED! RLS Likely blocking.");
        console.error(error);
    } else {
        console.log("UPDATE Success!");
    }
}

checkPolicies();
