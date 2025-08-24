
import os
import sys
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def test_email_configuration():
    """Test email configuration without Django"""
    
    # Get email settings from environment variables
    email_host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
    email_port = int(os.getenv('EMAIL_PORT', 587))
    email_user = os.getenv('EMAIL_HOST_USER', '')
    email_password = os.getenv('EMAIL_HOST_PASSWORD', '')
    from_email = os.getenv('DEFAULT_FROM_EMAIL', '')
    to_email = os.getenv('EMAIL_HOST_USER', 'royindro600@gmail.com')  # Send to yourself for testing
    
    print("=" * 50)
    print("EMAIL CONFIGURATION TEST")
    print("=" * 50)
    
    # Print configuration
    print(f"SMTP Host: {email_host}")
    print(f"SMTP Port: {email_port}")
    print(f"Username: {email_user}")
    print(f"From Email: {from_email}")
    print(f"To Email: {to_email}")
    print("Password: [HIDDEN]" if email_password else "Password: [MISSING]")
    print("=" * 50)
    
    if not all([email_user, email_password, from_email]):
        print("❌ ERROR: Missing email configuration in .env file")
        print("Please make sure these variables are set:")
        print("  - EMAIL_HOST_USER")
        print("  - EMAIL_HOST_PASSWORD") 
        print("  - DEFAULT_FROM_EMAIL")
        return False
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = from_email
        msg['To'] = to_email
        msg['Subject'] = 'Test Email from Python Script'
        
        # Email body
        body = f"""
        This is a test email sent from a Python script.
        
        Configuration Details:
        - SMTP Server: {email_host}:{email_port}
        - Username: {email_user}
        - From: {from_email}
        - To: {to_email}
        
        If you received this email, your configuration is working correctly!
        """
        
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect to SMTP server
        print("🔌 Connecting to SMTP server...")
        server = smtplib.SMTP(email_host, email_port)
        server.ehlo()
        
        # Start TLS encryption
        print("🔒 Starting TLS encryption...")
        server.starttls()
        server.ehlo()
        
        # Login to SMTP server
        print("🔑 Authenticating...")
        server.login(email_user, email_password)
        
        # Send email
        print("📧 Sending email...")
        server.sendmail(from_email, to_email, msg.as_string())
        
        # Close connection
        server.quit()
        
        print("✅ SUCCESS: Email sent successfully!")
        print("Check your inbox for the test email.")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        print(f"❌ AUTHENTICATION ERROR: {e}")
        print("\nCommon solutions:")
        print("1. Use an App Password instead of your regular Gmail password")
        print("2. Enable 2-factor authentication in your Google account")
        print("3. Enable 'Less secure app access' (not recommended)")
        return False
        
    except smtplib.SMTPConnectError as e:
        print(f"❌ CONNECTION ERROR: {e}")
        print("\nCommon solutions:")
        print("1. Check your internet connection")
        print("2. Verify SMTP host and port are correct")
        print("3. Check if your firewall allows outgoing connections on port 587")
        return False
        
    except Exception as e:
        print(f"❌ ERROR: {e}")
        print(f"Error type: {type(e).__name__}")
        return False

def check_env_file():
    """Check if .env file exists and has required variables"""
    env_path = os.path.join(os.path.dirname(__file__), '.env')
    
    if not os.path.exists(env_path):
        print("❌ .env file not found!")
        print("Create a .env file with these variables:")
        print("EMAIL_HOST_USER=your_email@gmail.com")
        print("EMAIL_HOST_PASSWORD=your_app_password")
        print("DEFAULT_FROM_EMAIL=your_email@gmail.com")
        return False
    
    print("✅ .env file found")
    
    # Check if required variables exist
    required_vars = ['EMAIL_HOST_USER', 'EMAIL_HOST_PASSWORD', 'DEFAULT_FROM_EMAIL']
    missing_vars = []
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing variables in .env: {', '.join(missing_vars)}")
        return False
    
    print("✅ All required environment variables are set")
    return True

if __name__ == "__main__":
    print("Testing Email Configuration...\n")
    
    # Check if .env file exists
    if not check_env_file():
        sys.exit(1)
    
    # Test email configuration
    success = test_email_configuration()
    
    if success:
        print("\n🎉 Email configuration is working correctly!")
    else:
        print("\n💥 Email configuration test failed!")
        print("\nNext steps:")
        print("1. Check your .env file has correct credentials")
        print("2. For Gmail, use an App Password (not your regular password)")
        print("3. Enable 2-factor authentication in Google account")
        print("4. Check firewall settings on your server")
    
    sys.exit(0 if success else 1)