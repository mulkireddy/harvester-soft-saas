
import { createClient } from '@supabase/supabase-js'

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lkmzgppvhqsubuhqaezd.supabase.co'
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_6z6mPQpR7JegVcmuCJRPHg_QftCiNqL'

const NUM_CONCURRENT_USERS = 100

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Error: valid Supabase URL and Key are required.')
    process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function getAutoSession() {
    const timestamp = Date.now()
    const email = `loadtest_auto_${timestamp}@harvester.app`
    const password = `pass_${timestamp}`

    console.log(`[Auth] Attempting to create temp user: ${email}`)

    // 1. Try generic Sign Up
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password
    })

    if (signUpError) {
        console.error(`[Auth] SignUp failed: ${signUpError.message}`)
        return null
    }

    if (signUpData.session) {
        console.log('[Auth] SignUp successful! Session obtained.')
        return signUpData.session
    } else if (signUpData.user) {
        console.warn('[Auth] User created, but NO SESSION returned.')
        console.warn('[Auth] This usually means "Confirm Email" is enabled in Supabase.')
        console.warn('[Auth] Cannot proceed with authorized load test without a confirmed user.')
        return null
    }

    return null
}

async function simulateUserEntry(session, id) {
    const startTime = Date.now()
    const timestamp = Date.now()

    // Data to be inserted
    const farmerData = {
        name: `LoadTest Farmer ${id}-${timestamp}`,
        mobile: `99${id.toString().padStart(3, '0')}${Math.floor(Math.random() * 100000)}`,
        place: `Test Village ${id}`
    }

    try {
        // Authenticated Client setup
        // We reuse the main client but set the session if available
        if (session) {
            await supabase.auth.setSession({
                access_token: session.access_token,
                refresh_token: session.refresh_token
            })
        }

        // 1. Create Farmer
        const { data: farmer, error: farmerError } = await supabase
            .from('farmers')
            .insert([farmerData])
            .select()
            .single()

        if (farmerError) throw new Error(`Farmer Insert: ${farmerError.message}`)

        // 2. Create Job
        const jobData = {
            farmer_id: farmer.id,
            crop: 'Corn',
            billing_mode: 'acre',
            quantity: (Math.random() * 10).toFixed(1),
            rate: 1200,
            total_amount: 5000,
            paid_amount: 0,
            status: 'Pending',
            date: new Date().toISOString()
        }

        const { data: job, error: jobError } = await supabase
            .from('jobs')
            .insert([jobData])
            .select()
            .single()

        if (jobError) throw new Error(`Job Insert: ${jobError.message}`)

        return { id, success: true, duration: Date.now() - startTime }

    } catch (err) {
        return { id, success: false, error: err.message, duration: Date.now() - startTime }
    }
}

async function runLoadTest() {
    console.log(`\n=== Starting Load Test: ${NUM_CONCURRENT_USERS} Concurrent Users ===`)

    // 1. Auth Phase
    let session = null
    if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
        console.log(`[Auth] Using provided credentials: ${process.env.TEST_EMAIL}`)
        const { data, error } = await supabase.auth.signInWithPassword({
            email: process.env.TEST_EMAIL,
            password: process.env.TEST_PASSWORD
        })
        if (!error && data.session) session = data.session
        else console.error(`[Auth] Failed: ${error?.message}`)
    } else {
        session = await getAutoSession()
    }

    if (!session) {
        console.log('\n!!! WARNING: RUNNING WITHOUT AUTHENTICATION !!!')
        console.log('Expect "row-level security" errors if RLS is enabled.')
        console.log('To run a real test, disable Email Confirmation or provide credentials.')
        console.log('---------------------------------------------------------------\n')
    }

    // 2. Load Phase
    console.log('Launching requests...')
    const start = Date.now()

    const promises = []
    for (let i = 0; i < NUM_CONCURRENT_USERS; i++) {
        promises.push(simulateUserEntry(session, i))
    }

    const results = await Promise.all(promises)
    const totalTime = (Date.now() - start) / 1000

    // 3. Analysis Phase
    const successes = results.filter(r => r.success)
    const failures = results.filter(r => !r.success)

    console.log('\n=== Load Test Summary ===')
    console.log(`Total Requests: ${NUM_CONCURRENT_USERS}`)
    console.log(`Duration:       ${totalTime.toFixed(2)} seconds`)
    console.log(`Throughput:     ${(NUM_CONCURRENT_USERS / totalTime).toFixed(2)} requests/sec`)
    console.log(`Successful:     ${successes.length}`)
    console.log(`Failed:         ${failures.length}`)

    if (failures.length > 0) {
        console.log('\n--- Common Errors ---')
        const errors = failures.map(f => f.error)
        const uniqueErrors = [...new Set(errors)]
        uniqueErrors.forEach(e => {
            const count = errors.filter(err => err === e).length
            console.log(`[${count}x]: ${e}`)
        })
    }
}

runLoadTest()
