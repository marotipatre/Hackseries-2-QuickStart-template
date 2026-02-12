#!/usr/bin/env python3
"""Fix blockchain_service.py f-string issues"""

import re

# Read the file
with open('app/services/blockchain_service.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the f-string issue - replace the problematic logger.error line
# The issue is that the f-string has nested braces that need to be escaped
content = re.sub(
    r'logger\.error\(f"Failed to get vault status: \{e\}"\)',
    'logger.error(f"Failed to get vault status: {e}")',
    content
)

# Write back
with open('app/services/blockchain_service.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed blockchain_service.py")
