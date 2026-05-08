
import { jsPDF } from 'jspdf';

export const generateEngagementPDF = (tontineName, userName, date) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129); // Primary color
  doc.text('Engagement d\'Adhésion', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Tontine: ${tontineName}`, 20, 40);
  doc.text(`Membre: ${userName}`, 20, 50);
  doc.text(`Date: ${date}`, 20, 60);
  
  doc.setFontSize(14);
  doc.text('Déclaration d\'engagement:', 20, 80);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'italic');
  const text = `Je soussigné(e) ${userName}, m'engage formellement à respecter toutes les clauses, règles de gestion et délais de paiement de la tontine "${tontineName}". Je reconnais que tout retard ou défaut de paiement pourra entraîner des pénalités selon le règlement intérieur.`;
  const splitText = doc.splitTextToSize(text, 170);
  doc.text(splitText, 20, 90);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Signature du membre:', 120, 140);
  doc.text('_______________________', 120, 160);
  
  return doc.output('blob');
};

export const generateReceiptPDF = (amount, date, tontineName, rank, userName) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  doc.text('Reçu de Paiement', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Date: ${date}`, 20, 40);
  doc.text(`Membre: ${userName}`, 20, 50);
  doc.text(`Tontine: ${tontineName}`, 20, 60);
  if (rank) doc.text(`Rang: ${rank}`, 20, 70);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Montant payé: ${amount} CFA`, 20, 90);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Ce reçu est généré électroniquement et fait office de preuve de paiement.', 105, 280, { align: 'center' });
  
  return doc.output('blob');
};

export const generateDistributionReportPDF = (distribution, tontine, beneficiary) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(16, 185, 129);
  doc.text('Rapport de Distribution', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Tontine: ${tontine.nom}`, 20, 40);
  doc.text(`Bénéficiaire: ${beneficiary.name || beneficiary.nom_complet}`, 20, 50);
  doc.text(`Cycle: ${distribution.cycle_number}`, 20, 60);
  doc.text(`Date de distribution: ${new Date(distribution.date_distribution).toLocaleDateString('fr-FR')}`, 20, 70);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Montant distribué: ${distribution.montant_distribue} CFA`, 20, 90);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Signature de l\'organisateur:', 120, 140);
  doc.text('_______________________', 120, 160);
  
  return doc.output('blob');
};

export const generateMemberDistributionHistoryPDF = (member, distributions) => {
  const doc = new jsPDF();
  
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235);
  doc.text('Historique des Distributions', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(30, 41, 59);
  doc.text(`Membre: ${member.name}`, 20, 40);
  doc.text(`Date d'émission: ${new Date().toLocaleDateString('fr-FR')}`, 20, 50);
  
  let y = 70;
  doc.setFont('helvetica', 'bold');
  doc.text('Cycle', 20, y);
  doc.text('Date', 60, y);
  doc.text('Montant', 120, y);
  
  doc.setFont('helvetica', 'normal');
  y += 10;
  distributions.forEach(d => {
    doc.text(d.cycle_number.toString(), 20, y);
    doc.text(new Date(d.date_distribution).toLocaleDateString('fr-FR'), 60, y);
    doc.text(`${d.montant_distribue} CFA`, 120, y);
    y += 10;
  });
  
  return doc.output('blob');
};
