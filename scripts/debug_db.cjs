
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lkmzgppvhqsubuhqaezd.supabase.co';
const supabaseKey = 'sb_publishable_6z6mPQpR7JegVcmuCJRPHg_QftCiNqL';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
    console.log("Checking jobs...");
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
            id, 
            total_amount, 
            paid_amount, 
            status,
            farmers (name)
        `)
        .gt('total_amount', 0);

    if (error) {
        console.error("Error:", error);
        return;
    }

    // Filter only Rajesh in JS to be safe
    const rajeshJobs = jobs.filter(j => j.farmers?.name.toLowerCase().includes('test'));

    console.log(`Found ${rajeshJobs.length} jobs for Rajesh.`);

    for (const job of rajeshJobs) {
        console.log(`\nJob ID: ${job.id}`);
        console.log(`Job Status: ${job.status}`);
        console.log(`Job Total: ${job.total_amount}`);
        console.log(`Job Paid: ${job.paid_amount}`);

        const { data: payments } = await supabase.from('payments').select('*').eq('job_id', job.id);

        console.log("Payments:");
        payments.forEach(p => console.log(` - ${p.date}: ${p.amount} (${p.method}) [${p.notes}]`));

        const sum = payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
        console.log(`CALCULATED SUM: ${sum}`);
        console.log(`IS PAID? ${sum >= job.total_amount}`);
    }
}

checkJobs();
