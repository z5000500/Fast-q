-- ============================================
-- QuizCraft (fast_q) - Seed Data
-- ============================================

USE fast_q;

-- Demo user (password: "password123" hashed with bcrypt)
INSERT INTO users (id, email, display_name, password_hash) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'demo@quizcraft.com', 'Demo User', '$2y$12$LJ3m4yPnMDEPdQ0Bs.X8CeQF0K5TzDBKqGYpGHfMxZW9JdKsJZKPa'),
('550e8400-e29b-41d4-a716-446655440002', 'alice@quizcraft.com', 'Alice Smith', '$2y$12$LJ3m4yPnMDEPdQ0Bs.X8CeQF0K5TzDBKqGYpGHfMxZW9JdKsJZKPa');

-- Sample quiz
INSERT INTO quizzes (id, title, description, creator_id, status, share_code, access_mode, timer_type, time_limit_seconds, shuffle_questions, show_results) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'General Knowledge Quiz', 'Test your general knowledge with this fun quiz!', '550e8400-e29b-41d4-a716-446655440001', 'published', 'GK2024', 'public', 'per_quiz', 600, 0, 1);

-- Sample questions
INSERT INTO questions (id, quiz_id, type, text, correct_answers, blank_words, max_selections, question_order, points) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'multiple_choice', 'What is the capital of France?', '["opt-paris"]', NULL, NULL, 0, 1),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', 'true_false', 'The Earth is flat.', '["opt-false"]', NULL, NULL, 1, 1),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'fill_blank', 'The chemical symbol for water is ___.', '["H2O"]', '["H2O", "CO2", "NaCl", "O2"]', NULL, 2, 2);

-- Sample options
INSERT INTO question_options (id, question_id, text, option_order) VALUES
('opt-paris',  '770e8400-e29b-41d4-a716-446655440001', 'Paris',  0),
('opt-london', '770e8400-e29b-41d4-a716-446655440001', 'London', 1),
('opt-berlin', '770e8400-e29b-41d4-a716-446655440001', 'Berlin', 2),
('opt-madrid', '770e8400-e29b-41d4-a716-446655440001', 'Madrid', 3),
('opt-true',   '770e8400-e29b-41d4-a716-446655440002', 'True',   0),
('opt-false',  '770e8400-e29b-41d4-a716-446655440002', 'False',  1);
