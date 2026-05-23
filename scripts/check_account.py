"""
Account Diagnostic Tool - Check if account exists and verify password
Run: python check_account.py
"""
import pymysql
import bcrypt

DB_CONFIG = {
    'host': '127.0.0.1',
    'user': 'root',
    'password': 'yvpandi@11',
    'database': 'traffic_violation_db',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

email = input("Enter your email: ").strip()
password = input("Enter your password: ").strip()

try:
    print("\n" + "="*60)
    print("ACCOUNT DIAGNOSTIC TOOL")
    print("="*60)
    
    conn = pymysql.connect(**DB_CONFIG)
    cursor = conn.cursor()
    
    # Check if account exists
    print(f"\n[1] Checking if account exists: {email}")
    cursor.execute("""
        SELECT citizen_id, full_name, email, password_hash, trust_score, account_status
        FROM CITIZENS 
        WHERE email = %s
    """, (email,))
    
    user = cursor.fetchone()
    
    if not user:
        print(f"❌ ACCOUNT NOT FOUND!")
        print(f"\nPossible reasons:")
        print(f"  1. You registered with a different email")
        print(f"  2. Account was deleted")
        print(f"  3. Database was reset")
        
        # Show all accounts
        print(f"\n[2] Listing all citizen accounts in database:")
        cursor.execute("SELECT citizen_id, full_name, email, trust_score FROM CITIZENS")
        all_users = cursor.fetchall()
        
        if all_users:
            for u in all_users:
                print(f"  - {u['full_name']} ({u['email']}) - Trust: {u['trust_score']}")
        else:
            print(f"  No accounts found in database!")
        
        cursor.close()
        conn.close()
        input("\nPress Enter to exit...")
        exit()
    
    print(f"✅ Account found!")
    print(f"   Name: {user['full_name']}")
    print(f"   ID: {user['citizen_id']}")
    print(f"   Trust Score: {user['trust_score']}")
    print(f"   Status: {user['account_status']}")
    
    # Verify password
    print(f"\n[2] Verifying password...")
    stored_hash = user['password_hash']
    
    try:
        is_valid = bcrypt.checkpw(password.encode('utf-8'), stored_hash.encode('utf-8'))
        
        if is_valid:
            print(f"✅ PASSWORD IS CORRECT!")
            print(f"\nYour account is working fine.")
            print(f"Try logging in again with:")
            print(f"  Email: {email}")
            print(f"  Password: {password}")
        else:
            print(f"❌ PASSWORD IS WRONG!")
            print(f"\nYou entered the wrong password.")
            print(f"The password stored in database doesn't match what you typed.")
            
            # Offer to reset password
            print(f"\n[3] Would you like to reset your password?")
            choice = input("Type 'yes' to reset, or press Enter to quit: ").strip().lower()
            
            if choice == 'yes':
                new_password = input("Enter NEW password: ").strip()
                confirm = input("Confirm NEW password: ").strip()
                
                if new_password != confirm:
                    print("❌ Passwords don't match!")
                elif len(new_password) < 6:
                    print("❌ Password must be at least 6 characters!")
                else:
                    # Hash new password
                    salt = bcrypt.gensalt()
                    new_hash = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
                    
                    # Update in database
                    cursor.execute("""
                        UPDATE CITIZENS 
                        SET password_hash = %s 
                        WHERE citizen_id = %s
                    """, (new_hash, user['citizen_id']))
                    conn.commit()
                    
                    print(f"\n✅ PASSWORD RESET SUCCESSFUL!")
                    print(f"\nYou can now login with:")
                    print(f"  Email: {email}")
                    print(f"  Password: {new_password}")
            else:
                print("\nNo changes made.")
    
    except Exception as e:
        print(f"❌ Error verifying password: {str(e)}")
    
    cursor.close()
    conn.close()
    
    print("\n" + "="*60)
    input("Press Enter to exit...")

except Exception as e:
    print(f"\n❌ DATABASE ERROR: {str(e)}")
    print("\nMake sure:")
    print("1. MySQL is running")
    print("2. Database 'traffic_violation_db' exists")
    input("\nPress Enter to exit...")
