import { Router } from 'express';
import { createLead, getLeads, getLead, updateLead, getCRMStats, deleteLead, metaWebhookVerify, metaWebhookReceive, importLeads } from '../controllers/crmController';
import { protect, authorize } from '../middleware/auth';

const router = Router();

// Meta webhook — public (Facebook verification + receive)
router.get('/webhook/meta', metaWebhookVerify);
router.post('/webhook/meta', metaWebhookReceive);

// Public — landing page lead capture
router.post('/leads', createLead);

// Protected
router.use(protect);
router.get('/leads', authorize('superadmin', 'admin', 'manager', 'salesperson', 'employee', 'department_head', 'team_lead'), getLeads);
router.get('/stats', authorize('superadmin', 'admin', 'manager', 'employee', 'department_head', 'team_lead'), getCRMStats);
router.post('/leads/import', authorize('superadmin', 'admin'), importLeads);
router.get('/leads/:id', authorize('superadmin', 'admin', 'manager', 'salesperson', 'employee', 'department_head', 'team_lead'), getLead);
router.patch('/leads/:id', authorize('superadmin', 'admin', 'manager', 'salesperson', 'employee', 'department_head', 'team_lead'), updateLead);
router.delete('/leads/:id', authorize('superadmin', 'admin'), deleteLead);

export default router;
