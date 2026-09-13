export function Pendente({ children }: { children: string }) {
  return (
    <span className="pendente" role="note">
      Pendente de cadastro: {children}
    </span>
  );
}

export function AvisoPendencias() {
  return (
    <p className="aviso aviso--neutro">
      Esta página ainda depende de dados que o lojista precisa cadastrar antes da publicação. Os
      trechos marcados como pendentes não foram preenchidos e não devem ser tratados como
      informação oficial.
    </p>
  );
}
