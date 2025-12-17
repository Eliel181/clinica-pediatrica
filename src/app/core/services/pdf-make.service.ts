import { Injectable } from '@angular/core';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable({
  providedIn: 'root'
})
export class PdfMakeService {

  /**
   * Genera y abre un PDF en una nueva pestaña.
   * @param content Array de objetos de pdfMake (texto, listas, tablas, etc.)
   * @param title Título del documento (metadatos)
   */
  async generatePdf(content: any[], title: string = 'Reporte') {
    // Importación dinámica de pdfMake y fuentes
    const pdfMakeModule = await import('pdfmake/build/pdfmake');
    const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

    const pdfMake = pdfMakeModule.default || pdfMakeModule;
    const pdfFonts = pdfFontsModule.default || pdfFontsModule;

    // Configurar fuentes
    if (!(pdfMake as any).vfs) {
      (pdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs || (pdfFonts as any).vfs;
    }

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 60], // [izquierda, arriba, derecha, abajo]

      // Contenido Principal
      content: content,

      // Pie de página (Numeración)
      footer: (currentPage: number, pageCount: number) => {
        return {
          text: `Página ${currentPage} de ${pageCount}`,
          alignment: 'center',
          fontSize: 10,
          color: '#888',
          margin: [0, 20]
        };
      },

      // Estilos Globales
      styles: this.getGlobalStyles() as any,
      defaultStyle: {
        fontSize: 11,
        color: '#333'
      }
    };

    // Abrir en nueva ventana (evita descarga automática)
    (pdfMake as any).createPdf(docDefinition).open();
  }

  private getGlobalStyles() {
    return {
      clinicName: {
        fontSize: 14,
        bold: true,
        color: '#0d9488'
      },
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10],
        color: '#1e293b'
      },
      subheader: {
        fontSize: 14,
        bold: true,
        margin: [0, 10, 0, 5],
        color: '#334155'
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        fillColor: '#0d9488',
        color: '#ffffff'
      },
      label: {
        bold: true,
        color: '#000'
      },
      listStyle: {
        margin: [0, 5, 0, 15]
      }
    };
  }
}

