# Upload Practice Questions Script

This directory contains scripts for uploading practice exam questions to the production database.

## Files

- `upload-practice-questions.ts` - TypeScript script that handles the database operations
- `upload-practice.sh` - Bash wrapper script for easier command-line usage

## Prerequisites

1. **Bun runtime** must be installed
2. **Database connection** configured in `.env` file:
   - `REMOTE_DB_URL` for production database
   - `DATABASE_URL` as fallback

## JSON Format

Your question JSON file must follow this structure:

```json
[
  {
    "question": "What is computer forensics?",
    "options": [
      { "value": "Option A", "isCorrect": false },
      { "value": "Option B", "isCorrect": true },
      { "value": "Option C", "isCorrect": false },
      { "value": "Option D", "isCorrect": false }
    ]
  }
]
```

**Requirements:**
- Each question must have a `question` field (string)
- Each question must have an `options` array with at least 1 option
- Each option must have `value` (string) and `isCorrect` (boolean)
- At least one option must have `isCorrect: true`

## Usage

### Option 1: Using the Bash Script (Recommended)

```bash
cd apps/backend
./upload-practice.sh <json-file-path> <exam-title> [exam-description]
```

**Examples:**

```bash
# Basic usage
./upload-practice.sh ../../scratch/chfi/practice/module1-computer-forensics-in-todays-world.json "CHFI Module 1: Computer Forensics in Today's World"

# With description
./upload-practice.sh ../../scratch/chfi/practice/module2.json "CHFI Module 2" "Investigation Process and Procedures"

# From the project root
cd apps/backend
./upload-practice.sh ../../scratch/chfi/practice/module3.json "CHFI Module 3"
```

### Option 2: Direct TypeScript Execution

```bash
cd apps/backend
bun run src/scripts/upload-practice-questions.ts <json-file-path> <exam-title> [exam-description]
```

## What the Script Does

1. **Validates** the JSON file and questions format
2. **Creates** a new exam entry in the `ujian` table with:
   - Practice mode enabled
   - Question shuffling enabled
   - Answer shuffling enabled
   - Resubmit allowed
   - Active status
3. **Inserts** all questions in batches (50 questions per batch)
4. **Returns** the exam ID and question count

## Exam Configuration

All uploaded exams will have these settings:

| Setting | Value |
|---------|-------|
| Practice Mode | ✅ Enabled |
| Shuffle Questions | ✅ Enabled |
| Shuffle Answers | ✅ Enabled |
| Allow Resubmit | ✅ Enabled |
| Active | ✅ Yes |
| Max Questions | Auto (based on JSON) |

## Output

Success output:

```
✅ Upload completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Exam Title: CHFI Module 1
🆔 Exam ID: 12
📝 Total Questions: 70
🎯 Practice Mode: Enabled
🔄 Resubmit: Allowed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Troubleshooting

### Error: "REMOTE_DB_URL or DATABASE_URL is required"
- Check your `.env` file has the database connection string
- Make sure you're running from the `apps/backend` directory

### Error: "No valid questions found in the JSON file"
- Verify your JSON follows the correct format
- Ensure at least one option has `isCorrect: true` for each question
- Check for empty question text or missing options

### Error: "JSON file not found"
- Verify the path to your JSON file is correct
- Use relative paths from the `apps/backend` directory

### Database Connection Issues
- Verify `REMOTE_DB_URL` in `.env` is correct
- Check network connectivity to the database
- Ensure database credentials are valid

## Examples for CHFI Modules

```bash
cd apps/backend

# Module 1
./upload-practice.sh ../../scratch/chfi/practice/module1-computer-forensics-in-todays-world.json "CHFI Module 1: Computer Forensics in Today's World"

# Module 2
./upload-practice.sh ../../scratch/chfi/practice/module2-investigation-process.json "CHFI Module 2: Investigation Process"

# Module 3
./upload-practice.sh ../../scratch/chfi/practice/module3-hard-disk-storage.json "CHFI Module 3: Hard Disk and Storage"
```

## Notes

- The script uses **batch insertion** (50 questions at a time) to avoid overwhelming the database
- Questions are automatically numbered with `orderIndex` starting from 1
- Each option is assigned an ID (1, 2, 3, 4, etc.)
- The script validates each question before insertion
- Invalid questions are skipped with warnings in the logs

## For Future Modules

To upload questions for new modules:

1. Create your JSON file following the format above
2. Save it in an appropriate directory (e.g., `scratch/chfi/practice/`)
3. Run the upload script with appropriate title and description
4. Note the returned Exam ID for your records

## Security

⚠️ **Important:**
- This script uploads directly to production database
- Always review your questions before uploading
- The script will ask for confirmation before proceeding
- Keep your `.env` file secure and never commit it to version control
