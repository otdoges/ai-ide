# Environment Variables Setup

To properly configure the AI-IDE application, create a `.env` file in the root of your project with the following variables:

```
# Application settings
VITE_APP_NAME=AI-IDE
VITE_APP_VERSION=0.1.0

# Supabase configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# GitHub AI API integration
VITE_GITHUB_TOKEN=your_github_token_with_models_read_permission

# GitHub AI model settings
VITE_AI_MODEL=meta/Llama-4-Scout-17B-16E-Instruct
VITE_AI_MODEL_ENDPOINT=https://models.github.ai/inference

# MCP Server configuration
VITE_MCP_SERVER_URL=your_mcp_server_url_here
VITE_MCP_SERVER_API_KEY=your_mcp_server_api_key_here
```

## Setting up GitHub Token

1. Go to your GitHub account settings
2. Navigate to "Developer settings" > "Personal access tokens" > "Tokens (classic)"
3. Generate a new token with `models:read` permissions
4. Copy the token to your `.env` file as `VITE_GITHUB_TOKEN`

## Setting up Supabase

1. Create a Supabase account and project at https://supabase.com
2. Copy your project URL and anon key from the project settings
3. Add them to your `.env` file as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

## MCP Server Configuration

If you're using an MCP server for model serving:

1. Obtain your MCP server URL and API key from your provider
2. Add them to your `.env` file as `VITE_MCP_SERVER_URL` and `VITE_MCP_SERVER_API_KEY` 