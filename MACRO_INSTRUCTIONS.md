# Configuração da Planilha (Macro)

Para que o formulário funcione e salve os dados na sua planilha do Google, siga estes passos:

### 1. Criar o Script na Planilha
1. Abra sua planilha do Google.
2. Vá em **Extensões** -> **Apps Script**.
3. Apague todo o código que estiver lá e cole o código abaixo:

```javascript
/**
 * Script para processar inscrições do App ACAMPA CENTRAL 2028
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Adiciona uma nova linha com os dados
    sheet.appendRow([
      data.timestamp,
      data.name,
      data.whatsapp,
      data.interest,
      data.monthlyValue,
      data.paymentPreference,
      data.suggestions
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ "result": "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (f) {
    return ContentService.createTextOutput(JSON.stringify({ "result": "error", "error": f.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  if (e.parameter.action === 'stats') {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var rows = sheet.getDataRange().getValues();
    var totalRegistrations = rows.length - 1; // Exclui o cabeçalho
    var totalSim = 0;
    
    // Busca na coluna de "Interesse" (coluna 4, índice 3)
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][3] === 'Sim') {
        totalSim++;
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      totalSim: totalSim,
      totalRegistrations: totalRegistrations
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

### 2. Implantar como Web App
1. No editor do Apps Script, clique no botão azul **Implantar** -> **Nova implantação**.
2. Selecione o tipo de implantação: **App da Web**.
3. Em "Executar como", selecione **Eu**.
4. Em "Quem tem acesso", selecione **Qualquer pessoa** (Isso é importante para que o servidor do app possa enviar os dados).
5. Clique em **Implantar**.
6. **Importante:** Se for a primeira vez, o Google pedirá para autorizar o acesso à planilha. Siga os passos e clique em "Avançado" -> "Acessar (nome do seu projeto)" -> "Permitir".
7. Copie o **URL do app da Web** que será gerado. Ele termina em `/exec`.

### 3. Configurar no AI Studio
1. Volte para o AI Studio.
2. Vá em **Configurações (Settings)** -> **Secrets**.
3. Adicione um novo segredo com o nome: `APPS_SCRIPT_URL`.
4. No valor, cole o URL que você copiou do Google Apps Script.
5. Salve e reinicie o servidor do app se necessário.

---

### Por que está dando erro agora?
O erro acontece porque o app está tentando enviar os dados para um URL que ainda não existe ou não foi configurado nos **Secrets** do AI Studio. Assim que você realizar a configuração acima, o erro deve parar.
