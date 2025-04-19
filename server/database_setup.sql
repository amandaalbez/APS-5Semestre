-- Criar o banco de dados
CREATE DATABASE IF NOT EXISTS chatAps;

-- Usar o banco de dados
USE chatAps;

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    logged BOOLEAN DEFAULT FALSE
);

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    content VARCHAR(500) NOT NULL,
    username VARCHAR(100) NOT NULL,
    timestamp DATETIME NOT NULL
);

-- Criar tabela de arquivos
CREATE TABLE IF NOT EXISTS files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    size INT NOT NULL,
    username VARCHAR(100) NOT NULL,
    text_message VARCHAR(500),
    timestamp DATETIME NOT NULL
);