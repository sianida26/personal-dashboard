# Ujian (Exam) Feature

## Overview

The Ujian feature provides a complete exam management system with support for multiple question types, configurable exam settings, and comprehensive result tracking.

## Database Implementation

### Schema Files

The following schema files were created in `/apps/backend/src/drizzle/schema/`:

1. **ujian.ts** - Main exam table
2. **ujianQuestions.ts** - Questions for each exam
3. **ujianAttempts.ts** - User attempts/submissions
4. **ujianAnswers.ts** - Individual answers for each attempt

### Database Tables

#### `ujian`
Main exam configuration table.

**Fields:**
- `id` (text, PK) - CUID2 identifier
- `title` (varchar(255)) - Exam title
- `description` (text, nullable) - Exam description
- `maxQuestions` (integer, default: 10) - Max questions to show
- `shuffleQuestions` (boolean, default: false) - Shuffle question order
- `shuffleAnswers` (boolean, default: false) - Shuffle answer options
- `practiceMode` (boolean, default: false) - Show immediate feedback
- `allowResubmit` (boolean, default: false) - Allow multiple attempts
- `isActive` (boolean, default: true) - Active status
- `createdBy` (text, FK to users) - Creator user ID
- `createdAt` (timestamp) - Creation timestamp
- `updatedAt` (timestamp) - Last update timestamp

**Indexes:**
- `idx_ujian_active` on `isActive`
- `idx_ujian_created_by` on `createdBy`

#### `ujian_questions`
Questions for each exam.

**Fields:**
- `id` (text, PK) - CUID2 identifier
- `ujianId` (text, FK to ujian) - Parent exam ID
- `questionText` (text) - Question content
- `questionType` (enum: 'mcq', 'multiple_select', 'input') - Question type
- `options` (jsonb, nullable) - Answer options for MCQ/multiple select
- `correctAnswer` (jsonb) - Correct answer(s)
- `points` (integer, default: 1) - Points for correct answer
- `orderIndex` (integer) - Display order
- `createdAt` (timestamp) - Creation timestamp
- `updatedAt` (timestamp) - Last update timestamp

**Indexes:**
- `idx_ujian_questions_ujian_id` on `ujianId`
- `idx_ujian_questions_order` on `ujianId, orderIndex`

**Foreign Keys:**
- `ujianId` CASCADE on delete

#### `ujian_attempts`
User attempts to take exams.

**Fields:**
- `id` (text, PK) - CUID2 identifier
- `ujianId` (text, FK to ujian) - Exam ID
- `userId` (text, FK to users) - User ID
- `startedAt` (timestamp) - Start time
- `completedAt` (timestamp, nullable) - Completion time
- `score` (decimal(5,2), nullable) - Final score percentage
- `totalPoints` (integer, nullable) - Total points earned
- `status` (enum: 'in_progress', 'completed', 'abandoned') - Attempt status
- `createdAt` (timestamp) - Creation timestamp

**Indexes:**
- `idx_ujian_attempts_user_ujian` on `userId, ujianId`
- `idx_ujian_attempts_status` on `status`

**Foreign Keys:**
- `ujianId` CASCADE on delete
- `userId` NO ACTION on delete

#### `ujian_answers`
Individual answers for each question in an attempt.

**Fields:**
- `id` (text, PK) - CUID2 identifier
- `attemptId` (text, FK to ujian_attempts) - Attempt ID
- `questionId` (text, FK to ujian_questions) - Question ID
- `userAnswer` (jsonb) - User's answer
- `isCorrect` (boolean, nullable) - Correctness flag
- `pointsEarned` (integer, default: 0) - Points earned
- `answeredAt` (timestamp) - Answer timestamp

**Indexes:**
- `idx_ujian_answers_attempt` on `attemptId`
- `idx_ujian_answers_attempt_question` on `attemptId, questionId`

**Foreign Keys:**
- `attemptId` CASCADE on delete
- `questionId` NO ACTION on delete

### Question Types

#### MCQ (Multiple Choice Question)
- Single correct answer
- Options stored as: `[{"id": "a", "text": "Option A"}, ...]`
- Correct answer stored as: `"a"`

#### Multiple Select
- Multiple correct answers
- Options stored as: `[{"id": "a", "text": "Option A"}, ...]`
- Correct answer stored as: `["a", "c"]`

#### Input
- Text input answer
- No options (null)
- Correct answer stored as: `"exact answer text"`

## TypeScript Types

Types are defined in `/packages/data/src/types/ujian.ts` and include:

### Core Types
- `Ujian` - Exam entity
- `UjianQuestion` - Question entity
- `UjianAttempt` - Attempt entity
- `UjianAnswer` - Answer entity

### DTOs
- `CreateUjianDto` - Create exam payload
- `UpdateUjianDto` - Update exam payload
- `CreateQuestionDto` - Create question payload
- `UpdateQuestionDto` - Update question payload
- `SubmitAnswerDto` - Submit answer payload

### Response Types
- `AnswerFeedback` - Immediate feedback for practice mode
- `UjianResult` - Complete exam results
- `UjianWithQuestions` - Exam with all questions
- `StartUjianResponse` - Initial attempt data

## Migration

Migration file: `0018_calm_george_stacy.sql`

To apply the migration:
```bash
cd apps/backend
bun run db:migrate
```

## Relations

### User Relations (users table)
- `createdUjian` - Many ujian created by user
- `ujianAttempts` - Many attempts by user

### Ujian Relations
- `creator` - One user (creator)
- `questions` - Many ujian_questions
- `attempts` - Many ujian_attempts

### UjianQuestion Relations
- `ujian` - One ujian (parent)
- `answers` - Many ujian_answers

### UjianAttempt Relations
- `ujian` - One ujian
- `user` - One user
- `answers` - Many ujian_answers

### UjianAnswer Relations
- `attempt` - One ujian_attempt
- `question` - One ujian_question

## Business Logic

### Taking an Exam
1. Check eligibility (resubmit policy)
2. Create new attempt with status 'in_progress'
3. Select questions (apply max_questions limit)
4. Apply shuffle settings if enabled
5. Return questions without correct answers

### Submitting Answers
**Practice Mode (practiceMode = true):**
- Check answer immediately
- Return feedback with is_correct flag
- Store answer with correctness

**Normal Mode (practiceMode = false):**
- Store answer without checking
- No immediate feedback
- Check all answers on completion

### Completing an Exam
1. Check all unanswered questions (mark as incorrect)
2. Calculate total score
3. Update attempt status to 'completed'
4. Set completedAt timestamp
5. Return full results

### Scoring
- Each question has points value (default: 1)
- Correct answers earn full points
- Incorrect answers earn 0 points
- Final score = (points_earned / total_points) × 100

## Next Steps

1. **API Implementation** - Create REST endpoints (see [PRDs/ujian.md](../../PRDs/ujian.md))
2. **Validation** - Implement Zod schemas for DTOs
3. **Business Logic** - Create service layer for exam operations
4. **Access Control** - Implement permissions for admin/student roles
5. **Frontend UI** - Create exam taking and management interfaces

## See Also

- [PRD Document](../../PRDs/ujian.md) - Full product requirements
- [Database Documentation](../backend/database.md) - General database patterns
- [Backend Architecture](../backend/architecture.md) - Overall backend structure
