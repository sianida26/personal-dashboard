# Ujian (Exam) Feature PRD

## Overview
A complete exam management system allowing admins to create exams with various question types and students to take exams with configurable settings.

## Database Schema

### Tables

#### `ujian`
```sql
CREATE TABLE ujian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  max_questions INTEGER NOT NULL DEFAULT 10,
  shuffle_questions BOOLEAN DEFAULT false,
  shuffle_answers BOOLEAN DEFAULT false,
  practice_mode BOOLEAN DEFAULT false,
  allow_resubmit BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### `ujian_questions`
```sql
CREATE TABLE ujian_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ujian_id UUID REFERENCES ujian(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(20) CHECK (question_type IN ('mcq', 'multiple_select', 'input')),
  options JSONB, -- For mcq/multiple_select: [{"id": "a", "text": "Option A"}, ...]
  correct_answer JSONB NOT NULL, -- For mcq: "a", multiple_select: ["a", "c"], input: "exact answer"
  points INTEGER DEFAULT 1,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ujian_questions_ujian_id ON ujian_questions(ujian_id);
```

#### `ujian_attempts`
```sql
CREATE TABLE ujian_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ujian_id UUID REFERENCES ujian(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  score DECIMAL(5,2),
  total_points INTEGER,
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ujian_attempts_user_ujian ON ujian_attempts(user_id, ujian_id);
```

#### `ujian_answers`
```sql
CREATE TABLE ujian_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID REFERENCES ujian_attempts(id) ON DELETE CASCADE,
  question_id UUID REFERENCES ujian_questions(id),
  user_answer JSONB NOT NULL, -- Store answer based on question type
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0,
  answered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ujian_answers_attempt ON ujian_answers(attempt_id);
```

## Use Cases

### Admin/Teacher Use Cases

1. **Create Ujian**
   - Input: title, description, configurations
   - Output: New ujian record
   - Validation: title required, max_questions > 0

2. **Add Questions to Ujian**
   - Input: ujian_id, question details (text, type, options, correct_answer)
   - Output: Question added to ujian
   - Validation: Valid question type, options required for mcq/multiple_select

3. **Update Ujian/Questions**
   - Input: ujian_id/question_id, updated fields
   - Output: Updated record
   - Access: Only creator can update

4. **Delete Ujian**
   - Input: ujian_id
   - Output: Soft delete (is_active = false) or hard delete
   - Cascade: Delete questions, attempts if hard delete

5. **View Results**
   - Input: ujian_id
   - Output: List of all attempts with scores
   - Display: user, score, completion time

### Student/Peserta Use Cases

1. **List Available Ujian**
   - Input: user_id
   - Output: List of active ujian
   - Filter: Check if resubmit allowed or no previous attempt

2. **Start Ujian**
   - Input: ujian_id
   - Process: Create attempt, fetch questions (apply shuffle, max_questions)
   - Output: List of questions for attempt

3. **Submit Answer**
   - Input: attempt_id, question_id, user_answer
   - Process: 
     - If practice_mode: immediately check and return is_correct
     - Else: store answer without checking
   - Output: Answer saved, feedback if practice_mode

4. **Complete Ujian**
   - Input: attempt_id
   - Process: 
     - Check all answers
     - Calculate score
     - Update attempt status to completed
   - Output: Final score and results

5. **View Results**
   - Input: attempt_id
   - Output: Score, correct answers, user answers
   - Access: Only own attempts

## Flow Diagrams

### Admin Flow: Create Ujian
```
[Start] → [Create Ujian] → [Add Questions] → [Configure Options]
           ↓                   ↓                  ↓
        [Save Ujian]      [Add Question]    [Set shuffle/practice]
                              ↓
                         [More Questions?]
                           Yes ↑  ↓ No
                               └──┘
                                  ↓
                            [Publish Ujian]
```

### Student Flow: Take Ujian
```
[List Ujian] → [Select Ujian] → [Check Eligibility]
                                      ↓
                                [Create Attempt]
                                      ↓
                              [Load Questions] (apply shuffle/max)
                                      ↓
┌─────────────────────────────────────────────────────┐
│ For Each Question:                                  │
│   [Display Question] → [Submit Answer]              │
│          ↓                      ↓                    │
│   [If practice_mode]     [Store Answer]             │
│          ↓                      ↓                    │
│   [Check & Show Result]  [Next Question]            │
└─────────────────────────────────────────────────────┘
                                      ↓
                            [Complete Ujian]
                                      ↓
                            [Calculate Score]
                                      ↓
                            [Show Results]
```

### Answer Checking Flow
```
[Submit Answer] → [If practice_mode?]
                   Yes ↓        ↓ No
              [Check Answer] [Store Only]
                     ↓              ↓
           [Return is_correct] [Continue]
                     ↓
              [Show Feedback]
                     ↓
              [Continue to Next]

[Complete Ujian] → [Check All Answers]
                           ↓
                  [Calculate Total Score]
                           ↓
                    [Update Attempt]
                           ↓
                    [Return Results]
```

## API Endpoints

### Admin Endpoints
- `POST /api/ujian` - Create ujian
- `GET /api/ujian/:id` - Get ujian details
- `PUT /api/ujian/:id` - Update ujian
- `DELETE /api/ujian/:id` - Delete ujian
- `POST /api/ujian/:id/questions` - Add question
- `PUT /api/ujian/questions/:id` - Update question
- `DELETE /api/ujian/questions/:id` - Delete question
- `GET /api/ujian/:id/results` - View all attempts/results

### Student Endpoints
- `GET /api/ujian/available` - List available ujian
- `POST /api/ujian/:id/start` - Start attempt
- `POST /api/ujian/attempts/:id/answer` - Submit answer
- `POST /api/ujian/attempts/:id/complete` - Complete ujian
- `GET /api/ujian/attempts/:id/results` - View own results

## Business Rules

1. **Question Selection**: If max_questions < total questions, randomly select questions
2. **Shuffle**: Apply at attempt creation, maintain same order throughout attempt
3. **Practice Mode**: Immediate feedback, cannot change answer after submission
4. **Resubmit**: If false, user can only attempt once
5. **Scoring**: Calculate as (points_earned / total_points) * 100
6. **Access Control**: Only creators can edit ujian, users can only see active ujian

## Validation Rules

### Ujian
- title: required, max 255 chars
- max_questions: integer > 0
- booleans: default false

### Questions
- question_text: required
- question_type: must be one of: mcq, multiple_select, input
- options: required for mcq/multiple_select, must be valid JSON array
- correct_answer: required, format depends on question_type
- points: integer >= 0

### Answers
- user_answer: required, format must match question_type
- For mcq: single option id
- For multiple_select: array of option ids
- For input: string value

## Example Data Structures

### MCQ Question Options
```json
{
  "options": [
    {"id": "a", "text": "Option A"},
    {"id": "b", "text": "Option B"},
    {"id": "c", "text": "Option C"}
  ],
  "correct_answer": "a"
}
```

### Multiple Select Question
```json
{
  "options": [
    {"id": "a", "text": "Option A"},
    {"id": "b", "text": "Option B"},
    {"id": "c", "text": "Option C"}
  ],
  "correct_answer": ["a", "c"]
}
```

### Input Question
```json
{
  "options": null,
  "correct_answer": "The correct text answer"
}
```
