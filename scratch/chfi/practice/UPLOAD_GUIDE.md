# 🚀 Practice Questions Upload System - Quick Start Guide

## 📋 Overview

This system allows you to upload practice exam questions from JSON files to the production database. All exams are created in **practice mode** with question/answer shuffling enabled.

## 🎯 Quick Start

### For Module 1 (Already Created)

```bash
cd apps/backend

# Validate the JSON first (optional but recommended)
bun run src/scripts/validate-practice-json.ts ../../scratch/chfi/practice/module1-computer-forensics-in-todays-world.json

# Upload to production
./upload-practice.sh ../../scratch/chfi/practice/module1-computer-forensics-in-todays-world.json "CHFI Module 1: Computer Forensics in Today's World" "Practice questions covering fundamentals, investigation procedures, digital evidence, forensic readiness, and legal compliance"
```

### For Future Modules

```bash
cd apps/backend

# 1. Validate your JSON
bun run src/scripts/validate-practice-json.ts ../../scratch/chfi/practice/your-module.json

# 2. Upload to production
./upload-practice.sh ../../scratch/chfi/practice/your-module.json "Your Exam Title" "Optional description"
```

## 📁 Files Created

### Main Scripts
- **`upload-practice.sh`** - Bash wrapper script (recommended to use)
- **`src/scripts/upload-practice-questions.ts`** - TypeScript upload logic
- **`src/scripts/validate-practice-json.ts`** - JSON validation tool

### Documentation
- **`scripts/UPLOAD_PRACTICE_README.md`** - Complete documentation
- **`scripts/upload-chfi-examples.sh`** - Example commands

## 🔍 Validation Tool

Before uploading, validate your JSON:

```bash
cd apps/backend
bun run src/scripts/validate-practice-json.ts <path-to-json>
```

**What it checks:**
- ✅ Valid JSON format
- ✅ Array structure
- ✅ Each question has text
- ✅ Each question has options
- ✅ Each option has value and isCorrect
- ✅ At least one correct answer per question
- ⚠️  Warns about multiple correct answers

**Example output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Validation Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Questions: 70
Valid Questions: 70 ✅
Invalid Questions: 0 ❌
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 📝 JSON Format Required

```json
[
  {
    "question": "What is computer forensics?",
    "options": [
      { "value": "Option A text", "isCorrect": false },
      { "value": "Option B text", "isCorrect": true },
      { "value": "Option C text", "isCorrect": false },
      { "value": "Option D text", "isCorrect": false }
    ]
  }
]
```

## ⚙️ Exam Settings (Auto-Applied)

All uploaded exams automatically get:

| Setting | Value | Description |
|---------|-------|-------------|
| 🎯 Practice Mode | ✅ Enabled | Shows correct answers after submission |
| 🔀 Shuffle Questions | ✅ Enabled | Questions appear in random order |
| 🎲 Shuffle Answers | ✅ Enabled | Options appear in random order |
| 🔄 Allow Resubmit | ✅ Enabled | Users can retake the exam |
| 👁️ Active | ✅ Yes | Exam is visible to users |

## 🎬 Upload Process Flow

1. **Validate JSON** (optional but recommended)
   ```bash
   bun run src/scripts/validate-practice-json.ts <json-file>
   ```

2. **Run upload script**
   ```bash
   ./upload-practice.sh <json-file> "Exam Title" "Description"
   ```

3. **Confirm upload**
   - Script shows summary and asks for confirmation
   - Type `y` to proceed, `n` to cancel

4. **Upload executes**
   - Creates exam entry in database
   - Inserts questions in batches of 50
   - Shows progress

5. **Get results**
   - Exam ID returned
   - Total questions count
   - Ready to use!

## 📊 Example Output

```
[INFO] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO] 📤 Upload Practice Questions
[INFO] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[INFO] JSON File: ../../scratch/chfi/practice/module1.json
[INFO] Exam Title: CHFI Module 1
[INFO] Description: Practice questions for Module 1
[INFO] ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Are you sure you want to upload these questions? [y/N]: y

[INFO] Starting upload...
[INFO] Found 70 questions in JSON file
[INFO] 70 valid questions found
✅ Created exam with ID: 12
[INFO] Inserting questions in batches...
  Progress: 50/70 questions inserted
  Progress: 70/70 questions inserted

✅ Upload completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 Exam Title: CHFI Module 1
🆔 Exam ID: 12
📝 Total Questions: 70
🎯 Practice Mode: Enabled
🔄 Resubmit: Allowed
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## ⚠️ Important Notes

1. **Database**: Uploads directly to production (REMOTE_DB_URL)
2. **Confirmation**: Always asks before uploading
3. **Validation**: Invalid questions are skipped with warnings
4. **Batching**: Questions inserted in batches of 50
5. **Environment**: Requires `.env` file with database credentials

## 🔧 Troubleshooting

### "REMOTE_DB_URL is required"
- Check `.env` file exists in `apps/backend/`
- Verify `REMOTE_DB_URL` or `DATABASE_URL` is set

### "JSON file not found"
- Use correct relative path from `apps/backend/`
- Check file exists: `ls -la ../../scratch/chfi/practice/`

### "No valid questions found"
- Run validation script first
- Check JSON format matches required structure
- Ensure at least one `isCorrect: true` per question

### Upload fails partway
- Check database connection
- Check database credentials in `.env`
- Review error messages in terminal

## 📚 Additional Resources

- **Full documentation**: `apps/backend/scripts/UPLOAD_PRACTICE_README.md`
- **Example commands**: `apps/backend/scripts/upload-chfi-examples.sh`
- **Original upload script**: `apps/backend/src/scripts/upload-chfi.ts` (reference)

## 🎓 Module 1 Status

✅ **Completed**
- File: `module1-computer-forensics-in-todays-world.json`
- Questions: 70 (validated)
- Topics: Fundamentals, Cybercrimes, Digital Evidence, Forensic Readiness, Standards, Legal Compliance
- Ready to upload!

## 🔮 Next Steps

1. Upload Module 1 to production
2. Generate questions for Module 2
3. Validate Module 2 JSON
4. Upload Module 2
5. Repeat for remaining modules

---

**Need help?** Check the full documentation in `scripts/UPLOAD_PRACTICE_README.md`
