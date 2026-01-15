
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lkmzgppvhqsubuhqaezd.supabase.co';
const supabaseKey = 'sb_publishable_6z6mPQpR7JegVcmuCJRPHg_QftCiNqL';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHarsha() {
    console.log("Checking Harsha...");
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
            id, 
            total_amount, 
            paid_amount, 
            status,
            farmers (name)
        `)
        .ilike('farmers.name', '%harsha%');

    if (error) {
        console.error("Error:", error);
        return;
    }

    for (const job of jobs) {
        console.log(`\nJob ID: ${job.id}`);
        console.log(`Farmer: ${job.farmers?.name}`);
        console.log(`Status in DB: ${job.status}`);
        console.log(`Total Amount: ${job.total_amount}`);
        console.log(`Paid Amount in DB: ${job.paid_amount}`);

        const { data: payments } = await supabase.from('payments').select('*').eq('job_id', job.id);
        const sum = payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;

        console.log(`Calculated Payment Sum: ${sum}`);
        const diff = job.total_amount - sum;
        console.log(`Difference: ${diff}`);
        console.log(`Should be Paid? ${sum >= job.total_amount - 1}`);
    }
}

checkHarsha();
