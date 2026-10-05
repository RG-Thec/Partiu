/**
 * Utilitário de Exportação de Dados para CSV com suporte nativo a caracteres PT-BR (BOM UTF-8)
 */
export function exportarParaCSV(nomeArquivo: string, cabecalhos: string[], linhas: (string | number)[][]) {
  const sanitize = (val: string | number) => {
    const str = String(val ?? "");
    if (str.includes(";") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const conteudoCsv = [
    cabecalhos.map(sanitize).join(";"),
    ...linhas.map((linha) => linha.map(sanitize).join(";")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + conteudoCsv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${nomeArquivo.replace(/\.csv$/, "")}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
