-- Dados de demonstracao. Nao rodar em producao.
insert into coupons (codigo, tipo, valor, minimo_centavos, limite_usos, ativo)
values
  ('BEMVINDO10', 'PERCENTUAL', 10, 20000, 50, true),
  ('FRETEMAIS20', 'VALOR', 2000, 40000, 20, true)
on conflict (codigo) do nothing;
