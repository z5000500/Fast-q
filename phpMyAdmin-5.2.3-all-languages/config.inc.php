<?php
/**
 * phpMyAdmin configuration for QuizCraft (fast_q)
 */

declare(strict_types=1);

/**
 * Blowfish secret for cookie-based auth (must be 32 chars).
 */
$cfg['blowfish_secret'] = 'QuizCraft2026SecretKey32Chars!!!';

/**
 * Server configuration
 */
$i = 0;
$i++;

$cfg['Servers'][$i]['auth_type'] = 'cookie';
$cfg['Servers'][$i]['host'] = '127.0.0.1';
$cfg['Servers'][$i]['port'] = '3306';
$cfg['Servers'][$i]['compress'] = false;
$cfg['Servers'][$i]['AllowNoPassword'] = true;

/**
 * Directories for saving/loading files from server
 */
$cfg['UploadDir'] = '';
$cfg['SaveDir'] = '';

/**
 * Temp directory
 */
$cfg['TempDir'] = __DIR__ . '/tmp';
