-- ============================================
-- QuizCraft (fast_q) - MySQL Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS fast_q
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE fast_q;

-- ----------------------------
-- 1. users
-- ----------------------------
CREATE TABLE users (
    id CHAR(36) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- ----------------------------
-- 2. refresh_tokens
-- ----------------------------
CREATE TABLE refresh_tokens (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_refresh_tokens_user (user_id),
    INDEX idx_refresh_tokens_hash (token_hash),
    CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 3. quizzes
-- ----------------------------
CREATE TABLE quizzes (
    id CHAR(36) NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    creator_id CHAR(36) NOT NULL,
    status ENUM('draft','published') NOT NULL DEFAULT 'draft',
    share_code VARCHAR(8) NOT NULL,
    access_mode ENUM('public','private') NOT NULL DEFAULT 'public',
    timer_type ENUM('per_quiz','per_question','none') NOT NULL DEFAULT 'none',
    time_limit_seconds INT UNSIGNED NOT NULL DEFAULT 300,
    shuffle_questions TINYINT(1) NOT NULL DEFAULT 0,
    show_results TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uq_quizzes_share_code (share_code),
    INDEX idx_quizzes_creator (creator_id),
    INDEX idx_quizzes_status (status),
    CONSTRAINT fk_quizzes_creator FOREIGN KEY (creator_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 4. questions
-- ----------------------------
CREATE TABLE questions (
    id CHAR(36) NOT NULL PRIMARY KEY,
    quiz_id CHAR(36) NOT NULL,
    type ENUM('multiple_choice','multiple_select','true_false','fill_blank') NOT NULL,
    text TEXT NOT NULL,
    correct_answers JSON NOT NULL,
    blank_words JSON DEFAULT NULL,
    max_selections INT UNSIGNED DEFAULT NULL,
    question_order INT UNSIGNED NOT NULL DEFAULT 0,
    points INT UNSIGNED NOT NULL DEFAULT 1,

    INDEX idx_questions_quiz (quiz_id),
    CONSTRAINT fk_questions_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 5. question_options
-- ----------------------------
CREATE TABLE question_options (
    id CHAR(36) NOT NULL PRIMARY KEY,
    question_id CHAR(36) NOT NULL,
    text VARCHAR(500) NOT NULL,
    option_order INT UNSIGNED NOT NULL DEFAULT 0,

    INDEX idx_options_question (question_id),
    CONSTRAINT fk_options_question FOREIGN KEY (question_id)
        REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 6. quiz_attempts
-- ----------------------------
CREATE TABLE quiz_attempts (
    id CHAR(36) NOT NULL PRIMARY KEY,
    quiz_id CHAR(36) NOT NULL,
    participant_id CHAR(36) DEFAULT NULL,
    participant_name VARCHAR(255) NOT NULL,
    score INT UNSIGNED NOT NULL DEFAULT 0,
    total_points INT UNSIGNED NOT NULL DEFAULT 0,
    percentage INT UNSIGNED NOT NULL DEFAULT 0,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NOT NULL,
    time_taken INT UNSIGNED NOT NULL DEFAULT 0,

    INDEX idx_attempts_quiz (quiz_id),
    INDEX idx_attempts_participant (participant_id),
    CONSTRAINT fk_attempts_quiz FOREIGN KEY (quiz_id)
        REFERENCES quizzes(id) ON DELETE CASCADE,
    CONSTRAINT fk_attempts_participant FOREIGN KEY (participant_id)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------
-- 7. attempt_answers
-- ----------------------------
CREATE TABLE attempt_answers (
    id CHAR(36) NOT NULL PRIMARY KEY,
    attempt_id CHAR(36) NOT NULL,
    question_id CHAR(36) NOT NULL,
    selected_answers JSON NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    time_taken INT UNSIGNED NOT NULL DEFAULT 0,

    INDEX idx_answers_attempt (attempt_id),
    INDEX idx_answers_question (question_id),
    CONSTRAINT fk_answers_attempt FOREIGN KEY (attempt_id)
        REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    CONSTRAINT fk_answers_question FOREIGN KEY (question_id)
        REFERENCES questions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------
-- 8. notifications
-- ----------------------------
CREATE TABLE notifications (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    type ENUM('attempt_completed','quiz_shared','system') NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT DEFAULT NULL,
    data JSON DEFAULT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_notifications_user_read (user_id, is_read),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;
