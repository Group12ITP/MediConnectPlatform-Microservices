const PatientReport = require('../models/PatientReport');
const { analyse } = require('../../utils/healthAnalyser');

class ReportService {
  async createReport(data) {
    const { type, value } = data;
    const analysis = analyse(type, value);

    return PatientReport.create({
      ...data,
      classification: analysis.level,
      analysis,
      thresholdVersion: 'WHO-ADA-AHA-2023',
    });
  }

  async getReports(patientId, options = {}) {
    const { latest, type } = options;
    const query = { patientId };
    if (type) query.type = type;

    if (latest === 'true') {
      const types = ['SUGAR', 'CHOLESTEROL', 'BLOOD_PRESSURE'];
      const reports = [];
      for (const t of types) {
        const r = await PatientReport.findOne({ patientId, type: t }).sort({ createdAt: -1 });
        if (r) reports.push(r);
      }
      return reports;
    }

    return PatientReport.find(query).sort({ createdAt: -1 });
  }
}

module.exports = new ReportService();

