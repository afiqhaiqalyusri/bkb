#!/bin/bash
sudo -u postgres psql -d bkb -c "UPDATE users SET is_email_verified = true WHERE email IN ('manager@bkb.com', 'staff@bkb.com');"
sudo -u postgres psql -d bkb -c "SELECT id, email, is_email_verified FROM users;"
