# Database Schema

This document outlines the database schema for the Asfus-Mobile application, inferred from the codebase usage.

## Tables

### `profiles`
Stores user information for Associates and Admins.
- **id**: `uuid` (Primary Key, Foreign Key to `auth.users`)
- **nome_completo**: `text`
- **email**: `text`
- **cpf**: `text` (Unique)
- **telefone**: `text`
- **matricula**: `text`
- **status**: `text` (Values: `'ativo'`, `'pendente'`, `'rejeitado'`)
- **role**: `text` (Values: `'admin'`, `'user'`)
- **codtipo**: `text`
- **chapa**: `text`
- **dt_nasc**: `text` (Date string)
- **sexo**: `text`

### `appointments`
Stores booking requests for leisure areas (`lazer`) and houses (`casa`).
- **id**: `bigint` (Primary Key)
- **user_id**: `uuid` (Foreign Key to `profiles.id`)
- **start_date**: `date`
- **end_date**: `date`
- **status**: `text` (Values: `'pendente'`, `'aprovado'`, `'rejeitado'`)
- **type**: `text` (Values: `'lazer'`, `'casa'`)
- **house_number**: `integer` (Nullable, required if `type` is 'casa')

### `news`
Stores news articles displayed on the home page.
- **id**: `bigint` (Primary Key)
- **title**: `text`
- **summary**: `text`
- **content_html**: `text`
- **image_url**: `text`
- **created_at**: `timestamp`

### `partners`
Stores partnership/agreement information.
- **id**: `bigint` (Primary Key)
- **name**: `text`
- **category**: `text`
- **benefit_desc**: `text`
- **logo_url**: `text`

### `events`
Stores upcoming events.
- **id**: `bigint` (Primary Key)
- **title**: `text`
- **description**: `text`
- **event_date**: `date`
- **location**: `text`
- **image_url**: `text`

### `gallery`
Stores images for the public gallery.
- **id**: `bigint` (Primary Key)
- **image_url**: `text`
- **caption**: `text`
- **created_at**: `timestamp`

## Storage Buckets
- **galeria**: Public images for the gallery.
- **content-images**: Images for News, Events, and Partners.
