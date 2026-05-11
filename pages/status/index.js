import useSWR from "swr";

async function fetchApi(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  const { data, isLoading } = useSWR("/api/v1/status", fetchApi, {
    refreshInterval: 2000,
  });

  return (
    <>
      <h1>Status</h1>
      <div>{isLoading ? "Carregando" : <Status data={data} />}</div>
    </>
  );
}

function Status({ data }) {
  return (
    <div>
      <p>
        Última atualização: {new Date(data.updated_at).toLocaleString("pt-BR")}
      </p>
      <h2>Informações do Banco de Dados:</h2>
      <ul>
        <li>
          Conexões Possíveis: {data.dependencies.database.max_connections}
        </li>
        <li>
          Conexões Abertas: {data.dependencies.database.opened_connections}
        </li>
        <li>Versão Postgres: {data.dependencies.database.version}</li>
      </ul>
    </div>
  );
}
