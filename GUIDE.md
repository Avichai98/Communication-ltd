# Authors:
**Peleg Asraf**

**Avichai Shchori**



# Communication_LTD Cybersecurity Project - Complete Guide

This project demonstrates common web security vulnerabilities and their fixes, including SQL Injection and Cross-Site Scripting (XSS). The application has two modes: **Vulnerable Mode** and **Secure Mode** to show the difference between insecure and secure implementations.

## Table of Contents

1. [How to Run the Application](#how-to-run-the-application)
2. [How the Application Works](#how-the-application-works)
3. [Secure vs Insecure Differences](#secure-vs-insecure-differences)
4. [SQL Injection Demonstrations](#sql-injection-demonstrations)
5. [XSS (Cross-Site Scripting) Demonstrations](#xss-cross-site-scripting-demonstrations)
6. [Security Features](#security-features)
7. [Deployment Instructions](#deployment-instructions)

## How to Run the Application

### Prerequisites

- Node.js (version 14 or higher)
- MySQL database
- Email service (for password reset functionality)

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database Configuration
DB_HOST=your-database-host
DB_PORT=3306
DB_USER=your-database-username
DB_PASSWORD=your-database-password
DB_NAME=your-database-name
DB_CA_CERT=your-ssl-certificate-base64 (optional)

# Email Configuration
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_USER=your-email-username
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=your-sender-email
```

# Application URL
NEXT_PUBLIC_APP_URL=https://your-production-url.com
## For local development, the app will default to http://localhost:3000


### Installation and Setup

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd communication_ltd
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```


3. **Start the development server**
   ```bash
   npm run dev
   ```
   
4. **Init DB**
Then visit `http://localhost:3000/api/init-db` to create the database tables.

5. **Access the application**
   Open `http://localhost:3000` in your browser.

## How the Application Works

### Application Structure

The application is built with Next.js and includes:

- **Authentication System**: Login, registration, password reset, and change password
- **Customer Management**: Add and view customers
- **Two Security Modes**: Vulnerable and Secure implementations
- **Session Management**: Secure session handling with cookies
- **Password Security**: HMAC+Salt hashing, password history, and complexity requirements

### User Flow

1. **Home Page**: Choose between Vulnerable Mode or Secure Mode
2. **Registration**: Create a new account with strong password requirements
3. **Login**: Authenticate with username and password
4. **Dashboard**: Manage customers (add new customers, view customer list)
5. **Password Management**: Change password or reset forgotten password

### Security Features

- **Password Requirements**: 10+ characters, uppercase, lowercase, numbers, special characters
- **Password History**: Prevents reuse of last 3 passwords
- **Login Attempts**: Locks account after 3 failed attempts for 30 minutes
- **Session Management**: Secure HTTP-only cookies with expiration
- **Email Verification**: Password reset via email tokens

## Secure vs Insecure Differences

### Database Queries

| Aspect | Insecure Version | Secure Version |
|--------|------------------|----------------|
| **SQL Queries** | String concatenation | Parameterized queries |
| **User Input** | Direct insertion | Sanitized and validated |
| **Error Handling** | Detailed error messages | Generic error messages |

**Insecure Example:**
```javascript
const query = `SELECT * FROM users WHERE username = '${username}'`
await db.query(query)
```

**Secure Example:**
```javascript
const users = await db.secureQuery(`SELECT * FROM users WHERE username = ?`, [username])
```

### Data Display

| Aspect | Insecure Version | Secure Version |
|--------|------------------|----------------|
| **HTML Rendering** | `dangerouslySetInnerHTML` | React's automatic escaping |
| **Input Validation** | Minimal validation | Comprehensive validation |
| **XSS Protection** | Vulnerable | Protected |

## SQL Injection Demonstrations

### 1. Login Page SQL Injection

**Target**: `/insecure/login`

### Method 1: Return All Users (Login as First User)

**Username:** `' OR 1=1 LIMIT 1 -- `  
**Password:** `Password1234!` (use the password of the first user you created)

**Explanation:** 
- The query becomes: `SELECT * FROM users WHERE username = '' OR 1=1 LIMIT 1 -- '`
- This returns the first user in the database
- You need to know that user's password

**Explanation:** This attempts to inject a fake user record into the result set.

### 2. Registration Page SQL Injection

**Target**: `/insecure/register`

#### Multiple Statement Execution

### Method 1
**Username:** `test' ; DELETE FROM users ; -- `

**Explanation:** This delete all users from users table

### Method 2
**Username:** `test'; INSERT INTO users (username, email, password_hash, salt) VALUES ('hacker', 'hacker@evil.com', 'hash', 'salt'); -- `  

**Explanation:** This attempts to register one user with weak password

### Method 3
**Username:** `test' AND (SELECT COUNT(*) FROM information_schema.tables) > 0 -- `  
test', 'tchjha12@gmail.com', AND (SELECT COUNT(*) FROM information_schema.tables) > 0 -- 

**Explanation:** This attempts to query database metadata to discover table structures.

### 3. Customer Management SQL Injection

**Target**: `/insecure/dashboard` (Customer Management)

#### Working SQL Injection Examples

Since the customer insertion uses this vulnerable pattern:
```javascript
const query = `INSERT INTO customers (name, email, phone) VALUES ('${name}', '${email}', '${phone}')`
```

**Method 1 - Close and Add New Statement:**

**Name:** `test', 'test@gmail.com', '0500000000'); INSERT INTO customers (name, email, phone) VALUES ('hacker', 'hacker@evil.com', '123-456-7890'); -- `  

**Method 2 - Data Deletion:**

**Name:** `test', 'test@example.com', '123456'); DELETE FROM customers; -- `

**Method 3 - Data Extraction:**

**Name:** `test', 'test@gmail.com', '0500000000'); INSERT INTO customers (name, email, phone) SELECT username, email, 'extracted' FROM users LIMIT 1; -- `  

## XSS (Cross-Site Scripting) Demonstrations

### Customer Name XSS Attack

**Target**: `/insecure/dashboard` (Add Customer)

The insecure version uses `dangerouslySetInnerHTML` to display customer names:
```javascript
<div dangerouslySetInnerHTML={{ __html: customer.name }} />
```

#### Image-based XSS (More Reliable)

**Name:** `<div><img src=1 onerror=alert(1)></div>`  

**Result:** This is more reliable because it doesn't depend on script tags being allowed.

#### HTML Injection

**Name:** `<div style="color:red;font-size:24px;font-weight:bold;">HACKED!</div>`  

**Result:** The customer list will display "HACKED!" in large red text.

### Why Email and Phone Are Safe from XSS

Even in the insecure version, email and phone fields are displayed using:
```javascript
<p>Email: {customer.email}</p>
<p>Phone: {customer.phone}</p>
```

React automatically escapes HTML in these expressions, so XSS attacks in these fields won't work.

## Security Features

### Password Management

#### Password Storage
- **Hashing Algorithm**: HMAC-SHA256 with unique salt per user
- **Salt Generation**: 16-byte random salt using `crypto.randomBytes()`
- **Storage**: Hash and salt stored separately in database

#### Password Requirements
- Minimum 10 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character
- Not in dictionary of common passwords

#### Password History
- Remembers last 3 passwords
- Prevents password reuse
- Uses same hashing mechanism for comparison

#### Password Reset Process
- SHA-1 token generation (as per project requirements)
- Email delivery with secure reset link
- 1-hour token expiration
- Token verification before password update

### Session Management

#### Session Creation
- 32-byte random session ID
- 24-hour expiration
- HTTP-only cookies
- Secure flag in production
- SameSite protection

#### Login Attempt Protection
- Maximum 3 failed attempts
- 30-minute lockout period
- Per-username tracking
- Automatic reset on successful login

## Deployment Instructions

### Local Development

1. **Database Setup**
   - Install MySQL locally
   - Create a database for the project
   - Set environment variables in `.env.local`

2. **Email Configuration**
   - Use a service like Gmail, SendGrid, or Mailgun
   - Configure SMTP settings in environment variables

3. **Initialize Database**
   - Run the application
   - Visit `/api/init-db` to create tables

### Production Deployment (Vercel)

1. **Database Setup**
   - Use a managed MySQL service (PlanetScale, AWS RDS, etc.)
   - Configure SSL certificate if required

2. **Environment Variables**
   - Set all required environment variables in Vercel dashboard
   - Use `NEXT_PUBLIC_APP_URL` for production URL

3. **Deploy**
   - Push code to GitHub
   - Connect repository to Vercel
   - Deploy automatically

### Environment-Specific Configuration

The application automatically detects the environment:
- **Local**: Uses `http://localhost:3000` as default
- **Production**: Uses `NEXT_PUBLIC_APP_URL` environment variable

## Testing the Vulnerabilities

### SQL Injection Testing Checklist

- [ ] Login bypass with `' OR 1=1 LIMIT 1 -- `
- [ ] Registration with multiple statements
- [ ] Customer management data manipulation
- [ ] Compare results between vulnerable and secure modes

### XSS Testing Checklist

- [ ] Basic script injection in customer name
- [ ] Image-based XSS attack
- [ ] HTML injection for visual confirmation
- [ ] Verify email/phone fields are safe
- [ ] Compare vulnerable vs secure rendering

### Security Feature Testing

- [ ] Password complexity requirements
- [ ] Password history prevention
- [ ] Login attempt lockout
- [ ] Session expiration
- [ ] Password reset flow

## Troubleshooting

### SQL Injection Not Working

1. **Check Database Configuration**
   - Ensure `multipleStatements: true` in database connection
   - Verify MySQL version supports multiple statements

2. **Syntax Issues**
   - Use proper SQL comment syntax (`-- ` with space or `#`)
   - Ensure quotes are properly balanced
   - Check for special characters that might be escaped

3. **Error Messages**
   - Check server logs for actual SQL queries
   - Look for syntax errors in database logs

### XSS Not Executing

1. **Check Display Method**
   - XSS only works with `dangerouslySetInnerHTML`
   - Regular React rendering (`{variable}`) is safe

2. **Browser Security**
   - Some browsers block obvious XSS attempts
   - Try different payload variations

### Email Not Sending

1. **SMTP Configuration**
   - Verify email service credentials
   - Check firewall/network restrictions
   - Test with a simple email service first

2. **Environment Variables**
   - Ensure all email variables are set correctly
   - Check for typos in variable names