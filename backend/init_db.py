#!/usr/bin/env python3
"""Run this once to initialize the database and create the admin user."""
from app import app, create_default_admin

if __name__ == '__main__':
    create_default_admin()
    print("Database initialized.")
