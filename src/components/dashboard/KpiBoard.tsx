// ACTUALIZACIÓN DE TEXTOS EN KpiBoard.tsx
// Función generateFiscalSummary actualizada:

const generateFiscalSummary = (): string => {
  if (!data) return 'Revisando tu situación fiscal...';
  
  const { iva, irpf, sociedades } = data.fiscal;
  let messages: string[] = [];
  
  if (iva.diferencia > 0) {
    messages.push(`Este trimestre pagarás ${iva.diferencia.toLocaleString()}€ de IVA`);
  } else if (iva.diferencia < 0) {
    messages.push(`Hacienda te debe devolver ${Math.abs(iva.diferencia).toLocaleString()}€ de IVA`);
  }
  
  if (irpf.diferencia < 0) {
    messages.push(`Hacienda te debe ${Math.abs(irpf.diferencia).toLocaleString()}€ de IRPF`);
  } else if (irpf.diferencia > 0) {
    messages.push(`Este trimestre pagarás ${irpf.diferencia.toLocaleString()}€ de IRPF`);
  }
  
  if (sociedades.resultado < 0) {
    messages.push(`No hay impuesto de sociedades porque el resultado ha sido negativo`);
  } else if (sociedades.impuesto > 0) {
    messages.push(`Este año pagarás ${sociedades.impuesto.toLocaleString()}€ de impuesto de sociedades`);
  }
  
  return messages.length > 0 ? messages.join('. ') + '.' : 'Tu situación fiscal está equilibrada.';
};

// TEXTOS PARA LAS TARJETAS FISCALES:

// IVA Card - Contenido actualizado:
<div className="text-center">
  <div className="text-3xl font-bold mb-2">
    {formatCurrency(Math.abs(data.fiscal.iva.diferencia))}
  </div>
  <div className="text-base font-medium mb-2 text-gray-700">
    {data.fiscal.iva.diferencia > 0 ? 'Este trimestre pagarás' : 'Hacienda te debe'}
  </div>
  <Badge variant={data.fiscal.iva.diferencia > 0 ? "destructive" : "secondary"} className="text-sm font-semibold">
    {data.fiscal.iva.diferencia > 0 ? 'A INGRESAR' : 'A DEVOLVER'}
  </Badge>
</div>
<div className="grid grid-cols-2 gap-4 text-sm">
  <div>
    <div className="text-gray-600">Lo que cobraste</div>
    <div className="font-semibold">{formatCurrency(data.fiscal.iva.repercutido)}</div>
  </div>
  <div>
    <div className="text-gray-600">Lo que pagaste</div>
    <div className="font-semibold">{formatCurrency(data.fiscal.iva.soportado)}</div>
  </div>
</div>

// IRPF Card - Contenido actualizado:
<div className="text-center">
  <div className="text-3xl font-bold mb-2">
    {formatCurrency(Math.abs(data.fiscal.irpf.diferencia))}
  </div>
  <div className="text-base font-medium mb-2 text-gray-700">
    {data.fiscal.irpf.diferencia < 0 ? 'Hacienda te debe' : 'Este trimestre pagarás'}
  </div>
  <Badge variant={data.fiscal.irpf.diferencia < 0 ? "secondary" : "destructive"} className="text-sm font-semibold">
    {data.fiscal.irpf.diferencia < 0 ? 'A DEVOLVER' : 'A INGRESAR'}
  </Badge>
</div>
<div className="grid grid-cols-2 gap-4 text-sm">
  <div>
    <div className="text-gray-600">Retenciones hechas</div>
    <div className="font-semibold">{formatCurrency(data.fiscal.irpf.practicadas)}</div>
  </div>
  <div>
    <div className="text-gray-600">Retenciones recibidas</div>
    <div className="font-semibold">{formatCurrency(data.fiscal.irpf.soportadas)}</div>
  </div>
</div>

// Impuesto Sociedades Card - Contenido actualizado:
<div className="text-center">
  <div className="text-3xl font-bold mb-2">
    {formatCurrency(data.fiscal.sociedades.impuesto)}
  </div>
  <div className="text-base font-medium mb-2 text-gray-700">
    {data.fiscal.sociedades.resultado < 0 ? 'Sin impuesto este año' : 'Este año pagarás'}
  </div>
  <Badge variant="secondary" className="text-sm font-semibold">
    {data.fiscal.sociedades.resultado < 0 ? 'RESULTADO NEGATIVO' : data.fiscal.sociedades.status}
  </Badge>
</div>
<div className="text-center text-sm">
  <div className="text-gray-600">Resultado del ejercicio</div>
  <div className={`font-semibold ${data.fiscal.sociedades.resultado < 0 ? 'text-red-600' : 'text-green-600'}`}>
    {formatCurrency(data.fiscal.sociedades.resultado)}
  </div>
</div>