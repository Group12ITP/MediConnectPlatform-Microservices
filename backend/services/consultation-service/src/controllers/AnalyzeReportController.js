const ReportService = require('../services/AnalyzeReportService');
const { error }     = require('../../utils/response');
const { referenceRanges } = require('../../utils/healthAnalyser');

// ─── Create Report (auto-analysed) ───────────────────────────────────────────
// POST /api/patient/:patientId/health-reports
exports.createReport = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const reportData = { ...req.body, patientId };

        const report = await ReportService.createReport(reportData);

        return res.status(201).json({
            ok:      true,
            message: 'Report created and analysed successfully.',
            data: {
                report,
                analysis: {
                    level:          report.analysis.level,
                    label:          report.analysis.label,
                    alertPriority:  report.analysis.alertPriority,
                    requiresDoctor: report.analysis.requiresDoctor,
                    message:        report.analysis.message,
                    advice:         report.analysis.advice,
                    parameters:     report.analysis.parameters,
                },
            },
        });
    } catch (err) {
        if (err.message && err.message.startsWith('Missing value')) {
            return error(res, 'Validation error: ' + err.message, 400, { detail: err.message });
        }
        next(err);
    }
};

// ─── Get Reports ──────────────────────────────────────────────────────────────
// GET /api/patient/:patientId/health-reports[?latest=true&type=SUGAR]
exports.getReports = async (req, res, next) => {
    try {
        const { patientId } = req.params;
        const reports = await ReportService.getReports(patientId, req.query);

        return res.status(200).json({
            ok:      true,
            message: 'Health reports retrieved successfully.',
            count:   reports.length,
            data:    reports,
        });
    } catch (err) {
        next(err);
    }
};

// ─── Reference Ranges ────────────────────────────────────────────────────────
// GET /api/patient/:patientId/health-reports/reference
// Returns the clinical threshold reference table — useful for UI education
exports.getReferenceRanges = (req, res) => {
    return res.status(200).json({
        ok:      true,
        message: 'Clinical reference ranges retrieved successfully.',
        data:    referenceRanges,
    });
};
