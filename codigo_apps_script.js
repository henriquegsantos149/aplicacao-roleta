function doPost(e) {
  try {
    // Acessa a aba ativa da planilha onde o script está vinculado
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Pega o conteúdo da requisição POST feita pelo chatbot
    var body = e.postData.contents;
    var data = JSON.parse(body);
    
    // Organiza os dados recebidos na ordem desejada:
    // Nome - Email - Telefone/whatsapp - Se é formado ou não - Formação - Cargo/Empresa
    // Adicionamos a data/hora do cadastro na primeira coluna.
    var rowData = [
      new Date(),       // Data e Hora do preenchimento
      data.nome       || "",
      data.email      || "",
      data.telefone   || "",
      data.formado    || "",
      data.formacao   || "",
      data.cargo      || ""
    ];
    
    // Adiciona uma nova linha com os dados
    sheet.appendRow(rowData);
    
    // Retorna sucesso para o navegador (mesmo que com no-cors ele não consiga ler)
    return ContentService.createTextOutput(JSON.stringify({ "status": "success" }))
                         .setMimeType(ContentService.MimeType.JSON);
                         
  } catch (error) {
    // Retorna o erro, caso aconteça algum problema
    return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.message }))
                         .setMimeType(ContentService.MimeType.JSON);
  }
}
