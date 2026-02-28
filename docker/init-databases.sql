-- docker/init-databases.sql
-- Runs once on first container start via docker-entrypoint-initdb.d
-- Creates users and databases for all services.
-- The framedle database is created automatically by POSTGRES_DB in docker-compose.yml.

-- Create users for each service
CREATE USER logto WITH PASSWORD 'logto_password';
CREATE USER umami WITH PASSWORD 'umami_password';
CREATE USER glitchtip WITH PASSWORD 'glitchtip_password';

-- Create databases
CREATE DATABASE logto OWNER logto;
CREATE DATABASE umami OWNER umami;
CREATE DATABASE glitchtip OWNER glitchtip;

-- framedle database uses the default postgres user
-- Extensions for the framedle database
\c framedle
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
