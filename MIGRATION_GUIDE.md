# Guia de Migração - Asfus Mobile
Este guia explica passo-a-passo como migrar seu projeto do Supabase atual para um novo.

## Pré-requisitos
- Node.js instalado no seu computador.
- Acesso ao Dashboard do Supabase (projeto antigo e novo).

---

## 1. Migração do Banco de Dados (Schema)

1.  Acesse o **Dashboard** do seu **NOVO** projeto Supabase.
2.  Vá em **SQL Editor**.
3.  Clique em **New Query**.
4.  Copie todo o conteúdo do arquivo localizado em `full_schema.sql` no seu projeto:
    - [Abrir full_schema.sql](file:///Users/kevenwilliam2015gmail.com/Desktop/new/Asfus-Mobile/full_schema.sql)
5.  Cole no editor e clique em **Run**.
    - Isso criará todas as tabelas (profiles, news, gallery, etc.) e políticas de segurança.

---

## 2. Migração de Usuários (Auth)

Para manter as senhas dos usuários funcionando, você deve exportar e importar via painel.

1.  Acesse o Dashboard do projeto **ANTIGO**.
2.  Vá em **Authentication** -> **Users**.
3.  Clique no botão **Export Users** (canto superior direito) e escolha **CSV**.
4.  Acesse o Dashboard do projeto **NOVO**.
5.  Vá em **Authentication** -> **Users**.
6.  Clique em **Import Users** e selecione o arquivo CSV baixado.
    - Isso criará os usuários na tabela `auth.users` com os mesmos IDs e hashes de senha.

---

## 3. Migração de Dados (Tabelas Públicas)

Agora que os usuários existem (`auth.users`), podemos migrar os dados de perfil e outras tabelas.

### Passo 3.1: Configurar Variáveis
1.  Certifique-se que o arquivo `.env.local` tem as chaves do projeto **ANTIGO**.
2.  Abra um terminal na pasta do projeto.

### Passo 3.2: Backup dos Dados
Execute o script para baixar os dados do projeto antigo:

```bash
node scripts/migration/backup_data.js
```

Isso criará uma pasta `backup_data` com arquivos JSON.

### Passo 3.3: Restaurar Dados
Execute o script de restauração, passando as chaves do **NOVO** projeto:

```bash
# Substitua as URLs e CHAVES pelos dados do seu NOVO projeto
NEW_SUPABASE_URL="https://sua-url-nova.supabase.co" \
NEW_SUPABASE_KEY="sua-service-role-key-nova" \
node scripts/migration/restore_data.js
```

> **Dica**: Use a `service_role` key (chave secreta) para garantir que o script tenha permissão de gravar tudo, ignorando regras de RLS temporariamente.

---

## 4. Migração de Arquivos (Storage)

Se o seu projeto usa Storage (imagens, avatares):

1.  Crie os Buckets no novo projeto (ex: `avatars`, `images`, `documents`) via Dashboard -> Storage.
    - O script não cria os buckets, apenas copia arquivos. Certifique-se de que sejam Públicos se necessário.
2.  Execute o script de migração:

```bash
NEW_SUPABASE_URL="https://sua-url-nova.supabase.co" \
NEW_SUPABASE_KEY="sua-service-role-key-nova" \
node scripts/migration/migrate_storage.js
```

Se tiver buckets com nomes diferentes, edite a lista `BUCKETS` no arquivo `scripts/migration/migrate_storage.js`.

---

## 5. Finalização

1.  Atualize seu arquivo `.env.local` com as chaves do **NOVO** projeto.
2.  Reinicie seu servidor de desenvolvimento:
    ```bash
    npm run dev
    ```
3.  Teste o login e verifique se os dados aparecem corretamente.
