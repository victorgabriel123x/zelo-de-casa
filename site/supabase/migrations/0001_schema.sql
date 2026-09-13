-- Zelo de Casa | esquema inicial
-- Todas as tabelas ficam com RLS habilitado e sem policies publicas.
-- O acesso acontece apenas pelo servidor, com a service role key, nunca pelo navegador.

create extension if not exists "pgcrypto";

-- Catalogo -------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  ativo boolean not null default true,
  vendas_pausadas boolean not null default false,
  criado_em timestamptz not null default now()
);

create table if not exists variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  voltagem text not null check (voltagem in ('127','220')),
  sku text not null unique,
  preco_centavos integer not null check (preco_centavos > 0),
  ativo boolean not null default true,
  unique (product_id, voltagem)
);

-- Pedidos --------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  nome text not null,
  cpf text not null,
  email text not null,
  whatsapp text not null,
  cep text not null,
  logradouro text not null,
  numero_endereco text not null default '',
  sem_numero boolean not null default false,
  complemento text not null default '',
  bairro text not null,
  cidade text not null,
  estado text not null,
  cupom text,
  subtotal_centavos integer not null check (subtotal_centavos >= 0),
  desconto_centavos integer not null default 0 check (desconto_centavos >= 0),
  frete_centavos integer not null default 0 check (frete_centavos >= 0),
  total_centavos integer not null check (total_centavos >= 0),
  status_financeiro text not null default 'CRIADO',
  status_logistico text not null default 'AGUARDANDO_PAGAMENTO',
  evento_compra_registrado boolean not null default false,
  observacoes_internas text not null default '',
  reembolso_solicitado_em timestamptz,
  reembolso_concluido_em timestamptz,
  reembolso_valor_centavos integer
);

create index if not exists orders_criado_em_idx on orders (criado_em desc);
create index if not exists orders_status_idx on orders (status_financeiro, status_logistico);
create index if not exists orders_email_idx on orders (email);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  voltagem text not null check (voltagem in ('127','220')),
  sku text not null,
  descricao text not null,
  quantidade integer not null check (quantidade > 0),
  preco_unitario_centavos integer not null check (preco_unitario_centavos > 0),
  desconto_centavos integer not null default 0 check (desconto_centavos >= 0),
  unique (order_id, voltagem)
);

-- Pagamentos -----------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  asaas_payment_id text unique,
  asaas_customer_id text,
  forma text not null check (forma in ('PIX','CARTAO')),
  parcelas integer not null default 1 check (parcelas between 1 and 21),
  valor_centavos integer not null check (valor_centavos > 0),
  status text not null default 'CRIADO',
  chave_idempotencia text not null unique,
  ativo boolean not null default true,
  pix_copia_e_cola text,
  pix_imagem_base64 text,
  pix_expira_em timestamptz,
  mensagem_recusa text,
  demonstracao boolean not null default false,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- Apenas uma tentativa ativa por pedido.
create unique index if not exists payments_uma_tentativa_ativa
  on payments (order_id) where ativo;

-- Cupons ---------------------------------------------------------------------
create table if not exists coupons (
  codigo text primary key,
  tipo text not null check (tipo in ('PERCENTUAL','VALOR')),
  valor integer not null check (valor > 0),
  minimo_centavos integer not null default 0 check (minimo_centavos >= 0),
  inicio_em timestamptz,
  fim_em timestamptz,
  limite_usos integer check (limite_usos > 0),
  usos integer not null default 0 check (usos >= 0),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists coupon_redemptions (
  id uuid primary key default gen_random_uuid(),
  codigo text not null references coupons(codigo) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  criado_em timestamptz not null default now(),
  unique (order_id)
);

-- Resgate atomico: trava a linha do cupom, confere limite e grava o uso.
create or replace function resgatar_cupom(p_codigo text, p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  c coupons%rowtype;
begin
  select * into c from coupons where codigo = p_codigo for update;
  if not found or not c.ativo then
    return false;
  end if;
  if c.inicio_em is not null and c.inicio_em > now() then
    return false;
  end if;
  if c.fim_em is not null and c.fim_em < now() then
    return false;
  end if;
  if c.limite_usos is not null and c.usos >= c.limite_usos then
    return false;
  end if;

  insert into coupon_redemptions (codigo, order_id) values (p_codigo, p_order_id)
  on conflict (order_id) do nothing;

  if not found then
    -- o pedido ja tinha resgate registrado
    return true;
  end if;

  update coupons set usos = usos + 1 where codigo = p_codigo;
  return true;
end;
$$;

-- Logistica e documentos -----------------------------------------------------
create table if not exists shipments (
  order_id uuid primary key references orders(id) on delete cascade,
  transportadora text not null,
  codigo text not null,
  url text,
  postado_em timestamptz,
  atualizado_em timestamptz not null default now()
);

create table if not exists invoices (
  order_id uuid primary key references orders(id) on delete cascade,
  caminho text not null,
  hash text not null,
  nome_arquivo text not null,
  enviada_em timestamptz not null default now()
);

-- Comunicacao ----------------------------------------------------------------
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  evento text not null,
  canal text not null check (canal in ('EMAIL','WHATSAPP')),
  destinatario text not null,
  chave_deduplicacao text not null unique,
  tentativas integer not null default 0,
  status text not null default 'PENDENTE' check (status in ('PENDENTE','ACEITA','FALHA','IGNORADA')),
  erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists notifications_pendentes_idx on notifications (status, criado_em);

create table if not exists webhook_events (
  id text primary key,
  evento text not null,
  payload jsonb not null,
  recebido_em timestamptz not null default now(),
  processado_em timestamptz
);

-- Seguranca e auditoria ------------------------------------------------------
create table if not exists admin_audit (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  ator text not null,
  acao text not null,
  recurso text not null,
  detalhes jsonb not null default '{}'::jsonb
);

create table if not exists legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  termos boolean not null,
  privacidade boolean not null,
  whatsapp_opt_in boolean not null default false,
  ip text,
  user_agent text,
  criado_em timestamptz not null default now()
);

create table if not exists admin_challenges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  codigo_hash text not null,
  expira_em timestamptz not null,
  tentativas integer not null default 0,
  reenvios integer not null default 0,
  consumido boolean not null default false,
  criado_em timestamptz not null default now()
);

create index if not exists admin_challenges_email_idx on admin_challenges (email, criado_em desc);

create table if not exists order_access_tokens (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  token_hash text not null unique,
  expira_em timestamptz not null,
  usado_em timestamptz,
  criado_em timestamptz not null default now()
);

-- RLS ------------------------------------------------------------------------
-- Nenhuma policy e criada de proposito: com RLS ligado e sem policy, apenas a
-- service role (usada somente no servidor) enxerga as linhas. A chave anon do
-- Supabase nao deve ser usada por este projeto.
do $$
declare t text;
begin
  foreach t in array array[
    'products','variants','orders','order_items','payments','coupons',
    'coupon_redemptions','shipments','invoices','notifications','webhook_events',
    'admin_audit','legal_acceptances','admin_challenges','order_access_tokens'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force row level security', t);
  end loop;
end $$;

-- Catalogo inicial -----------------------------------------------------------
insert into products (slug, nome) values ('mini-processador-britania-2p', 'Mini Processador Britânia 2P')
on conflict (slug) do nothing;

insert into variants (product_id, voltagem, sku, preco_centavos)
select p.id, v.voltagem, v.sku, 20000
from products p
cross join (values ('127','MP2P-PRETO-127'), ('220','MP2P-PRETO-220')) as v(voltagem, sku)
where p.slug = 'mini-processador-britania-2p'
on conflict (sku) do nothing;
