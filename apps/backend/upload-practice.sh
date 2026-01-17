#!/bin/bash

# Script to upload practice exam questions to the database
# This is a wrapper for the TypeScript upload script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    print_error "bun is not installed. Please install bun first."
    exit 1
fi

# Get the backend directory (script location)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check if we're in the backend directory
if [[ ! -f "$SCRIPT_DIR/package.json" ]]; then
    print_error "This script must be run from the backend directory"
    exit 1
fi

# Function to show usage
show_usage() {
    echo -e "${BLUE}Usage:${NC}"
    echo "  ./upload-practice.sh <json-file-path> <exam-title> [exam-description]"
    echo ""
    echo -e "${BLUE}Arguments:${NC}"
    echo "  json-file-path    Path to the JSON file containing questions"
    echo "  exam-title        Title of the exam"
    echo "  exam-description  (Optional) Description of the exam"
    echo ""
    echo -e "${BLUE}Examples:${NC}"
    echo '  ./upload-practice.sh ../../scratch/chfi/practice/module1.json "CHFI Module 1"'
    echo '  ./upload-practice.sh ../../scratch/chfi/practice/module1.json "CHFI Module 1" "Computer Forensics in Today'\''s World"'
    echo ""
    echo -e "${BLUE}Notes:${NC}"
    echo "  - The exam will be created in practice mode"
    echo "  - Shuffling of questions and answers will be enabled"
    echo "  - Allow resubmit will be enabled"
    echo "  - Questions must follow the format:"
    echo '    [{ "question": "...", "options": [{ "value": "...", "isCorrect": true/false }] }]'
}

# Check arguments
if [[ $# -lt 2 ]]; then
    print_error "Missing required arguments"
    echo ""
    show_usage
    exit 1
fi

JSON_FILE="$1"
EXAM_TITLE="$2"
EXAM_DESCRIPTION="${3:-}"

# Validate JSON file exists
if [[ ! -f "$JSON_FILE" ]]; then
    print_error "JSON file not found: $JSON_FILE"
    exit 1
fi

# Show what we're about to do
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "📤 Upload Practice Questions"
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_info "JSON File: $JSON_FILE"
print_info "Exam Title: $EXAM_TITLE"
if [[ -n "$EXAM_DESCRIPTION" ]]; then
    print_info "Description: $EXAM_DESCRIPTION"
fi
print_info "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
print_info "Starting upload..."
echo ""

# Run the TypeScript script
cd "$SCRIPT_DIR"
if [[ -n "$EXAM_DESCRIPTION" ]]; then
    bun run src/scripts/upload-practice-questions.ts "$JSON_FILE" "$EXAM_TITLE" "$EXAM_DESCRIPTION"
else
    bun run src/scripts/upload-practice-questions.ts "$JSON_FILE" "$EXAM_TITLE"
fi

# Check exit code
if [[ $? -eq 0 ]]; then
    echo ""
    print_success "Questions uploaded successfully! 🎉"
else
    echo ""
    print_error "Upload failed. Please check the error messages above."
    exit 1
fi
