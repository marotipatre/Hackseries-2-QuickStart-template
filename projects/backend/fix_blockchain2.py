#!/usr/bin/env python3
"""Fix blockchain_service.py - replace result.return with result.return_value"""

# Read the file
with open('app/services/blockchain_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all instances of result.return with result.return_value
content = content.replace('result.return', 'result.return_value')

# Write back
with open('app/services/blockchain_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed blockchain_service.py - replaced result.return with result.return_value")
