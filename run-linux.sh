#!/bin/bash

# Set environment variables for GTK compatibility
export GTK_VERSION=3
unset GDK_BACKEND

# Run the development server
echo "Starting AI-IDE with GTK 3..."
pnpm dev 