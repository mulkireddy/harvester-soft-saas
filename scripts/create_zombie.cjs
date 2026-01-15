
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lkmzgppvhqsubuhqaezd.supabase.co';
const supabaseKey = 'sb_publishable_6z6mPQpR7JegVcmuCJRPHg_QftCiNqL';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createZombieRecord() {
    console.log("Creating Zombie Record (Paid but Pending)...");

    // 1. Create Job with Pending status
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .insert([{
            farmer_id: '8a822005-592f-4537-8051-933e5c707525', // Using an existing farmer ID (Rajesh from previous logs) or fallback
            crop: 'Zombie Test Crop',
            billing_mode: 'acre',
            quantity: 1,
            rate: 1000,
            total_amount: 1000,
            paid_amount: 0,
            status: 'Pending',
            date: new Date().toISOString()
        }])
        .select()
        .single();

    if (jobError) {
        console.error("Job Error:", jobError);
        // Fallback: try to find any farmer
        const { data: farmers } = await supabase.from('farmers').select('id').limit(1);
        if (farmers && farmers.length > 0) {
            console.log("Retrying with farmer:", farmers[0].id);
            const { data: job2, error: jobError2 } = await supabase
                .from('jobs')
                .insert([{
                    farmer_id: farmers[0].id,
                    crop: 'Zombie Test Crop',
                    billing_mode: 'acre',
                    quantity: 1,
                    rate: 1000,
                    total_amount: 1000,
                    paid_amount: 0,
                    status: 'Pending',
                    date: new Date().toISOString()
                }])
                .select()
                .single();
            if (jobError2) console.error("Retry failed:", jobError2);
            else setupPayment(job2);
        }
        return;
    }

    await setupPayment(job);
}

async function setupPayment(job) {
    console.log(`Job Created: ${job.id}`);

    // 2. Add Payment (Full Amount)
    const { error: payError } = await supabase
        .from('payments')
        .insert([{
            job_id: job.id,
            amount: 1000,
            method: 'Cash',
            date: new Date().toISOString()
        }]);

    if (payError) console.error("Payment Error:", payError);
    else console.log("Payment Added (Trigger might update status to Paid, but we will force it back to Pending for test)");

    // 3. FORCE Status back to Pending to simulate the bug
    setTimeout(async () => {
        const { error: updateError } = await supabase
            .from('jobs')
            .update({ status: 'Pending', paid_amount: 0 }) // Lie about status
            .eq('id', job.id);

        if (updateError) console.error("Force Pending Error:", updateError);
        else console.log("Zombie Record Ready: IT IS FULLY PAID IN 'payments', BUT 'Pending' IN 'jobs'.");
    }, 2000); // Wait for trigger to finish first
}

createZombieRecord();
