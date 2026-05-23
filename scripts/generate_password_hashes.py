"""
Generate bcrypt password hashes for demo accounts
Run this script to get the correct hashes for seed_demo_accounts.sql
"""
import bcrypt

def generate_hash(password):
    """Generate bcrypt hash for a password."""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# Generate hashes
police_password = "police123"
citizen_password = "citizen123"

police_hash = generate_hash(police_password)
citizen_hash = generate_hash(citizen_password)

print("=" * 60)
print("MARGA RAKSHAK - PASSWORD HASHES FOR DEMO ACCOUNTS")
print("=" * 60)
print()
print(f"Police Password: {police_password}")
print(f"Police Hash: {police_hash}")
print()
print(f"Citizen Password: {citizen_password}")
print(f"Citizen Hash: {citizen_hash}")
print()
print("=" * 60)
print("COPY THESE HASHES INTO seed_demo_accounts.sql")
print("=" * 60)
