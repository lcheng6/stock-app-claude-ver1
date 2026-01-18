import { jsPDF } from 'jspdf';
import { StockReport } from '@/types/stock';

export function generatePDF(report: StockReport): Buffer {
  const doc = new jsPDF();

  let yPos = 20;

  doc.setFontSize(20);
  doc.text(`Stock Report: ${report.symbol}`, 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 20, yPos);
  yPos += 15;

  doc.setFontSize(14);
  doc.text('Price Summary', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(`Current Price: $${report.price.current.toFixed(2)}`, 25, yPos);
  yPos += 6;
  doc.text(
    `Change: ${report.price.change >= 0 ? '+' : ''}${report.price.change.toFixed(2)} (${
      report.price.changePercent >= 0 ? '+' : ''
    }${report.price.changePercent.toFixed(2)}%)`,
    25,
    yPos
  );
  yPos += 10;

  doc.setFontSize(14);
  doc.text('Sentiment Analysis', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.text(
    `Overall Score: ${(report.sentiment.sentiment.overall * 100).toFixed(0)}%`,
    25,
    yPos
  );
  yPos += 6;
  doc.text(
    `Positive: ${(report.sentiment.sentiment.positive * 100).toFixed(1)}%`,
    25,
    yPos
  );
  yPos += 6;
  doc.text(
    `Negative: ${(report.sentiment.sentiment.negative * 100).toFixed(1)}%`,
    25,
    yPos
  );
  yPos += 6;
  doc.text(
    `Neutral: ${(report.sentiment.sentiment.neutral * 100).toFixed(1)}%`,
    25,
    yPos
  );
  yPos += 6;
  doc.text(
    `Confidence: ${(report.sentiment.sentiment.confidence * 100).toFixed(0)}%`,
    25,
    yPos
  );
  yPos += 10;

  doc.setFontSize(14);
  doc.text('Summary', 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  const summaryLines = doc.splitTextToSize(report.summary, 170);
  doc.text(summaryLines, 25, yPos);
  yPos += summaryLines.length * 6 + 10;

  doc.setFontSize(14);
  doc.text('Recent Sources', 20, yPos);
  yPos += 8;

  doc.setFontSize(9);
  const maxSources = 10;
  for (let i = 0; i < Math.min(report.sentiment.sources.length, maxSources); i++) {
    const source = report.sentiment.sources[i];

    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFont(undefined, 'bold');
    const titleLines = doc.splitTextToSize(source.title, 160);
    doc.text(titleLines, 25, yPos);
    yPos += titleLines.length * 5;

    doc.setFont(undefined, 'normal');
    doc.text(`Source: ${source.source} | ${new Date(source.timestamp).toLocaleDateString()}`, 25, yPos);
    yPos += 5;

    if (source.url) {
      doc.setTextColor(0, 0, 255);
      doc.textWithLink(source.url.substring(0, 60), 25, yPos, { url: source.url });
      doc.setTextColor(0, 0, 0);
      yPos += 5;
    }

    yPos += 5;
  }

  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
