#!/bin/bash

# Test script for JWT authentication
# Make sure the backend is running on http://localhost:3000

API_URL="http://localhost:3000/api"
TEST_EMAIL="test@example.com"
TEST_PASSWORD="testpassword123"
TEST_USERNAME="TestUser"

echo "🧪 Testing JWT Authentication"
echo "================================"
echo ""

# Test 1: Register a new user
echo "1️⃣  Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "${API_URL}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"username\": \"${TEST_USERNAME}\"
  }")

echo "Response: $REGISTER_RESPONSE"
echo ""

# Extract token from response (if successful)
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "⚠️  Registration might have failed (user may already exist)"
  echo "   Trying to login instead..."
  echo ""
  
  # Test 2: Login with existing user
  echo "2️⃣  Testing Login..."
  LOGIN_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"${TEST_EMAIL}\",
      \"password\": \"${TEST_PASSWORD}\"
    }")
  
  echo "Response: $LOGIN_RESPONSE"
  TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
else
  echo "✅ Registration successful!"
  echo "   Token: ${TOKEN:0:50}..."
  echo ""
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token. Please check:"
  echo "   - Backend is running on http://localhost:3000"
  echo "   - MongoDB is running and connected"
  echo "   - User credentials are correct"
  exit 1
fi

echo "✅ Login successful!"
echo "   Token: ${TOKEN:0:50}..."
echo ""

# Test 3: Use token to access protected endpoint
echo "3️⃣  Testing Protected Endpoint (GET /users/me)..."
ME_RESPONSE=$(curl -s -X GET "${API_URL}/users/me" \
  -H "Authorization: Bearer ${TOKEN}")

echo "Response: $ME_RESPONSE"
echo ""

if echo "$ME_RESPONSE" | grep -q "username"; then
  echo "✅ Protected endpoint access successful!"
  echo ""
  echo "🎉 All tests passed!"
  echo ""
  echo "You can now use these credentials in the frontend:"
  echo "   Email: ${TEST_EMAIL}"
  echo "   Password: ${TEST_PASSWORD}"
  echo "   Username: ${TEST_USERNAME}"
else
  echo "⚠️  Protected endpoint test failed"
  echo "   Response: $ME_RESPONSE"
fi

