#!/usr/bin/env zsh
set -e

echo "🚀 Setting up YDSF workspace..."

# Check if Bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Error: Bun is not installed"
    echo "Please install Bun: https://bun.sh/docs/installation"
    echo "Run: curl -fsSL https://bun.sh/install | bash"
    exit 1
fi

# Check Bun version
REQUIRED_BUN_VERSION="1.2.0"
CURRENT_BUN_VERSION=$(bun --version)
echo "✓ Bun version: $CURRENT_BUN_VERSION (required: >= $REQUIRED_BUN_VERSION)"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Setup environment files with symlinks to root repo
echo "⚙️  Setting up environment file symlinks..."

# Backend .env
if [ ! -f "apps/backend/.env" ]; then
    if [ -f "$CONDUCTOR_ROOT_PATH/apps/backend/.env" ]; then
        ln -s "$CONDUCTOR_ROOT_PATH/apps/backend/.env" apps/backend/.env
        echo "  ✓ Created symlink to backend .env"
    else
        if [ -f "apps/backend/.env.example" ]; then
            cp apps/backend/.env.example apps/backend/.env
            echo "  ✓ Copied apps/backend/.env from .env.example"
            else
            echo "  ⚠️  Warning: $CONDUCTOR_ROOT_PATH/apps/backend/.env not found and apps/backend/.env.example not found"
            echo "  Please create apps/backend/.env file or .env.example in the repository"
            fi
    fi
else
    echo "  → apps/backend/.env already exists"
fi

# Frontend .env
if [ ! -f "apps/frontend/.env" ]; then
    if [ -f "$CONDUCTOR_ROOT_PATH/apps/frontend/.env" ]; then
        ln -s "$CONDUCTOR_ROOT_PATH/apps/frontend/.env" apps/frontend/.env
        echo "  ✓ Created symlink to frontend .env"
    else
        if [ -f "apps/frontend/.env.example" ]; then
            cp apps/frontend/.env.example apps/frontend/.env
            echo "  ✓ Copied apps/frontend/.env from .env.example"
            else
            echo "  ⚠️  Warning: $CONDUCTOR_ROOT_PATH/apps/frontend/.env not found and apps/frontend/.env.example not found"
            echo "  Please create apps/frontend/.env file or .env.example in the repository"
            fi
    fi
else
    echo "  → apps/frontend/.env already exists"
fi

# Setup Husky
echo "🪝 Setting up git hooks..."
bun run prepare

echo ""
echo "✅ Workspace setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Click the 'Run' button to start development servers"
echo "  2. For database setup (if needed):"
echo "     - Ensure PostgreSQL is running (or use: docker-compose up -d postgres)"
echo "     - Run migrations: cd apps/backend && bun run db:migrate"
echo ""
