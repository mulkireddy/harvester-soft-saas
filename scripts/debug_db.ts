
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkJobs() {
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
            id, 
            total_amount, 
            paid_amount, 
            status,
            farmers (name)
        `)
        .gt('total_amount', 0); // Get all jobs

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Current Jobs State:");
    console.table(jobs.map(j => ({
        Name: j.farmers?.name,
        Total: j.total_amount,
        Paid: j.paid_amount,
        Status: j.status
    })));

    // Also check payments for these jobs
    for (const job of jobs) {
        const { data: payments } = await supabase.from('payments').select('*').eq('job_id', job.id);
        const sum = payments?.reduce((acc, p) => acc + Number(p.amount), 0) || 0;
        console.log(`Job for ${job.farmers?.name}: DB Paid=${job.paid_amount}, Calc Sum=${sum}. Match? ${job.paid_amount == sum}`);
    }
}

checkJobs();
