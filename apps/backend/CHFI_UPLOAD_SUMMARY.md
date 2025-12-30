# CHFI Upload Summary

## Status: ✅ SUCCESS

### Upload Details
- **Date**: December 30, 2025
- **Source File**: `/home/sianida26/Projects/personal-dashboard/apps/backend/chfi.json`
- **Ujian ID**: `ys7haw61nup01hegy1sux8dg`
- **Title**: CHFI Practice Exam
- **Description**: Computer Hacking Forensic Investigator (CHFI) practice questions

### Statistics
- **Total Questions**: 174 questions
- **All Questions Successfully Uploaded**: ✅
- **Question Type**: Multiple Choice (MCQ)
- **Points per Question**: 1 point
- **Practice Mode**: Enabled
- **Allow Resubmit**: Enabled
- **Shuffle Questions**: Enabled
- **Shuffle Answers**: Enabled

### Scripts Created

1. **Upload Script**: `apps/backend/src/scripts/upload-chfi.ts`
   - Reads the chfi.json file
   - Creates the ujian entry
   - Uploads questions in batches of 50
   - Handles errors gracefully

2. **Verification Script**: `apps/backend/src/scripts/verify-chfi.ts`
   - Verifies the upload was successful
   - Counts questions
   - Displays sample questions

### How to Use

#### Re-upload (if needed)
```bash
cd /home/sianida26/Projects/personal-dashboard/apps/backend
bun run src/scripts/upload-chfi.ts
```

#### Verify Upload
```bash
cd /home/sianida26/Projects/personal-dashboard/apps/backend
bun run src/scripts/verify-chfi.ts
```

### Sample Questions Uploaded

1. **Question 1**: Which command can provide investigators with details of all the loaded modules on a Linux-based system?
   - Options: lsmod, plist mod -a, list modules -a, lsof -m
   - Correct Answer: lsmod

2. **Question 2**: An investigator uploads a suspicious executable file to VirusTotal to confirm whether it is malicious and to understand its functionality. What type of malware analysis was performed?
   - Options: Volatile, Static, Dynamic, Hybrid
   - Correct Answer: Static

3. **Question 3**: While auditing web application logs, several login attempts contain a script that steals cookies using JavaScript. What kind of attack has occurred?
   - Options: Cross-site scripting, Buffer overflow, Cross-site request forgery, SQL injection
   - Correct Answer: Cross-site scripting

### Database Schema

The questions are stored in two tables:

1. **ujian** table:
   - Stores exam metadata (title, description, settings)
   
2. **ujian_questions** table:
   - Stores individual questions with:
     - Question text
     - Question type (mcq)
     - Options array (with id and text)
     - Correct answer array
     - Points
     - Order index

### Notes

- All questions are properly formatted and validated
- Each question has options with unique IDs (1, 2, 3, 4)
- Correct answers are stored as arrays for flexibility
- Questions are ordered sequentially from 1 to 174
- The ujian is active and ready to be used
