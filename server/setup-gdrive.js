#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupGoogleDrive() {
  console.log('🔧 Google Drive Setup Helper\n');
  
  // Check if credentials file exists
  const credentialsPath = path.join(__dirname, 'google-credentials.json');
  
  try {
    const credentialsExist = await fs.access(credentialsPath).then(() => true).catch(() => false);
    
    if (!credentialsExist) {
      console.log('❌ Google Drive credentials not found!');
      console.log('\n📋 Setup Instructions:');
      console.log('1. Go to https://console.cloud.google.com/');
      console.log('2. Create a new project or select existing');
      console.log('3. Enable the Google Drive API');
      console.log('4. Go to IAM & Admin > Service Accounts');
      console.log('5. Create a new service account');
      console.log('6. Download the JSON credentials file');
      console.log(`7. Save it as: ${credentialsPath}`);
      console.log('\n🔗 Share Drive Access:');
      console.log('8. Copy the service account email from the JSON file');
      console.log('9. Share your Google Drive folder(s) with this email');
      console.log('10. Give it "Viewer" permissions\n');
      
      // Create example credentials file
      const exampleCredentials = {
        "type": "service_account",
        "project_id": "your-project-id",
        "private_key_id": "your-private-key-id",
        "private_key": "-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY\\n-----END PRIVATE KEY-----\\n",
        "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
        "client_id": "your-client-id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project.iam.gserviceaccount.com"
      };
      
      await fs.writeFile(
        path.join(__dirname, 'google-credentials-example.json'),
        JSON.stringify(exampleCredentials, null, 2)
      );
      
      console.log('📄 Created google-credentials-example.json as a template');
      console.log('   Replace the placeholder values with your actual credentials\n');
      
      return false;
    }
    
    // Validate credentials file
    console.log('✅ Found google-credentials.json');
    const credentialsContent = await fs.readFile(credentialsPath, 'utf8');
    const credentials = JSON.parse(credentialsContent);
    
    // Check required fields
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    const missingFields = requiredFields.filter(field => !credentials[field]);
    
    if (missingFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    console.log(`📧 Service Account: ${credentials.client_email}`);
    console.log(`🏗️  Project ID: ${credentials.project_id}`);
    
    // Check environment variable
    const envPath = path.join(__dirname, '.env');
    let envContent = '';
    
    try {
      envContent = await fs.readFile(envPath, 'utf8');
    } catch (error) {
      console.log('❌ .env file not found');
      return false;
    }
    
    if (!envContent.includes('GOOGLE_CREDENTIALS_PATH')) {
      console.log('⚠️  Adding GOOGLE_CREDENTIALS_PATH to .env');
      const newEnvContent = envContent + `\\nGOOGLE_CREDENTIALS_PATH=./google-credentials.json\\n`;
      await fs.writeFile(envPath, newEnvContent);
    } else {
      console.log('✅ GOOGLE_CREDENTIALS_PATH configured in .env');
    }
    
    console.log('\n🎉 Google Drive setup appears to be complete!');
    console.log('\n🔗 Next Steps:');
    console.log('1. Make sure you\'ve shared your Google Drive with:');
    console.log(`   ${credentials.client_email}`);
    console.log('2. Start the server: npm run dev:server');
    console.log('3. Test the integration by clicking the cloud button in the UI');
    
    return true;
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Run setup if called directly
if (process.argv[1] === __filename) {
  setupGoogleDrive().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default setupGoogleDrive;