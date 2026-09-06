import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([^#=\s]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing URL or Service Key in .env.local");
  process.exit(1);
}

// Admin client using service role to bypass email confirmation and manage auth users
const supabaseAdmin = createClient(url, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log("Using Admin Client...");

const email = 'admin@noor-al-eman.local';
const password = 'Password123'; // Secure but simple password
const name = 'المدير العام';
const username = 'admin';

// 1. Get existing user or create one
console.log(`Checking if user ${email} exists...`);
const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
if (listError) {
  console.error("Error listing users:", listError);
  process.exit(1);
}

let authUser = users.find(u => u.email === email);

if (authUser) {
  console.log(`User ${email} already exists with ID: ${authUser.id}. Updating password and confirming email...`);
  const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    authUser.id,
    {
      password: password,
      email_confirm: true
    }
  );
  if (updateError) {
    console.error("Error updating user:", updateError);
    process.exit(1);
  }
  authUser = updateData.user;
  console.log("User updated successfully.");
} else {
  console.log(`Creating user ${email} with confirmed status...`);
  const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true,
    user_metadata: { name: name }
  });
  if (createError) {
    console.error("Error creating user:", createError);
    process.exit(1);
  }
  authUser = createData.user;
  console.log(`User created successfully with ID: ${authUser.id}`);
}

// 2. Ensure the row exists in public.users
console.log(`Ensuring profile exists in public.users for ID: ${authUser.id}...`);
const { data: profile, error: selectError } = await supabaseAdmin
  .from('users')
  .select('id')
  .eq('id', authUser.id)
  .maybeSingle();

if (selectError) {
  console.error("Error reading public.users:", selectError);
}

if (profile) {
  console.log("Profile already exists in public.users. Updating role to admin...");
  const { error: updateProfileError } = await supabaseAdmin
    .from('users')
    .update({
      role: 'admin',
      name: name,
      username: username,
      is_active: true
    })
    .eq('id', authUser.id);
  if (updateProfileError) {
    console.error("Error updating profile:", updateProfileError);
  } else {
    console.log("Profile updated successfully.");
  }
} else {
  console.log("Profile does not exist in public.users. Inserting one...");
  const { error: insertProfileError } = await supabaseAdmin
    .from('users')
    .insert({
      id: authUser.id,
      username: username,
      name: name,
      role: 'admin',
      is_active: true
    });
  if (insertProfileError) {
    console.error("Error inserting profile:", insertProfileError);
  } else {
    console.log("Profile inserted successfully.");
  }
}

console.log("\n=================================");
console.log(`SETUP COMPLETE!`);
console.log(`Username: ${username}`);
console.log(`Password: ${password}`);
console.log(`Email: ${email}`);
console.log("=================================");
