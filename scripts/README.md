# Admin Creation Script

This script provides a secure way to create an admin user in the system.

## Usage

You can run the script in two ways:

1. Using default values:
```bash
node scripts/createAdmin.js
```

2. Providing custom values:
```bash
node scripts/createAdmin.js "Admin Name" "admin@yourdomain.com" "+1234567890" "YourSecurePassword" "ADMIN001"
```

## Parameters (in transfer)

1. name
2. email
3. phone
4. password
5. identityNumber

## Security Best Practices

1. Run this script only in a secure environment
2. Change the default password immediately after first login
3. Delete or move the script to a secure location after creating the admin
4. Make sure to use a strong password
5. Keep the admin credentials secure

## Default Values (for development only)

```
name: "Admin User"
email: "admin@example.com"
phone: "+1234567890"
password: "Admin@123456"
identityNumber: "ADMIN001"
```

⚠️ **WARNING**: Never use the default values in production. Always provide custom secure values when creating an admin user in a production environment. 