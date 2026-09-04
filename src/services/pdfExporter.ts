import { jsPDF } from 'jspdf';

/**
 * Exporta el canvas renderizado a un PDF con el tamaño milimétrico exacto del código Java:
 * 195mm x 282mm (página personalizada lista para impresión a escala real).
 */
export function exportToPDF(canvas: HTMLCanvasElement, filename = 'funko-pop-molde.pdf') {
  const widthMm = 195;
  const heightMm = 282;

  // Orientación portrait, unidad milímetros, formato customizado [195, 282]
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [widthMm, heightMm],
  });

  const imgData = canvas.toDataURL('image/png');

  // Añadir la imagen ajustada a la página tal como hacía PDFBox
  pdf.addImage(imgData, 'PNG', 0, 0, widthMm, heightMm);

  pdf.save(filename);
}

/**
 * Descarga el canvas directamente como imagen PNG
 */
export function exportToPNG(canvas: HTMLCanvasElement, filename = 'funko-pop-molde.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
